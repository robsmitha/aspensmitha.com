using Elysian.Application;
using Elysian.Infrastructure;
using Elysian.Infrastructure.Context;
using ElysianFunctions.Middleware;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System.Reflection;

var host = new HostBuilder()
    .ConfigureAppConfiguration((context, config) =>
    {
        if (context.HostingEnvironment.IsDevelopment())
        {
            config.AddUserSecrets<Program>();
        }
    })
    .ConfigureServices((hostContext, services) =>
    {
        services.AddElysianFeatures<FunctionsWorkerHeaderStrategy>(hostContext.Configuration);

        services.AddContentManagementFeatures(hostContext.Configuration);

        services.AddCodeFeatures(hostContext.Configuration);

        services.AddCongressFeatures(hostContext.Configuration);

        services.AddFinancialFeatures(hostContext.Configuration);

        services.AddAzureStorageFeatures(hostContext.Configuration);

        services.AddApplication();
    })
    .ConfigureFunctionsWorkerDefaults(builder =>
    {
        builder.UseMiddleware<ClaimsPrincipalMiddleware>();
        builder.UseMiddleware<ExceptionHandlingMiddleware>();
        builder.UseMiddleware<MuliTenantFunctionsWorkerMiddleware>();
    })
    .Build();

var environment = host.Services.GetRequiredService<IHostEnvironment>();
if (environment.IsDevelopment())
{
    var elysianContext = host.Services.GetRequiredService<ElysianContext>();
    await elysianContext.Database.MigrateAsync();
}

await host.RunAsync();
