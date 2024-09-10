using Reporting.Core.IService;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Reporting.Core.Entities
{
    public class TraverseWorkflowRequest
    {
        public WorkflowNode Node { get; set; }
        public Dictionary<string, object> Row { get; set; }
        public Workflow Workflow { get; set; }
        public List<string> ErrorMessages { get; set; } = new List<string>();
        public string FinalResultMessage { get; set; }
    }


}
