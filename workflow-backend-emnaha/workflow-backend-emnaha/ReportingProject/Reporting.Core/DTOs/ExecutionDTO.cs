using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson;
using MongoDB.EntityFrameworkCore;
using System.Text.Json.Serialization;

namespace Reporting.Core.DTOs
{
    public class ExecutionDTO
    {
        public string ExecutionResult { get; set; }

    }  
}
