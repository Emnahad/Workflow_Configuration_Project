using Reporting.Core.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Reporting.Core.IService
{
    public interface IWorkflowService
    {
        Task<List<Workflow>> GetWorkflowsAsync();
        Task<Workflow> GetWorkflowByIdAsync(string id);
        Task CreateWorkflowAsync(Workflow workflow);
        Task UpdateWorkflowAsync(string id, Workflow workflow);
        Task DeleteWorkflowAsync(string id);

        // Method to extract workflows based on tags
        Task<List<Workflow>> ExtractWorkflowsByTag(string[] columns);

        // Method to traverse and update workflows
        Task<CheckHistoric> TraverseAndUpdateAsync(
    WorkflowNode node,
    Dictionary<string, object> row,
    Workflow workflow,
    List<string> errorMessages = null,
    string finalResultMessage = null);
    }
}
