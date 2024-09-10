using Reporting.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Reporting.Core.IService
{
    public interface ICheckHistoricService
    {
        Task<CheckHistoric> CreateAsync(CheckHistoric checkHistoric);
        Task<IEnumerable<CheckHistoric>> GetAllAsync(); // Add this method

        Task<CheckHistoric> ReadAsync(string id);
        Task UpdateAsync(CheckHistoric checkHistoric);
        Task DeleteAsync(string id);
    }
}
