// =============================================================================
// DataController.cs — API endpoints for dashboard data
//
// GET /api/data           — list all active dataset keys + metadata
// GET /api/data/{key}     — return raw JSON for the given asset key
// =============================================================================

using Microsoft.AspNetCore.Mvc;
using DashboardTerritorial.Server.Services;

namespace DashboardTerritorial.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DataController : ControllerBase
{
    private readonly DataService _dataService;

    public DataController(DataService dataService)
    {
        _dataService = dataService;
    }

    /// <summary>
    /// GET /api/data
    /// Returns the list of all active dataset keys with version and metadata.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> ListDatasets()
    {
        var datasets = await _dataService.GetAllDatasetsAsync();
        return Ok(datasets);
    }

    /// <summary>
    /// GET /api/data/{assetKey}
    /// Returns the raw JSON content for the specified dataset.
    /// The response body is the exact same JSON that was previously served
    /// as a static .json file — fully backward-compatible with the frontend.
    /// </summary>
    [HttpGet("{assetKey}")]
    public async Task<IActionResult> GetDataset(string assetKey)
    {
        var json = await _dataService.GetDatasetAsync(assetKey);

        if (json is null)
        {
            return NotFound(new { error = $"Dataset '{assetKey}' not found or inactive." });
        }

        // Return raw JSON string with correct content type.
        // Using Content() instead of Ok() avoids double-serialization.
        return Content(json, "application/json; charset=utf-8");
    }
}
