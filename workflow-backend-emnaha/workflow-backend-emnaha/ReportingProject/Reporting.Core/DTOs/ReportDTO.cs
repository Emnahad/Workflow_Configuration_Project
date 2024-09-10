using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Reporting.Core.DTOs
{
    public class ReportDTO
    {
        public string? ExecutionId { get; set; }

        public string Ticket { get; set; }
        public string Reason { get; set; }
        public string TesterComment { get; set; }
    }
}
