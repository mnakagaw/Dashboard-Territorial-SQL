// =============================================================================
// Program.cs — Dashboard Territorial API
//
// Serves:
//  1. /api/data/{assetKey}  — JSON dataset from SQL Server
//  2. Static files          — React SPA + GeoJSON from wwwroot/
//  3. SPA fallback          — client-side routing support
// =============================================================================

var builder = WebApplication.CreateBuilder(args);

// Register services
builder.Services.AddControllers();
builder.Services.AddSingleton<DashboardTerritorial.Server.Services.DataService>();

// CORS for development (Vite dev server on different port)
builder.Services.AddCors(options =>
{
    options.AddPolicy("DevCors", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// In development, allow cross-origin from Vite
if (app.Environment.IsDevelopment())
{
    app.UseCors("DevCors");
}

// Serve static files from wwwroot (includes SPA build + GeoJSON)
app.UseStaticFiles();

// Map API controllers
app.MapControllers();

// SPA fallback: any unmatched route → index.html
app.MapFallbackToFile("dashboard/index.html");

app.Run();
