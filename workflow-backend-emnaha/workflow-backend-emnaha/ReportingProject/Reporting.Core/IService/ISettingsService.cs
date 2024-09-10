using MongoDB.Bson;
using Reporting.Core.Entities;

public interface ISettingsService
{
    Task PopulateMetadataAsync();
    Task<List<string>> GetAllCollectionsAsync();
    Task<List<string>> GetColumnNamesByCollectionAsync(string collectionName);
    Task<List<string>> GetPossibleValuesByTableAndColumnAsync(string tableName, string columnName);
    Task<Dictionary<string, string>> GetColumnsTypeByCollectionAsync(string collectionName);
    Task<Dictionary<string, string>> GetColumnNamesAndTypesByCollectionAsync(string collectionName);
    Task<List<Settings>> GetCollectionsNotContainingValueAsync(string tableName, string columnName, string value);
    Task<List<Settings>> GetCollectionsContainingValueAsync(string tableName, string columnName, string value);
    Task<List<string>> GetUppercaseAsync(string tableName, string columnName, string value); // Changed return type
    Task<string> GetMaxValueAsync(string tableName, string columnName, string[] values);
    Task<string> GetMinValueAsync(string tableName, string columnName, string[] values);
    Task<decimal> GetAverageValueAsync(string tableName, string columnName, string[] values);
    Task<List<BsonDocument>> GetValuesGreaterThanAsync(string collectionName, string columnName, object value);
    Task<List<BsonDocument>> GetValuesLessThanAsync(string collectionName, string columnName, object value);
    Task<List<BsonDocument>> GetSpecificValueAsync(string collectionName, string columnName, object value);
    Task UpdateColumnValueAsync(string tableName, string columnName, string oldValue, string newValue);
    Task DeleteColumnValueAsync(string tableName, string columnName, string value);
}
