namespace Reporting.Infrastracture.Configuration
{
    public class ReportingDatabaseSettings
    {
        public string MongoDb { get; set; } = string.Empty; // Should match "MongoDb" in JSON
        public string DatabaseName { get; set; } = string.Empty; // Should match "DatabaseName" in JSON
        public string ReportingCollectionName { get; set; } = null!;
        public string ExecutionCollectionName { get; set; } = null!;
        public string WorkflowCollectionName { get; set; } = null!;
    }
}
