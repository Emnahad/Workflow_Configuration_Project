using MongoDB.Bson;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Reporting.Core.IService;

namespace Reporting.Application.Services
{
    public class DatabaseService : IDatabaseService
    {
        private readonly IMongoDatabase _database;

        public DatabaseService(IMongoDatabase database)
        {
            _database = database;
        }

        public async Task<List<string>> GetCollectionsAsync()
        {
            // Fetch all collection names and filter out 'Metadata' and 'Workflows'
            var collections = await _database.ListCollectionNames().ToListAsync();
            var filteredCollections = collections
                .Where(collectionName => collectionName != "Metadata" && collectionName != "workflows" && collectionName != "CheckHistoric")
                .ToList();

            return filteredCollections;
        }

        public async Task<List<string>> GetCollectionColumnsAsync(string collectionName)
        {
            var collection = _database.GetCollection<BsonDocument>(collectionName);

            var firstDocument = await collection.Find(new BsonDocument()).FirstOrDefaultAsync();
            if (firstDocument == null)
            {
                return new List<string>();
            }

            var columnNames = firstDocument.Names.ToList();
            return columnNames;
        }

        public async Task<List<string>> GetColumnValuesAsync(string collectionName, string columnName)
        {
            var stopwatch = Stopwatch.StartNew();
            var collection = _database.GetCollection<BsonDocument>(collectionName);

            var filter = Builders<BsonDocument>.Filter.Exists(columnName);
            var distinctValues = await collection.Distinct<BsonValue>(columnName, filter).ToListAsync();

            var stringValues = distinctValues
                .Where(value => value != null)
                .Select(value => value.IsObjectId ? value.AsObjectId.ToString() : value.ToString())
                .ToList();

            stopwatch.Stop();
            Console.WriteLine($"GetColumnValuesAsync execution time: {stopwatch.ElapsedMilliseconds} ms");

            return stringValues;
        }

        public async Task UpdateColumnValueAsync(string tableName, string columnName, string oldValue, string newValue)
        {
            try
            {
                var collection = _database.GetCollection<BsonDocument>(tableName);

                // Define the filter to select the documents where the column value matches the oldValue
                var filter = Builders<BsonDocument>.Filter.Eq(columnName, oldValue);

                // Define the update operation to set the new value
                var update = Builders<BsonDocument>.Update.Set(columnName, newValue);

                // Execute the update operation
                var result = await collection.UpdateManyAsync(filter, update);

                Console.WriteLine($"Matched {result.MatchedCount} documents and modified {result.ModifiedCount} documents.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An error occurred while updating the column value: {ex.Message}");
            }
        }
        public async Task DeleteColumnValueAsync(string tableName, string columnName, string value)
        {
            try
            {
                var collection = _database.GetCollection<BsonDocument>(tableName);

                // Create a filter to find the document where the column has the specific value
                var filter = Builders<BsonDocument>.Filter.Eq(columnName, value);

                // Perform the delete operation
                var result = await collection.DeleteManyAsync(filter);

                Console.WriteLine($"Deleted {result.DeletedCount} documents where {columnName} = {value} in {tableName}.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An error occurred while deleting the value: {ex.Message}");
                throw;
            }
        }
       

       

    }
}
