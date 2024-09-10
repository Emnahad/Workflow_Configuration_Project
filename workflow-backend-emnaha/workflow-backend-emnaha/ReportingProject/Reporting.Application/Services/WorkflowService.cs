using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web;
using System.Web.Services.Description;
using MongoDB.Bson;
using MongoDB.Driver;
using Reporting.Core.Entities;
using Reporting.Core.IService;

namespace Reporting.Application.Services
{
    public class WorkflowService : IWorkflowService
    {
        private readonly ICheckHistoricService _checkHistoricService;

        private readonly IMongoCollection<Workflow> _workflows;
        private readonly ISettingsService _settingsService;
        private readonly IDatabaseService _databaseService;
        public WorkflowService(IMongoDatabase database, ISettingsService settingsService,IDatabaseService databaseService, ICheckHistoricService checkHistoricService)
        {
            _workflows = database.GetCollection<Workflow>("workflows");
            _settingsService = settingsService;
            _databaseService = databaseService;
            _checkHistoricService = checkHistoricService;

        }

        public async Task<List<Workflow>> GetWorkflowsAsync()
        {
            try
            {
                // Retrieve all workflows from the database
                var workflows = await _workflows.Find(workflow => true).ToListAsync();

                // Restore original node IDs for each workflow
                foreach (var workflow in workflows)
                {
                    if (workflow.Root != null && workflow.OriginalNodeIdMappings != null)
                    {
                        RestoreOriginalNodeIds(workflow.Root, workflow.OriginalNodeIdMappings);
                    }
                }

                return workflows;
            }
            catch (Exception ex)
            {
                // Handle exception, possibly log it
                throw new ApplicationException("An error occurred while retrieving workflows.", ex);
            }
        }



        public async Task<Workflow> GetWorkflowByIdAsync(string id)
        {
            try
            {
                Console.WriteLine($"Retrieving workflow with ID: {id}"); // Debugging statement

                var workflow = await _workflows.Find(w => w.Id == id).FirstOrDefaultAsync();
                if (workflow != null)
                {
                    Console.WriteLine($"Workflow found. ID: {workflow.Id}"); // Debugging statement

                    if (workflow.Root != null)
                    {
                        // Restore original IDs if needed
                        Console.WriteLine("Restoring original node IDs..."); // Debugging statement
                        RestoreOriginalNodeIds(workflow.Root, workflow.OriginalNodeIdMappings);
                        Console.WriteLine("Original node IDs restored."); // Debugging statement
                    }
                }
                else
                {
                    Console.WriteLine("No workflow found with the provided ID."); // Debugging statement
                }

                return workflow;
            }
            catch (Exception ex)
            {
                // Handle exception, possibly log it
                Console.WriteLine($"Exception occurred: {ex.Message}");
                throw new ApplicationException($"An error occurred while retrieving the workflow with ID {id}.", ex);
            }
        }


        private void RestoreOriginalNodeIds(WorkflowNode node, Dictionary<string, string> idMappings)
        {
            if (node != null)
            {
                // Log the ID being restored
                Console.WriteLine($"Attempting to restore ID for node: {node.Id}");

                // Restore the original ID if it exists in the dictionary
                if (idMappings.TryGetValue(node.Id, out var originalId))
                {
                    Console.WriteLine($"Original ID found for node: {node.Id}, restoring to: {originalId}");
                    node.Id = originalId;
                }
                else
                {
                    Console.WriteLine($"No original ID found for node: {node.Id}");
                }

                // Recursively restore IDs of child nodes
                foreach (var child in node.Children ?? new List<WorkflowNode>())
                {
                    RestoreOriginalNodeIds(child, idMappings);
                }
            }
        }

        public async Task CreateWorkflowAsync(Workflow workflow)
        {
            try
            {
                // Store original IDs before any transformation
                if (workflow.Root != null)
                {
                    StoreOriginalNodeIds(workflow, workflow.Root);
                }

                // Print the original and transformed ID
                Console.WriteLine($"Original ID: {workflow.Id}");

                if (workflow.Id != null && ObjectId.TryParse(workflow.Id, out var objectId))
                {
                    workflow.Id = objectId.ToString();
                }
                else
                {
                    // Generate a new ObjectId if the ID is invalid or not provided
                    workflow.Id = ObjectId.GenerateNewId().ToString();
                }

                Console.WriteLine($"Transformed ID: {workflow.Id}");

                await _workflows.InsertOneAsync(workflow);
            }
            catch (Exception ex)
            {
                // Handle exception, possibly log it
                throw new ApplicationException("An error occurred while creating the workflow.", ex);
            }
        }

        private void StoreOriginalNodeIds(Workflow workflow, WorkflowNode node)
        {
            if (node != null)
            {
                Console.WriteLine($"Processing node with ID: {node.Id}");

                // Check if the current node ID is already in the mapping
                if (workflow.OriginalNodeIdMappings.ContainsValue(node.Id))
                {
                    // Restore original ID if found
                    var originalId = workflow.OriginalNodeIdMappings.FirstOrDefault(x => x.Value == node.Id).Key;
                    if (originalId != null)
                    {
                        node.Id = originalId;
                        Console.WriteLine($"Restored original ID for node: {node.Id}");
                    }
                    else
                    {
                        Console.WriteLine("Error: Original ID not found in mappings.");
                    }
                }
                else if (!workflow.OriginalNodeIdMappings.ContainsKey(node.Id))
                {
                    // Generate a new ID if not present in mappings
                    var originalId = node.Id;
                    var transformedId = ObjectId.GenerateNewId().ToString();

                    // Ensure the transformed ID does not already exist
                    if (!workflow.OriginalNodeIdMappings.ContainsKey(transformedId))
                    {
                        workflow.OriginalNodeIdMappings[transformedId] = originalId;
                        node.Id = transformedId;
                        Console.WriteLine($"Mapped original ID: {originalId} to transformed ID: {transformedId}");
                    }
                    else
                    {
                        Console.WriteLine("Error: Transformed ID already exists.");
                    }
                }

                // Recursively process child nodes
                foreach (var child in node.Children ?? new List<WorkflowNode>())
                {
                    StoreOriginalNodeIds(workflow, child);
                }
            }
        }

        public async Task UpdateWorkflowAsync(string id, Workflow updatedWorkflow)
        {
            try
            {
                // Validate the workflow ID
                if (!ObjectId.TryParse(id, out _))
                {
                    Console.WriteLine("Error: Invalid workflow ID");
                    throw new ArgumentException("Invalid workflow ID");
                }

                Console.WriteLine($"Retrieving existing workflow with ID: {id}");

                // Retrieve the existing workflow
                var existingWorkflow = await _workflows.Find(w => w.Id == id).FirstOrDefaultAsync();
                if (existingWorkflow == null)
                {
                    Console.WriteLine("Error: Workflow not found");
                    throw new Exception("Workflow not found");
                }

                // If Root is not null, store original node IDs
                if (updatedWorkflow.Root != null)
                {
                    StoreOriginalNodeIds(updatedWorkflow, updatedWorkflow.Root);
                }

                // Prepare mappings for update
                var updatedMappings = updatedWorkflow.OriginalNodeIdMappings ?? new Dictionary<string, string>();
                var existingMappings = existingWorkflow.OriginalNodeIdMappings ?? new Dictionary<string, string>();

                // Update existing mappings and add new ones
                foreach (var entry in updatedMappings)
                {
                    // Ensure the updated mapping is added or replaces the existing one
                    if (existingMappings.ContainsKey(entry.Key))
                    {
                        Console.WriteLine($"Updating mapping for ID: {entry.Key}");
                        existingMappings[entry.Key] = entry.Value;
                    }
                    else
                    {
                        Console.WriteLine($"Adding new mapping for ID: {entry.Key}");
                        existingMappings[entry.Key] = entry.Value;
                    }
                }

                Console.WriteLine("Node ID mappings updated successfully.");
                var updatedTags = new HashSet<string>(updatedWorkflow.Tag ?? Enumerable.Empty<string>());
                Console.WriteLine("Updated Tags: " + string.Join(", ", updatedTags));
                // Prepare the update definition
                var updateDefinition = Builders<Workflow>.Update
                    .Set(w => w.Title, updatedWorkflow.Title)
                    .Set(w => w.Root, updatedWorkflow.Root)
                    .Set(w => w.OriginalNodeIdMappings, existingMappings)
                    .Set(w => w.Connectors, updatedWorkflow.Connectors)
                
                    .Set(w => w.Tag, updatedTags.ToList());

                Console.WriteLine($"Updating workflow document in the database..");

                // Update only the modified fields
                var result = await _workflows.UpdateOneAsync(
                    filter: w => w.Id == id,
                    update: updateDefinition
                );

                if (result.MatchedCount == 0)
                {
                    Console.WriteLine("Error: Workflow not found after update attempt");
                    throw new Exception("Workflow not found");
                }

                Console.WriteLine("Workflow updated successfully.");
            }
            catch (Exception ex)
            {
                // Handle exception, possibly log it
                Console.WriteLine($"Exception occurred: {ex.Message}");
                throw new ApplicationException($"An error occurred while updating the workflow with ID {id}.", ex);
            }
        }



        public async Task<List<Workflow>> ExtractWorkflowsByTag(string[] displayedColumns)
        {
            try
            {
                if (displayedColumns == null || displayedColumns.Length == 0)
                {
                    return new List<Workflow>();
                }

                var filter = Builders<Workflow>.Filter.AnyIn(wf => wf.Tag, displayedColumns);

                var workflows = await _workflows.Find(filter).ToListAsync();

                return workflows;
            }
            catch (Exception ex)
            {
                throw new ApplicationException("An error occurred while extracting workflows by tag.", ex);
            }
        }

        public async Task<CheckHistoric> TraverseAndUpdateAsync(
    WorkflowNode node,
    Dictionary<string, object> row,
    Workflow workflow,
    List<string> errorMessages = null,
    string finalResultMessage = null)
        {
            // Initialize errorMessages if it's null
            errorMessages ??= new List<string>();
            finalResultMessage ??= "No final result provided";
            bool isWorkflowVerified = true;
            string workflowTitle = workflow.Title;

            Console.WriteLine($"{workflowTitle}");
            Console.WriteLine($"Traversing node {node.Id} of type {node.Type}");

            if (node.Type == "Decision-Node")
            {
                bool allConditionsMet = true;
                List<string> failureReasons = new List<string>();

                Console.WriteLine("Evaluating Decision-Node conditions");

                if (node.Data.Inputs.Count == 1)
                {
                    var input = node.Data.Inputs[0];
                    var table = input.TableName;
                    var column = input.ColumnName;
                    var action = input.Actions?.FirstOrDefault();
                    var operatorDecision = action?.OperatorDecision;
                    var values = action?.Values;
                    var actualValue = row.ContainsKey(column) ? row[column] : null;

                    Console.WriteLine($"Single input: table={table}, column={column}, operator={operatorDecision}, actualValue={actualValue}");

                    allConditionsMet = evaluateDecisionNode(actualValue, table, column, operatorDecision, values);

                    if (!allConditionsMet)
                    {
                        failureReasons.Add($"Workflow not verified! The error is: Condition not met for {input.Description}: Expected '{operatorDecision}' on '{column}'. Actual: '{actualValue}'.");
                    }
                }
                else if (node.Data.Inputs.Count > 1)
                {
                    foreach (var input in node.Data.Inputs)
                    {
                        var table = input.TableName;
                        var column = input.ColumnName;
                        var action = input.Actions?.FirstOrDefault();

                        if (action == null || string.IsNullOrEmpty(column) || !row.ContainsKey(column))
                        {
                            allConditionsMet = false;
                            failureReasons.Add($"Condition not met for {input.Description}: Missing or invalid data.");
                            continue;
                        }

                        var operatorDecision = action.OperatorDecision;
                        var values = action.Values;
                        var actualValue = row[column];
                        bool isConditionMet = evaluateDecisionNode(actualValue, table, column, operatorDecision, values);

                        Console.WriteLine($"Multiple inputs: table={table}, column={column}, operator={operatorDecision}, actualValue={actualValue}, isConditionMet={isConditionMet}");

                        allConditionsMet &= isConditionMet;

                        if (!isConditionMet)
                        {
                            failureReasons.Add($"Condition not met for {input.Description}: Expected '{operatorDecision}' on '{column}'. Actual: '{actualValue}'.");
                        }
                    }
                }

                Console.WriteLine($"All conditions met: {allConditionsMet}, failureReasons={string.Join(", ", failureReasons)}");

                if (allConditionsMet)
                {
                    var yesNode = node.Children.FirstOrDefault(child => child.Data.Name == "Yes Condition");
                    if (yesNode != null)
                    {
                        Console.WriteLine("Traversing Yes Condition node");
                        return await TraverseAndUpdateAsync(yesNode, row, workflow, errorMessages, finalResultMessage);
                    }
                    else
                    {
                        Console.WriteLine("Workflow not verified: No 'Yes' node found.");
                        isWorkflowVerified = false;
                        errorMessages.AddRange(failureReasons);

                        // Log the CheckHistoric object for the current state
                        var checkHistoricBeforeTraverse = new CheckHistoric
                        {
                            Id = Guid.NewGuid().ToString(),
                            CheckName = $"Check Results before traversing No Condition node: {row}",
                            CheckDate = DateOnly.FromDateTime(DateTime.UtcNow),
                            WorkflowTitle = workflowTitle,
                            WorkflowCheckResult = new CheckResult
                            {
                                Id = Guid.NewGuid().ToString(),
                                SuccessResult = finalResultMessage ?? "Workflow verified",
                                ErrorMessages = errorMessages.Concat(failureReasons).ToList()
                            }
                        };

                        Console.WriteLine("CheckHistoric Before Traverse:");
                        Console.WriteLine($"Id: {checkHistoricBeforeTraverse.Id}");
                        Console.WriteLine($"CheckName: {checkHistoricBeforeTraverse.CheckName}");
                        Console.WriteLine($"CheckDate: {checkHistoricBeforeTraverse.CheckDate}");
                        Console.WriteLine($"WorkflowTitle: {checkHistoricBeforeTraverse.WorkflowTitle}");
                        Console.WriteLine($"SuccessResult: {checkHistoricBeforeTraverse.WorkflowCheckResult.SuccessResult}");
                        Console.WriteLine($"ErrorMessages: {string.Join(", ", checkHistoricBeforeTraverse.WorkflowCheckResult.ErrorMessages)}");

                        return await TraverseAndUpdateAsync(yesNode, row, workflow, errorMessages, finalResultMessage);
                    }
                }
                else
                {
                    var noNode = node.Children.FirstOrDefault(child => child.Data.Name == "No Condition");
                    if (noNode != null)
                    {
                        Console.WriteLine($"The node {node.Data.Name} in {workflowTitle} does not satisfy the condition: {allConditionsMet}");
                        errorMessages.AddRange(failureReasons);
                        var checkHistoricBeforeTraverse = new CheckHistoric
                        {
                            Id = Guid.NewGuid().ToString(),
                            CheckName = $"Check Results before traversing No Condition node: {row}",
                            CheckDate = DateOnly.FromDateTime(DateTime.UtcNow),
                            WorkflowTitle = workflowTitle,
                            WorkflowCheckResult = new CheckResult
                            {
                                Id = Guid.NewGuid().ToString(),
                                SuccessResult = finalResultMessage ?? "Workflow verified",
                                ErrorMessages = errorMessages.Concat(failureReasons).ToList()
                            }
                        };

                        return await TraverseAndUpdateAsync(noNode, row, workflow, errorMessages, finalResultMessage);
                    }
                    else
                    {
                        Console.WriteLine("No 'No' node found. Cannot proceed further.");
                        isWorkflowVerified = false;
                        errorMessages.AddRange(failureReasons);
                        Console.WriteLine("Error Messages: " + string.Join(", ", errorMessages));
                    }
                }
            }
            else if (node.Type == "logger-Node")
            {
                Console.WriteLine("Processing logger-Node");

                if (node.Data.Name != "End State")
                {
                    foreach (var input in node.Data.Inputs)
                    {
                        foreach (var action in input.Actions)
                        {
                            Console.WriteLine($"Processing action {action.CrudCommandAction.Crud} on {input.ColumnName}");

                            switch (action.CrudCommandAction.Crud)
                            {
                                case "Read":
                                    await HandleReadValueAsync(action.CrudCommandAction.Crud, action.CrudCommandAction.Condition, input.TableName, input.ColumnName, action.Values, _databaseService);
                                    break;
                                case "Set":
                                    await HandleSetValueAsync(action.CrudCommandAction.Crud, input.TableName, input.ColumnName, action.Values, action.NewValues);
                                    break;
                                case "Delete":
                                    await HandleDeleteValueAsync(action.CrudCommandAction.Crud, input.TableName, input.ColumnName, action.Values);
                                    break;
                                default:
                                    isWorkflowVerified = false;
                                    errorMessages.Add($"Unsupported CRUD action: {action.CrudCommandAction.Crud}");
                                    Console.WriteLine("Error Messages: " + string.Join(", ", errorMessages));
                                    break;
                            }
                        }
                    }
                }
                else
                {
                    Console.WriteLine("Error Messages: " + string.Join(", ", errorMessages));
                    finalResultMessage = $"Final Result: {node.Data.Inputs[0].Description}";
                    if (errorMessages.Any())
                    {
                        // Append finalResultCheck to each error message
                        errorMessages = errorMessages.Select(em => em + "\n" + finalResultMessage).ToList();
                        finalResultMessage = null;
                        Console.WriteLine("Error Messages: " + string.Join(", ", errorMessages));
                    }
                    else
                    {
                        // Update the success result with finalResultCheck
                        finalResultMessage = $"This is the :{finalResultMessage}";
                        Console.WriteLine($"{finalResultMessage}");
                    }
                    isWorkflowVerified = isWorkflowVerified;
                    Console.WriteLine($"End State reached with result: {finalResultMessage}");
                }

            }

            // Traverse child nodes if not a Decision-Node or logger-Node
            foreach (var child in node.Children)
            {
                var childHistoric = await TraverseAndUpdateAsync(child, row, workflow, errorMessages, finalResultMessage);
                if (childHistoric != null) return childHistoric;
            }

            // Finalize the CheckHistoric result only if this node is the End State
            if (node.Type == "logger-Node" && node.Data.Name == "End State")
            {
                var finalCheckHistoric = new CheckHistoric
                {
                    Id = Guid.NewGuid().ToString(),
                    CheckName = $"Final Check Results",
                    CheckDate = DateOnly.FromDateTime(DateTime.UtcNow),
                    WorkflowTitle = workflowTitle,
                    WorkflowCheckResult = new CheckResult
                    {
                        Id = Guid.NewGuid().ToString(),
                        SuccessResult = finalResultMessage ?? "",
                        ErrorMessages = errorMessages
                    }
                };

                Console.WriteLine("Final CheckHistoric:");
                Console.WriteLine($"Id: {finalCheckHistoric.Id}");
                Console.WriteLine($"CheckName: {finalCheckHistoric.CheckName}");
                Console.WriteLine($"CheckDate: {finalCheckHistoric.CheckDate}");
                Console.WriteLine($"WorkflowTitle: {finalCheckHistoric.WorkflowTitle}");
                Console.WriteLine($"SuccessResult: {finalCheckHistoric.WorkflowCheckResult.SuccessResult}");
                Console.WriteLine($"ErrorMessages: {string.Join(", ", finalCheckHistoric.WorkflowCheckResult.ErrorMessages)}");
                await _checkHistoricService.CreateAsync(finalCheckHistoric);
                return finalCheckHistoric;
            }

            // Return null if no final check is available
            return null;
        }





        // Remove 'private' from local functions
        private async Task HandleReadValueAsync(string crudAction,string condition,string table,string column,List<string> values, IDatabaseService databaseService)
     {
         Console.WriteLine($"Processing actionValue: {crudAction} with condition:{condition}");

         try
         {
                if (condition == "contains")
                {
                    Console.WriteLine("Handling 'contains' operation.");
                    foreach (var value in values)
                    {
                        var results = await _settingsService.GetCollectionsContainingValueAsync(table, column, value.Trim());
                        foreach (var result in results)
                        {
                            Console.WriteLine($"{column} from {table} contains({value.Trim()}) in document: {result.Id}");
                        }
                    }
                }
                else if (condition == "not contains")
                {
                    Console.WriteLine("Handling 'not contains' operation.");
                    foreach (var value in values)
                    {
                        var results = await _settingsService.GetCollectionsNotContainingValueAsync(table, column, value.Trim());
                        foreach (var result in results)
                        {
                            Console.WriteLine($"{column} from {table} not contains({value.Trim()}) in document: {result.Id}");
                        }
                    }
                }


                else if (condition == "uppercase")
             {
                 Console.WriteLine("Handling 'uppercase' operation.");

                    // Example format: "ColumnName from TableName uppercase(Value)"
                    foreach (var value in values)
                    {
                        var result = await _settingsService.GetUppercaseAsync(table, column, value);
                        Console.WriteLine($"{column} from {table} uppercase({value}): {string.Join(", ", result)}");
                    }
             }

             else if (condition == "max")
             {
                 Console.WriteLine("Handling 'max' operation.");

                 // Extract individual values from the values string
                 string[] valueArray = values.Select(v => v.Trim()) // Trim each value
                                             .ToArray();

                 // Ensure all values and column names are valid
                 if (valueArray.Length == 0 || string.IsNullOrEmpty(column) || string.IsNullOrEmpty(table))
                 {
                     Console.WriteLine("Error: Missing values, column name, or table name.");
                     return;
                 }

                 Console.WriteLine($"Values: {string.Join(", ", values)}, ColumnName: {column}, TableName: {table}");

                 // Call the service to get the max value
                 var result = await _settingsService.GetMaxValueAsync(table, column, valueArray);
                 Console.WriteLine($"max({string.Join(", ", valueArray)}) from {column} from {table}: {result}");
             }



             else if (condition == "min")
             {
                 Console.WriteLine("Handling 'min' operation.");

                
                 // Extract individual values from the values string
                 string[] valueArray = values.Select(v => v.Trim()) // Trim each value
                                             .ToArray();

                 // Ensure all values and column names are valid
                 if (valueArray.Length == 0 || string.IsNullOrEmpty(column) || string.IsNullOrEmpty(table))
                 {
                     Console.WriteLine("Error: Missing values, column name, or table name.");
                     return;
                 }

                 Console.WriteLine($"Values: {string.Join(", ", valueArray)}, ColumnName: {column}, TableName: {table}");

                 // Call the service to get the max value
                 var result = await _settingsService.GetMinValueAsync(table, column, valueArray);
                 Console.WriteLine($"min({string.Join(", ", valueArray)}) from {column} from {table}: {result}");
             }
             else if (condition == "average")
             {
                 Console.WriteLine("Handling 'average' operation.");

                
                 // Extract individual values from the values string
                 string[] valueArray = values.Select(v => v.Trim()) // Trim each value
                                             .ToArray();

                 // Ensure all values and column names are valid
                 if (valueArray.Length == 0 || string.IsNullOrEmpty(column) || string.IsNullOrEmpty(table))
                 {
                     Console.WriteLine("Error: Missing values, column name, or table name.");
                     return;
                 }

                 Console.WriteLine($"Values: {string.Join(", ", valueArray)}, ColumnName: {column}, TableName: {table}");

                 // Call the service to get the max value
                 var result = await _settingsService.GetAverageValueAsync(table, column, valueArray);
                 Console.WriteLine($"average({string.Join(", ", valueArray)}) from {column} from {table}: {result}");
             }
             else if (condition == ">")
             {
                 Console.WriteLine("Handling 'greater than' operation.");

                    foreach (var value in values)
                    {
                        var result = await _settingsService.GetValuesGreaterThanAsync(table, column, value);
                        Console.WriteLine($"{column} > {value} from {table}: {string.Join(", ", result.Select(doc => doc.ToJson()))}");
                    }
                        
             }
             else if (condition == "<")
             {
                 Console.WriteLine("Handling 'less than' operation.");

                    foreach (var value in values)
                    {
                        var result = await _settingsService.GetValuesLessThanAsync(table, column, value);
                        Console.WriteLine($"{column} < {value} from {table}: {string.Join(", ", result.Select(doc => doc.ToJson()))}");
                    }
                        
             }
             else
             {
                 Console.WriteLine("Handling generic read operation.");

                    foreach (var value in values)
                    {
                        Console.WriteLine($"ColumnName: {column}, Value: {value}, TableName: {table}");

                        var result = await _settingsService.GetSpecificValueAsync(table, column, value);
                        Console.WriteLine($"{column} = {value} from {table}: {result}");
                    }
                       
             }
         }
         catch (Exception ex)
         {
             Console.WriteLine($"An error occurred: {ex.Message}");
         }
     }




     public async Task HandleSetValueAsync(string crudAction, string table, string column,List<string> values,Dictionary<string,string> newValues)
        {

         try
         {
            foreach(string value in values)
                {
                    string newValue =newValues[value];
                    Console.WriteLine($"Parsed action: Update {value} from {column} in {table} to {newValue}");
                    // Call the method in DatabaseService to perform the update
                    await _settingsService.UpdateColumnValueAsync(table, column, value, newValue);
                }
            
         }
         catch (Exception ex)
         {
             Console.WriteLine($"An error occurred while handling the set action: {ex.Message}");
         }
     }

     public async Task HandleDeleteValueAsync(string crudAction, string table, string column, List<string> values)
        {
        

         try
         {
            

             foreach(string value in values)
                {
                    Console.WriteLine($"Parsed action: Delete {value} from {column} in {table}");
                    // Call the database service to delete the value
                    await _settingsService.DeleteColumnValueAsync(table, column, value);
                }
         }
         catch (Exception ex)
         {
             Console.WriteLine($"An error occurred while handling the delete action: {ex.Message}");
         }
     }



        public bool evaluateDecisionNode(object actualValue, string table, string column, string operatorDecision, List<string> values)
        {
            string actualValueString = actualValue?.ToString().Trim();

            Console.WriteLine($"Evaluating: {table}.{column} {operatorDecision} with value '{actualValueString}'");

            if (string.IsNullOrEmpty(actualValueString))
            {
                // Handle empty string case before entering switch
                if (operatorDecision == "IsEmpty")
                    return true;
                if (operatorDecision == "NotEmpty")
                    return false;
            }

            switch (operatorDecision)
            {
                case "=":
                    return actualValueString == values.FirstOrDefault()?.Trim();

                case "!=":
                    return actualValueString != values.FirstOrDefault()?.Trim();

                case ">":
                    if (double.TryParse(actualValueString, out double leftNumGreater) &&
                        double.TryParse(values.FirstOrDefault()?.Trim(), out double rightNumGreater))
                    {
                        return leftNumGreater > rightNumGreater;
                    }
                    break;

                case ">=":
                    if (double.TryParse(actualValueString, out double leftNumGreaterOrEqual) &&
                        double.TryParse(values.FirstOrDefault()?.Trim(), out double rightNumGreaterOrEqual))
                    {
                        return leftNumGreaterOrEqual >= rightNumGreaterOrEqual;
                    }
                    break;

                case "<":
                    if (double.TryParse(actualValueString, out double leftNumLess) &&
                        double.TryParse(values.FirstOrDefault()?.Trim(), out double rightNumLess))
                    {
                        return leftNumLess < rightNumLess;
                    }
                    break;

                case "<=":
                    if (double.TryParse(actualValueString, out double leftNumLessOrEqual) &&
                        double.TryParse(values.FirstOrDefault()?.Trim(), out double rightNumLessOrEqual))
                    {
                        return leftNumLessOrEqual <= rightNumLessOrEqual;
                    }
                    break;

                case "In":
                    if (!string.IsNullOrEmpty(actualValueString))
                    {
                        // Check if actualValueString is in the list of expected values
                        return values.Any(value => value.Trim().Equals(actualValueString, StringComparison.OrdinalIgnoreCase));
                    }
                    break;

                case "NotIn":
                    if (!string.IsNullOrEmpty(actualValueString))
                    {
                        // Check if actualValueString is not in the list of expected values
                        return !values.Any(value => value.Trim().Equals(actualValueString, StringComparison.OrdinalIgnoreCase));
                    }
                    break;

                case "IsEmpty":
                    return string.IsNullOrEmpty(actualValueString);

                case "NotEmpty":
                    return !string.IsNullOrEmpty(actualValueString);

                default:
                    Console.WriteLine($"Unsupported operator: {operatorDecision}");
                    throw new Exception("Unsupported operator");
            }

            return false;
        }


        public async Task DeleteWorkflowAsync(string id)
        {
            try
            {
                await _workflows.DeleteOneAsync(workflow => workflow.Id == id);
            }
            catch (Exception ex)
            {
                throw new ApplicationException($"An error occurred while deleting the workflow with ID {id}.", ex);
            }
        }

        

        
    }
}
