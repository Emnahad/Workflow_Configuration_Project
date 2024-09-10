using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Collections.Generic;

namespace Reporting.Core.Entities
{
    public class Settings
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        [BsonElement("tableName")]
        public string TableName { get; set; }

        [BsonElement("columns")]
        public Dictionary<string, List<string>> Columns { get; set; } = new Dictionary<string, List<string>>();
    }
}
