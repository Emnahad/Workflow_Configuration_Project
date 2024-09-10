using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Reporting.Core.IService
{
    public interface IDatabaseService
    {
        Task<List<string>> GetCollectionsAsync();
        Task<List<string>> GetCollectionColumnsAsync(string collectionName);
        Task<List<string>> GetColumnValuesAsync(string collectionName, string columnName);
        //Task<bool> ContainsAsync(string collectionName, params string[] values);
        /*Task<bool> NotContainsAsync(string collectionName, params string[] values);
        Task<List<string>> GetUppercaseAsync(string collectionName, string columnName);
        Task<int?> GetMaxValueAsync(string collectionName, string columnName);
        Task<int?> GetMinValueAsync(string collectionName, string columnName);
        Task<double?> GetAverageValueAsync(string collectionName, string columnName);
        Task<List<BsonDocument>> GetValuesGreaterThanAsync(string collectionName, string columnName, object value);
        Task<List<BsonDocument>> GetValuesLessThanAsync(string collectionName, string columnName, object value);
        Task<List<BsonDocument>> GetSpecificValueAsync(string tableName, string columnName, object value);*/
        Task UpdateColumnValueAsync(string tableName, string columnName, string oldValue, string newValue);
        Task DeleteColumnValueAsync(string tableName, string columnName, string value);

    }
}
