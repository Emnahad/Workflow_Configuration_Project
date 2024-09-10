using Microsoft.AspNetCore.Mvc;
using Reporting.Core.IService;

namespace ReportingBackEnd.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DatabaseController : ControllerBase
    {
        private readonly IDatabaseService _databaseService;

        public DatabaseController(IDatabaseService databaseService)
        {
            _databaseService = databaseService;
        }

        [HttpGet("collections")]
        public async Task<ActionResult<List<string>>> GetCollections()
        {
            try
            {
                var collections = await _databaseService.GetCollectionsAsync();
                return Ok(collections);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
        [HttpGet("collections/{collectionName}/columns")]
        public async Task<ActionResult<List<string>>> GetCollectionColumns(string collectionName)
        {
            try
            {
                var columns = await _databaseService.GetCollectionColumnsAsync(collectionName);
                return Ok(columns);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("collections/{collectionName}/columns/{columnName}/values")]
        public async Task<ActionResult<List<string>>> GetColumnValues(string collectionName, string columnName)
        {
            try
            {
                var values = await _databaseService.GetColumnValuesAsync(collectionName, columnName);
                return Ok(values);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
        [HttpPut("updateColumnValue")]
        public async Task<IActionResult> UpdateColumnValueAsync([FromQuery] string tableName, [FromQuery] string columnName, [FromQuery] string oldValue, [FromQuery] string? newValue)
        {
            try
            {
                await _databaseService.UpdateColumnValueAsync(tableName, columnName, oldValue, newValue);
                return Ok(new { message = "Column value updated successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"An error occurred: {ex.Message}" });
            }
        }

    }
}

