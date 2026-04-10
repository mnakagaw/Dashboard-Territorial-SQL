// =============================================================================
// DataService.cs — SQL Server data access for dataset_assets
// =============================================================================

using Microsoft.Data.SqlClient;

namespace DashboardTerritorial.Server.Services;

public class DataService
{
    private readonly string _connectionString;

    public DataService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Missing 'DefaultConnection' connection string.");
    }

    /// <summary>
    /// Returns the raw JSON content for the given asset key, or null if not found.
    /// Only returns active (is_active = 1) datasets.
    /// </summary>
    public async Task<string?> GetDatasetAsync(string assetKey)
    {
        const string sql = @"
            SELECT json_content
            FROM dataset_assets
            WHERE asset_key = @key AND is_active = 1";

        using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync();

        using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@key", assetKey);

        var result = await cmd.ExecuteScalarAsync();
        return result as string;
    }

    /// <summary>
    /// Returns a list of all active asset keys with metadata.
    /// </summary>
    public async Task<List<DatasetInfo>> GetAllDatasetsAsync()
    {
        const string sql = @"
            SELECT asset_key, version_no, content_hash, source_name, updated_at, notes
            FROM dataset_assets
            WHERE is_active = 1
            ORDER BY asset_key";

        var list = new List<DatasetInfo>();

        using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync();

        using var cmd = new SqlCommand(sql, conn);
        using var reader = await cmd.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            list.Add(new DatasetInfo
            {
                AssetKey    = reader.GetString(0),
                VersionNo   = reader.GetInt32(1),
                ContentHash = reader.GetString(2).Trim(),
                SourceName  = reader.IsDBNull(3) ? null : reader.GetString(3),
                UpdatedAt   = reader.GetDateTime(4),
                Notes       = reader.IsDBNull(5) ? null : reader.GetString(5),
            });
        }

        return list;
    }
}

public class DatasetInfo
{
    public string AssetKey { get; set; } = "";
    public int VersionNo { get; set; }
    public string ContentHash { get; set; } = "";
    public string? SourceName { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? Notes { get; set; }
}
