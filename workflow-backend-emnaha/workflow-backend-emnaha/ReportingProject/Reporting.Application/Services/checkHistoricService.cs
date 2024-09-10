using MongoDB.Driver;
using Reporting.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Reporting.Core.IService;
namespace Reporting.Application.Services
{
    public class CheckHistoricService : ICheckHistoricService
    {
        private readonly IMongoCollection<CheckHistoric> _checkHistoric;

        public CheckHistoricService(IMongoCollection<CheckHistoric> checkHistoric)
        {
            _checkHistoric = checkHistoric;
        }

        public async Task<CheckHistoric> CreateAsync(CheckHistoric checkHistoric)
        {
            await _checkHistoric.InsertOneAsync(checkHistoric);
            return checkHistoric;
        }
        public async Task<IEnumerable<CheckHistoric>> GetAllAsync() 
        {
            return await _checkHistoric.Find(_ => true).ToListAsync();
        }
        public async Task<CheckHistoric> ReadAsync(string id)
        {
            var filter = Builders<CheckHistoric>.Filter.Eq(ch => ch.Id, id);
            return await _checkHistoric.Find(filter).FirstOrDefaultAsync();
        }

        public async Task UpdateAsync(CheckHistoric checkHistoric)
        {
            var filter = Builders<CheckHistoric>.Filter.Eq(ch => ch.Id, checkHistoric.Id);
            await _checkHistoric.ReplaceOneAsync(filter, checkHistoric);
        }

        public async Task DeleteAsync(string id)
        {
            var filter = Builders<CheckHistoric>.Filter.Eq(ch => ch.Id, id);
            await _checkHistoric.DeleteOneAsync(filter);
        }
    }
}
