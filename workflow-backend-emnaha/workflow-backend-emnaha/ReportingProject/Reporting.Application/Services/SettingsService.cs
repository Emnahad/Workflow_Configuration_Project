using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;
using Reporting.Core.Entities;
using Reporting.Core.IService;
using Reporting.Infrastracture.Configuration;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;

namespace Reporting.Application.Services
{
    public class SettingsService : ISettingsService
    {
        private readonly IMongoClient _mongoClient;
        private readonly IMongoDatabase _database;
        private readonly IMongoCollection<Settings> _metadataCollection;

        public SettingsService(IMongoClient mongoClient, IOptions<ReportingDatabaseSettings> settings)
        {
            _mongoClient = mongoClient;
            _database = _mongoClient.GetDatabase(settings.Value.DatabaseName);
            _metadataCollection = _database.GetCollection<Settings>("Metadata");
        }

        public async Task PopulateMetadataAsync()
        {
            var stopwatch = Stopwatch.StartNew();

            var collections = await GetAllCollectionsAsync();
            var existingMetadata = await _metadataCollection.Find(FilterDefinition<Settings>.Empty).ToListAsync();
            var existingMetadataDict = existingMetadata.ToDictionary(m => m.TableName, m => m);

            var tasks = collections
                .Where(collectionName => collectionName != "Metadata" && collectionName != "workflows")
                .Select(collectionName => ProcessCollectionAsync(collectionName, existingMetadataDict))
                .ToArray();

            var bulkOps = (await Task.WhenAll(tasks))
                .Where(op => op != null)
                .ToList();

            var collectionsToRemove = existingMetadataDict.Keys.Except(collections).ToList();
            var deleteOps = collectionsToRemove
                .Select(collectionName => new DeleteOneModel<Settings>(Builders<Settings>.Filter.Eq(s => s.TableName, collectionName)))
                .ToList();

            if (bulkOps.Any() || deleteOps.Any())
            {
                var allOps = bulkOps.Concat(deleteOps).ToList();
                await _metadataCollection.BulkWriteAsync(allOps);
            }

            stopwatch.Stop();
            Console.WriteLine($"Approach 1: PopulateMetadataAsync completed in {stopwatch.ElapsedMilliseconds} ms");
        }


        private async Task<WriteModel<Settings>> ProcessCollectionAsync(string collectionName, Dictionary<string, Settings> existingMetadataDict)
        {
            var collection = _database.GetCollection<BsonDocument>(collectionName);

            var pipeline = new BsonDocument[]
            {
                new BsonDocument("$project", new BsonDocument { { "columns", new BsonDocument("$objectToArray", "$$ROOT") } }),
                new BsonDocument("$unwind", "$columns"),
                new BsonDocument("$group", new BsonDocument { { "_id", "$columns.k" }, { "values", new BsonDocument("$addToSet", "$columns.v") } })
            };

            var result = await collection.Aggregate<BsonDocument>(pipeline).ToListAsync();

            var columnValuesDict = new Dictionary<string, List<string>>();

            foreach (var doc in result)
            {
                var columnName = doc["_id"].AsString;
                var valuesArray = doc["values"].AsBsonArray;
                var valuesList = valuesArray.Select(v => v.ToString()).ToList();
                columnValuesDict[columnName] = valuesList;
            }

            var newSettings = new Settings
            {
                TableName = collectionName,
                Columns = columnValuesDict
            };

            if (existingMetadataDict.TryGetValue(collectionName, out var existingSettings))
            {
                if (!IsMetadataEqual(existingSettings, newSettings))
                {
                    var filter = Builders<Settings>.Filter.Eq(s => s.TableName, collectionName);
                    var update = Builders<Settings>.Update.Set(s => s.Columns, newSettings.Columns);
                    return new UpdateOneModel<Settings>(filter, update);
                }
            }
            else
            {
                return new InsertOneModel<Settings>(newSettings);
            }

            return null;
        }

        private bool IsMetadataEqual(Settings existingSettings, Settings newSettings)
        {
            if (existingSettings.TableName != newSettings.TableName)
                return false;

            if (existingSettings.Columns.Count != newSettings.Columns.Count)
                return false;

            foreach (var column in existingSettings.Columns)
            {
                if (!newSettings.Columns.TryGetValue(column.Key, out var newValues) || !newValues.SequenceEqual(column.Value))
                {
                    return false;
                }
            }

            return true;
        }

        public async Task<List<string>> GetAllCollectionsAsync()
        {
            var allCollections = await _database.ListCollectionNamesAsync();
            var collectionNames = await allCollections.ToListAsync();
            var excludedCollections = new HashSet<string> { "Metadata", "workflows" };
            return collectionNames.Where(name => !excludedCollections.Contains(name)).ToList();
        }

        public async Task<List<string>> GetColumnNamesByCollectionAsync(string collectionName)
        {
            var collection = _database.GetCollection<BsonDocument>(collectionName);

            var projection = Builders<BsonDocument>.Projection.Exclude("_id");

            var firstDocument = await collection
                .Find(new BsonDocument()) 
                .Project(projection) 
                .FirstOrDefaultAsync();

            if (firstDocument == null)
            {
                return new List<string>();
            }

            var columnNames = firstDocument.Names.ToList();
            return columnNames;
        }


        public async Task<List<string>> GetPossibleValuesByTableAndColumnAsync(string tableName, string columnName)
        {
            var filter = Builders<Settings>.Filter.Eq(m => m.TableName, tableName);
            var settings = await _metadataCollection.Find(filter).FirstOrDefaultAsync();
            if (settings != null && settings.Columns.ContainsKey(columnName))
            {
                return settings.Columns[columnName];
            }
            return new List<string>();
        }

        public async Task<Dictionary<string, string>> GetColumnsTypeByCollectionAsync(string collectionName)
        {
            var collection = _database.GetCollection<BsonDocument>(collectionName);

            var projection = Builders<BsonDocument>.Projection.Exclude("_id");

            var sampleDocument = await collection
                .Find(new BsonDocument()) 
                .Project(projection) 
                .FirstOrDefaultAsync();

            var columnTypesDict = new Dictionary<string, string>();

            if (sampleDocument != null)
            {
                foreach (var element in sampleDocument.Elements)
                {
                    columnTypesDict[element.Name] = element.Value.BsonType.ToString();
                }
            }

            return columnTypesDict;
        }

        public async Task<Dictionary<string, string>> GetColumnNamesAndTypesByCollectionAsync(string collectionName)
        {
            var collection = _database.GetCollection<BsonDocument>(collectionName);
            var sampleDocument = await collection.Find(FilterDefinition<BsonDocument>.Empty).FirstOrDefaultAsync();

            var columnNamesAndTypes = new Dictionary<string, string>();

            if (sampleDocument != null)
            {
                foreach (var element in sampleDocument.Elements)
                {
                    columnNamesAndTypes[element.Name] = element.Value.BsonType.ToString();
                }
            }

            return columnNamesAndTypes;
        }
        public async Task<List<Settings>> GetCollectionsContainingValueAsync(string tableName, string columnName, string value)
        {
            var filter = Builders<Settings>.Filter.Eq(s => s.TableName, tableName);
            var settingsList = await _metadataCollection.Find(filter).ToListAsync();

            var result = settingsList
                .Where(s => s.Columns.ContainsKey(columnName) && s.Columns[columnName].Contains(value))
                .ToList();

            return result;
        }



        public async Task<List<Settings>> GetCollectionsNotContainingValueAsync(string tableName, string columnName, string value)
        {
            var filter = Builders<Settings>.Filter.Eq(s => s.TableName, tableName);
            var settingsList = await _metadataCollection.Find(filter).ToListAsync();
            var result = settingsList
                .Where(s => s.Columns.ContainsKey(columnName) && !s.Columns[columnName].Contains(value))
                .ToList();

            return result;
        }



        public async Task<List<string>> GetUppercaseAsync(string tableName, string columnName, string value)
        {
            var collection = _database.GetCollection<BsonDocument>(tableName);
            var filter = Builders<BsonDocument>.Filter.Eq(columnName, value);
            var projection = Builders<BsonDocument>.Projection.Include(columnName);
            var documents = await collection.Find(filter).Project(projection).ToListAsync();

            var results = documents
                .Select(doc => doc[columnName].AsString.ToUpper())
                .ToList();

            return results;
        }


        public async Task<string> GetMaxValueAsync(string tableName, string columnName, string[] values)
        {
            var collection = _database.GetCollection<BsonDocument>(tableName);

            var bsonValues = values.Select(v =>
            {
                if (int.TryParse(v, out int intValue))
                    return BsonValue.Create(intValue);
                if (double.TryParse(v, out double doubleValue))
                    return BsonValue.Create(doubleValue);
                return BsonNull.Value;
            }).ToArray();

            var filter = Builders<BsonDocument>.Filter.In(columnName, bsonValues);

            var sort = Builders<BsonDocument>.Sort.Descending(columnName);

            // Log for debugging
            Console.WriteLine($"Filter: {filter.ToJson()}");
            Console.WriteLine($"Sort: {sort.ToJson()}");

            var document = await collection.Find(filter).Sort(sort).FirstOrDefaultAsync();

            if (document != null && document.Contains(columnName))
            {
                Console.WriteLine($"Found document: {document.ToJson()}");
                return document[columnName].ToString();
            }

            // Log if no document found
            Console.WriteLine("No document found or column is missing.");
            // Return empty string if no document is found or column is missing
            return string.Empty;
        }




        public async Task<string> GetMinValueAsync(string tableName, string columnName, string[] values)
        {
            var collection = _database.GetCollection<BsonDocument>(tableName);

            // Convert string values to BsonValue
            var bsonValues = values.Select(v =>
            {
                if (int.TryParse(v, out int intValue))
                    return BsonValue.Create(intValue);
                if (double.TryParse(v, out double doubleValue))
                    return BsonValue.Create(doubleValue);
                return BsonNull.Value;
            }).ToArray();

            // Create a filter to match documents where column value is in the provided list
            var filter = Builders<BsonDocument>.Filter.In(columnName, bsonValues);

            // Create a sort definition to sort by column value in ascending order
            var sort = Builders<BsonDocument>.Sort.Ascending(columnName);

            Console.WriteLine($"Filter: {filter.ToJson()}");
            Console.WriteLine($"Sort: {sort.ToJson()}");

            // Retrieve the first document with the lowest value for the specified column
            var document = await collection.Find(filter).Sort(sort).FirstOrDefaultAsync();

            if (document != null && document.Contains(columnName))
            {
                // Log the result for debugging
                Console.WriteLine($"Found document: {document.ToJson()}");
                // Return the minimum value as a string
                return document[columnName].ToString();
            }

            // Log if no document found
            Console.WriteLine("No document found or column is missing.");
            // Return empty string if no document is found or column is missing
            return string.Empty;
        }


        public async Task<decimal> GetAverageValueAsync(string tableName, string columnName, string[] values)
        {
            var collection = _database.GetCollection<BsonDocument>(tableName);

            // Convert string values to BsonValue, ensuring they are correctly parsed as numbers
            var bsonValues = values.Select(v =>
            {
                if (decimal.TryParse(v, out decimal decimalValue))
                    return BsonValue.Create(decimalValue);
                return BsonNull.Value;
            }).ToArray();

            // Create a filter to match documents where column value is in the provided list
            var filter = Builders<BsonDocument>.Filter.In(columnName, bsonValues);

            // Retrieve the documents that match the filter
            var documents = await collection.Find(filter).ToListAsync();

            if (documents.Count == 0)
            {
                // Return 0 if no documents are found
                return 0m;
            }

            // Calculate the sum and count
            decimal sum = 0m;
            int count = 0;

            foreach (var doc in documents)
            {
                if (doc.Contains(columnName) && doc[columnName].IsNumeric)
                {
                   
                    if (doc[columnName].IsInt32)
                    {
                        sum += (decimal)doc[columnName].AsInt32;
                    }
                    else if (doc[columnName].IsDouble)
                    {
                        sum += (decimal)doc[columnName].AsDouble;
                    }
                    count++;
                }
            }

            // Calculate the average
            return count > 0 ? sum / count : 0m;
        }







        public async Task<List<BsonDocument>> GetValuesGreaterThanAsync(string collectionName, string columnName, object value)
        {
            var collection = _database.GetCollection<BsonDocument>(collectionName);

            BsonValue bsonValue;

            // Attempt to convert the value to a numeric type
            if (int.TryParse(value.ToString(), out int intValue))
            {
                bsonValue = BsonValue.Create(intValue);
            }
            else if (double.TryParse(value.ToString(), out double doubleValue))
            {
                bsonValue = BsonValue.Create(doubleValue);
            }
            else
            {
                // If value can't be parsed as a number, return an empty list
                return new List<BsonDocument>();
            }

            // Create the filter
            var filter = Builders<BsonDocument>.Filter.Gt(columnName, bsonValue);

            return await collection.Find(filter).ToListAsync();
        }

        public async Task<List<BsonDocument>> GetValuesLessThanAsync(string collectionName, string columnName, object value)
        {
            var collection = _database.GetCollection<BsonDocument>(collectionName);

            BsonValue bsonValue;

            // Attempt to convert the value to a numeric type
            if (int.TryParse(value.ToString(), out int intValue))
            {
                bsonValue = BsonValue.Create(intValue);
            }
            else if (double.TryParse(value.ToString(), out double doubleValue))
            {
                bsonValue = BsonValue.Create(doubleValue);
            }
            else
            {
                // If value can't be parsed as a number, return an empty list
                return new List<BsonDocument>();
            }

            // Create the filter
            var filter = Builders<BsonDocument>.Filter.Lt(columnName, bsonValue);

            return await collection.Find(filter).ToListAsync();
        }


        public async Task<List<BsonDocument>> GetSpecificValueAsync(string collectionName, string columnName, object value)
        {
            var collection = _database.GetCollection<BsonDocument>(collectionName);

            // Convert the value to BsonValue
            BsonValue bsonValue = BsonValue.Create(value);

            // Create the filter
            var filter = Builders<BsonDocument>.Filter.Eq(columnName, bsonValue);

            return await collection.Find(filter).ToListAsync();
        }

        public async Task UpdateColumnValueAsync(string tableName, string columnName, string oldValue, string newValue)
        {
            // Create a filter to find the document where the tableName matches
            var filter = Builders<Settings>.Filter.Eq(s => s.TableName, tableName);

            // Retrieve the document from metadataCollection
            var settings = await _metadataCollection.Find(filter).FirstOrDefaultAsync();

            if (settings != null && settings.Columns.ContainsKey(columnName))
            {
                // Update the value in the column
                var columnValues = settings.Columns[columnName];
                if (columnValues.Contains(oldValue))
                {
                    columnValues.Remove(oldValue);
                    columnValues.Add(newValue);

                    // Create an update definition to set the new column values
                    var update = Builders<Settings>.Update.Set(s => s.Columns[columnName], columnValues);

                    // Update the document in metadataCollection
                    var result = await _metadataCollection.UpdateOneAsync(filter, update);

                    Console.WriteLine($"{result.ModifiedCount} document(s) updated in metadataCollection.");
                }
                else
                {
                    Console.WriteLine($"Old value '{oldValue}' not found in column '{columnName}' for table '{tableName}'.");
                }
            }
            else
            {
                Console.WriteLine($"Column '{columnName}' not found in table '{tableName}'.");
            }
        }

        public async Task DeleteColumnValueAsync(string tableName, string columnName, string value)
        {
            // Create a filter to find the document where the tableName matches
            var filter = Builders<Settings>.Filter.Eq(s => s.TableName, tableName);

            // Retrieve the document from metadataCollection
            var settings = await _metadataCollection.Find(filter).FirstOrDefaultAsync();

            if (settings != null && settings.Columns.ContainsKey(columnName))
            {
                var columnValues = settings.Columns[columnName];
                if (columnValues.Contains(value))
                {
                    columnValues.Remove(value);

                    // Create an update definition to set the new column values
                    var update = Builders<Settings>.Update.Set(s => s.Columns[columnName], columnValues);

                    // Update the document in metadataCollection
                    var result = await _metadataCollection.UpdateOneAsync(filter, update);

                    Console.WriteLine($"Successfully deleted value: {value} from column: {columnName} in table: {tableName}");
                }
                else
                {
                    Console.WriteLine($"Value '{value}' not found in column '{columnName}' for table '{tableName}'.");
                }
            }
            else
            {
                Console.WriteLine($"Column '{columnName}' not found in table '{tableName}'.");
            }
        }

    }
}
