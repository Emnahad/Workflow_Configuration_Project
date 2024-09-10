using Microsoft.VisualBasic;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Collections.Generic;
using System.Text.Json;

namespace Reporting.Core.Entities
{
    public class Workflow
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }
        [BsonElement("Workflow Title")]
        public string? Title{ get; set; }//Title of the workflow
        [BsonElement("Tag")]
        public List<string> Tag { get; set; } //list of columns retrived from every node in the workflow

        [BsonElement("root")]
        public WorkflowNode Root { get; set; }
        [BsonElement("idMappings")]
        public Dictionary<string, string> OriginalNodeIdMappings { get; set; } = new Dictionary<string, string>();

        [BsonElement("connectors")]
        public List<Connector> Connectors { get; set; }
    }

    public class WorkflowNode
    {
        [BsonElement("id")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        [BsonElement("type")]
        public string Type { get; set; }//NodeType: Decision-Node or Logger-Node

        [BsonElement("data")]
        public NodeData Data { get; set; }

        [BsonElement("children")]
        public List<WorkflowNode> Children { get; set; }
    }

    public class Connector
    {
        [BsonElement("startStepId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string StartStepId { get; set; }

        [BsonElement("endStepId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string EndStepId { get; set; }
    }

    public class NodeData
    {
        [BsonElement("name")]
        public string Name { get; set; } //StateNode (eg Normal Node or End State or Yes Condition Node or No Condition Node

        [BsonElement("inputs")]
        public List<ColumnActions> Inputs { get; set; } //constains the list of actions or conditions for every selected column
    }
    public class ColumnActions { 
        public string TableName { get; set; }
        public string ColumnName { get; set; }
        public string Description { get; set; } //Description of the action(for the logger-Node or description of the condition for Decision-Node)
        public List<ActionItems>? Actions { get; set; }//List containing the crudName, the condition and the values for the logger-Node and operator for 

    }
    public class ActionItems {
        public ActionKeyWords? CrudCommandAction { get; set; }
        public string? OperatorDecision { get; set; }
        public List<string>? Values { get; set; }
        public Dictionary<string,string>? NewValues { get; set; }
    }
    public class ActionKeyWords
    {
        public string? Crud { get; set; }
        public string? Condition { get; set; }
    }
}
