using Microsoft.AspNetCore.Mvc;
using Reporting.Core.IService;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ReportingBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SettingsController : ControllerBase
    {
        private readonly ISettingsService _settingsService;

        public SettingsController(ISettingsService settingsService)
        {
            _settingsService = settingsService;
        }

        [HttpPost("populate-metadata")]
        public async Task<IActionResult> PopulateMetadata()
        {
            await _settingsService.PopulateMetadataAsync();
            return Ok();
        }

        [HttpGet("metadata/{collectionName}/columns")]
        public async Task<IActionResult> GetColumnNamesByCollection(string collectionName)
        {
            var columns = await _settingsService.GetColumnNamesByCollectionAsync(collectionName);
            return Ok(columns);
        }

        [HttpGet("metadata/{tableName}/{columnName}/values")]
        public async Task<IActionResult> GetPossibleValuesByTableAndColumn(string tableName, string columnName)
        {
            var values = await _settingsService.GetPossibleValuesByTableAndColumnAsync(tableName, columnName);
            return Ok(values);
        }

        [HttpGet("collections")]
        public async Task<IActionResult> GetAllCollections()
        {
            var collections = await _settingsService.GetAllCollectionsAsync();
            return Ok(collections);
        }
        [HttpGet("metadata/{collectionName}/columns-types")]
        public async Task<IActionResult> GetColumnsTypeByCollection(string collectionName)
        {
            var columnTypes = await _settingsService.GetColumnsTypeByCollectionAsync(collectionName);
            return Ok(columnTypes);
        }
        [HttpGet("columns-and-types/{collectionName}")]
        public async Task<ActionResult<Dictionary<string, string>>> GetColumnNamesAndTypesByCollection(string collectionName)
        {
            var result = await _settingsService.GetColumnNamesAndTypesByCollectionAsync(collectionName);
            if (result == null || result.Count == 0)
            {
                return NotFound();
            }
            return Ok(result);
        }

    }

}
