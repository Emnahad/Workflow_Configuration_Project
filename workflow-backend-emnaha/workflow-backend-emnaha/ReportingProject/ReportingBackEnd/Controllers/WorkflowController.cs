using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Bson.IO;
using Reporting.Application.Services;
using Reporting.Core.Entities;
using Reporting.Core.IService;
namespace ReportingBackEnd.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WorkflowController : ControllerBase
    {
        private readonly IWorkflowService _workflowService;
        private readonly IDatabaseService _databaseService;
        private readonly ISettingsService _settingsService;
        private readonly ILogger<WorkflowController> _logger;
        public WorkflowController(IWorkflowService workflowService, IDatabaseService databaseService,ISettingsService settingsService, ILogger<WorkflowController> logger)
        {
            _workflowService = workflowService ?? throw new ArgumentNullException(nameof(workflowService));
            _databaseService = databaseService ?? throw new ArgumentNullException(nameof(databaseService));
            _settingsService = settingsService ?? throw new ArgumentNullException(nameof(_settingsService));
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<List<Workflow>>> Get()
        {
            var workflows = await _workflowService.GetWorkflowsAsync();
            return Ok(workflows);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Workflow>> Get(string id)
        {
            var workflow = await _workflowService.GetWorkflowByIdAsync(id);

            if (workflow == null)
            {
                return NotFound();
            }

            return Ok(workflow);
        }

        [HttpPost]
        public async Task<ActionResult<Workflow>> Create([FromBody] Workflow workflow)
        {
            await _workflowService.CreateWorkflowAsync(workflow);
            return CreatedAtAction(nameof(Get), new { id = workflow.Id }, workflow);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, Workflow workflow)
        {
            var existingWorkflow = await _workflowService.GetWorkflowByIdAsync(id);

            if (existingWorkflow == null)
            {
                return NotFound();
            }

            await _workflowService.UpdateWorkflowAsync(id, workflow);
            return NoContent();
        }


        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var existingWorkflow = await _workflowService.GetWorkflowByIdAsync(id);

            if (existingWorkflow == null)
            {
                return NotFound();
            }

            await _workflowService.DeleteWorkflowAsync(id);
            return NoContent();
        }
        [HttpPost("traverse")]
        public async Task<IActionResult> TraverseWorkflow([FromBody] TraverseWorkflowRequest request)
        {
            try
            {
                if (request.Node.Id != null && !ObjectId.TryParse(request.Node.Id, out _))
                {
                    return BadRequest(new { error = $"Invalid node ID: {request.Node.Id}" });
                }

                // Log the request data
                _logger.LogInformation("Processing traverse request: {Request}", request);

                var result = await _workflowService.TraverseAndUpdateAsync(
                    request.Node,
                    request.Row,
                    request.Workflow,
                    request.ErrorMessages,
                    request.FinalResultMessage
                );

                // Log the result
                _logger.LogInformation("Traversal result: {Result}", result);

                return Ok(new { result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while traversing workflow");
                return StatusCode(500, new { error = "An error occurred while processing the request." });
            }
        }



        [HttpGet("extract")]
        public async Task<IActionResult> ExtractWorkflowsByTag([FromQuery] string[] displayedColumns)
        {
            if (displayedColumns == null || displayedColumns.Length == 0)
            {
                return BadRequest("Displayed columns parameter is required.");
            }

            try
            {
                var workflows = await _workflowService.ExtractWorkflowsByTag(displayedColumns);
                return Ok(workflows);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }



    }
}
