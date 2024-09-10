using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi.Models;
using MongoDB.Driver;
using Reporting.Application.Services;
using Reporting.Core.IService;
using Reporting.Infrastracture.Configuration;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using MongoDB.Bson.Serialization;
using Reporting.Core.Entities;

var builder = WebApplication.CreateBuilder(args);

// Register MongoDB settings
builder.Services.Configure<ReportingDatabaseSettings>(
    builder.Configuration.GetSection("ConnectionStrings"));

// Register MongoDB client
builder.Services.AddSingleton<IMongoClient>(serviceProvider =>
{
    var settings = serviceProvider.GetRequiredService<IOptions<ReportingDatabaseSettings>>().Value;
    if (string.IsNullOrEmpty(settings.MongoDb))
    {
        throw new ArgumentNullException(nameof(settings.MongoDb), "MongoDB connection string cannot be null or empty.");
    }
    return new MongoClient(settings.MongoDb);
});

// Register MongoDB database (IMongoDatabase)
builder.Services.AddScoped<IMongoDatabase>(serviceProvider =>
{
    var settings = serviceProvider.GetRequiredService<IOptions<ReportingDatabaseSettings>>().Value;
    if (string.IsNullOrEmpty(settings.DatabaseName))
    {
        throw new ArgumentNullException(nameof(settings.DatabaseName), "Database name cannot be null or empty.");
    }
    var client = serviceProvider.GetRequiredService<IMongoClient>();
    return client.GetDatabase(settings.DatabaseName);
});

// Register MongoDB collections
builder.Services.AddScoped<IMongoCollection<CheckHistoric>>(serviceProvider =>
{
    var database = serviceProvider.GetRequiredService<IMongoDatabase>();
    return database.GetCollection<CheckHistoric>("CheckHistoric");
});

// Register services
builder.Services.AddScoped<IWorkflowService, WorkflowService>();
builder.Services.AddSingleton<ISettingsService, SettingsService>();
builder.Services.AddScoped<IDatabaseService, DatabaseService>();
builder.Services.AddHostedService<SettingsHostedService>();
builder.Services.AddScoped<ICheckHistoricService, CheckHistoricService>();

// CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("_myAllowSpecificOrigins", builder =>
    {
        builder.AllowAnyOrigin()
      .AllowAnyMethod()
      .AllowAnyHeader();
    });
});

// Add controllers and Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "My API", Version = "v1" });
});

var app = builder.Build();

// Configure CORS
app.UseCors("_myAllowSpecificOrigins");

// Configure Swagger
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "My API V1");
    });
}

// Configure other middleware
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

// Map controllers
app.MapControllers();

app.Run();
