using Microsoft.AspNetCore.Mvc;
using Reporting.Core.Entities;
using Reporting.Core.IService;

namespace ReportingBackEnd.Controllers
{
    
        [Route("api/[controller]")]
        [ApiController]
        public class CheckHistoricController : ControllerBase
        {
            private readonly ICheckHistoricService _checkHistoricService;

            public CheckHistoricController(ICheckHistoricService checkHistoricService)
            {
                _checkHistoricService = checkHistoricService;
            }

            // GET: api/CheckHistoric
            [HttpGet]
            public async Task<ActionResult<IEnumerable<CheckHistoric>>> GetCheckHistorics()
            {
                var checkHistorics = await _checkHistoricService.GetAllAsync(); 
                return Ok(checkHistorics);
            }

            // GET: api/CheckHistoric/{id}
            [HttpGet("{id}")]
            public async Task<ActionResult<CheckHistoric>> GetCheckHistoric(string id)
            {
                var checkHistoric = await _checkHistoricService.ReadAsync(id);
                if (checkHistoric == null)
                {
                    return NotFound();
                }
                return Ok(checkHistoric);
            }

            // POST: api/CheckHistoric
            [HttpPost]
            public async Task<ActionResult<CheckHistoric>> PostCheckHistoric(CheckHistoric checkHistoric)
            {
                await _checkHistoricService.CreateAsync(checkHistoric);
                return CreatedAtAction(nameof(GetCheckHistoric), new { id = checkHistoric.Id }, checkHistoric);
            }

            // PUT: api/CheckHistoric/{id}
            [HttpPut("{id}")]
            public async Task<IActionResult> PutCheckHistoric(string id, CheckHistoric checkHistoric)
            {
                if (id != checkHistoric.Id)
                {
                    return BadRequest("ID mismatch");
                }

                var existingCheckHistoric = await _checkHistoricService.ReadAsync(id);
                if (existingCheckHistoric == null)
                {
                    return NotFound();
                }

                await _checkHistoricService.UpdateAsync(checkHistoric);
                return NoContent();
            }

            // DELETE: api/CheckHistoric/{id}
            [HttpDelete("{id}")]
            public async Task<IActionResult> DeleteCheckHistoric(string id)
            {
                var existingCheckHistoric = await _checkHistoricService.ReadAsync(id);
                if (existingCheckHistoric == null)
                {
                    return NotFound();
                }

                await _checkHistoricService.DeleteAsync(id);
                return NoContent();
            }
        }
    }

