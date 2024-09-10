using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Reporting.Core.Entities
{
    public class CheckHistoric
    {
        public string Id { get; set; }
        public string CheckName { get; set; }
        public DateOnly CheckDate { get; set; }
        public string WorkflowTitle { get; set; }
        public CheckResult WorkflowCheckResult { get; set; }
    }
    public class CheckResult
    {
        public string Id { get; set; }
        public string? SuccessResult { get; set; }
        public List<string>? ErrorMessages { get; set; } = new List<string>();
    }
}
