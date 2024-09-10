using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Reporting.Core.IService;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Reporting.Application.Services
{
    public class SettingsHostedService : IHostedService
    {
        private readonly IServiceProvider _serviceProvider;

        public SettingsHostedService(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            using (var scope = _serviceProvider.CreateScope())
            {
                var settingsService = scope.ServiceProvider.GetRequiredService<ISettingsService>();
                await settingsService.PopulateMetadataAsync();
            }
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            return Task.CompletedTask;
        }
    }
}
