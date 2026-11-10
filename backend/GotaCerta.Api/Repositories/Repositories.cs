using GotaCerta.Api.Data;
using GotaCerta.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace GotaCerta.Api.Repositories;

public interface IImovelRepository
{
    Task<List<Imovel>> GetAllAsync(string? bairro = null, int? usuarioId = null);
    Task<Imovel?> GetByIdAsync(int id);
    Task<Imovel> CreateAsync(Imovel imovel);
    Task<Imovel> UpdateAsync(Imovel imovel);
    Task<bool> DeleteAsync(int id);
}

public interface ISensorRepository
{
    Task<List<SensorIoT>> GetAllAsync(int? imovelId = null);
    Task<SensorIoT?> GetByCodigoAsync(string codigoDispositivo);
    Task<SensorIoT> CreateAsync(SensorIoT sensor);
    Task<bool> DeleteAsync(int id);
}

public interface ILeituraAlertaRepository
{
    Task<List<LeituraHidrometro>> GetLeiturasByImovelAsync(int imovelId);
    Task<List<LeituraHidrometro>> GetRecentLeiturasAsync(int? imovelId = null, int limit = 50);
    Task<LeituraHidrometro> AddLeituraAsync(LeituraHidrometro leitura);
    Task<List<AlertaConsumo>> GetAlertasAsync(bool? apenasAtivos = null, int? imovelId = null);
    Task<AlertaConsumo?> GetAlertaByIdAsync(int id);
    Task<AlertaConsumo> AddAlertaAsync(AlertaConsumo alerta);
    Task<AlertaConsumo> UpdateAlertaAsync(AlertaConsumo alerta);
    Task<bool> DeleteAlertaAsync(int id);
}

public class ImovelRepository : IImovelRepository
{
    private readonly AppDbContext _context;

    public ImovelRepository(AppDbContext context) => _context = context;

    public async Task<List<Imovel>> GetAllAsync(string? bairro = null, int? usuarioId = null)
    {
        var query = _context.Imoveis
            .Include(i => i.Sensores)
            .Include(i => i.Alertas.Where(a => !a.Resolvido))
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(bairro))
            query = query.Where(i => i.Bairro.ToLower() == bairro.ToLower());

        if (usuarioId.HasValue)
            query = query.Where(i => i.UsuarioId == usuarioId.Value);

        return await query.OrderBy(i => i.Id).ToListAsync();
    }

    public async Task<Imovel?> GetByIdAsync(int id)
    {
        return await _context.Imoveis
            .Include(i => i.Usuario)
            .Include(i => i.Sensores)
            .Include(i => i.Alertas)
            .FirstOrDefaultAsync(i => i.Id == id);
    }

    public async Task<Imovel> CreateAsync(Imovel imovel)
    {
        _context.Imoveis.Add(imovel);
        await _context.SaveChangesAsync();
        return imovel;
    }

    public async Task<Imovel> UpdateAsync(Imovel imovel)
    {
        _context.Imoveis.Update(imovel);
        await _context.SaveChangesAsync();
        return imovel;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var imovel = await _context.Imoveis.FindAsync(id);
        if (imovel is null) return false;

        _context.Imoveis.Remove(imovel);
        await _context.SaveChangesAsync();
        return true;
    }
}

public class SensorRepository : ISensorRepository
{
    private readonly AppDbContext _context;

    public SensorRepository(AppDbContext context) => _context = context;

    public async Task<List<SensorIoT>> GetAllAsync(int? imovelId = null)
    {
        var query = _context.SensoresIoT.AsQueryable();
        if (imovelId.HasValue)
            query = query.Where(s => s.ImovelId == imovelId.Value);

        return await query.OrderBy(s => s.Id).ToListAsync();
    }

    public async Task<SensorIoT?> GetByCodigoAsync(string codigoDispositivo)
    {
        return await _context.SensoresIoT
            .Include(s => s.Imovel)
            .FirstOrDefaultAsync(s => s.CodigoDispositivo == codigoDispositivo);
    }

    public async Task<SensorIoT> CreateAsync(SensorIoT sensor)
    {
        _context.SensoresIoT.Add(sensor);
        await _context.SaveChangesAsync();
        return sensor;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var sensor = await _context.SensoresIoT.FindAsync(id);
        if (sensor is null) return false;

        _context.SensoresIoT.Remove(sensor);
        await _context.SaveChangesAsync();
        return true;
    }
}

public class LeituraAlertaRepository : ILeituraAlertaRepository
{
    private readonly AppDbContext _context;

    public LeituraAlertaRepository(AppDbContext context) => _context = context;

    public async Task<List<LeituraHidrometro>> GetLeiturasByImovelAsync(int imovelId)
    {
        return await _context.LeiturasHidrometro
            .Include(l => l.Sensor)
            .Where(l => l.Sensor != null && l.Sensor.ImovelId == imovelId)
            .OrderBy(l => l.DataHoraLeitura)
            .ToListAsync();
    }

    public async Task<List<LeituraHidrometro>> GetRecentLeiturasAsync(int? imovelId = null, int limit = 50)
    {
        var query = _context.LeiturasHidrometro
            .Include(l => l.Sensor)
            .AsQueryable();

        if (imovelId.HasValue)
            query = query.Where(l => l.Sensor != null && l.Sensor.ImovelId == imovelId.Value);

        return await query
            .OrderByDescending(l => l.DataHoraLeitura)
            .Take(Math.Clamp(limit, 1, 200))
            .ToListAsync();
    }

    public async Task<LeituraHidrometro> AddLeituraAsync(LeituraHidrometro leitura)
    {
        _context.LeiturasHidrometro.Add(leitura);
        await _context.SaveChangesAsync();
        return leitura;
    }

    public async Task<List<AlertaConsumo>> GetAlertasAsync(bool? apenasAtivos = null, int? imovelId = null)
    {
        var query = _context.AlertasConsumo
            .Include(a => a.Leitura)
            .AsQueryable();

        if (apenasAtivos.HasValue)
            query = query.Where(a => a.Resolvido != apenasAtivos.Value);

        if (imovelId.HasValue)
            query = query.Where(a => a.ImovelId == imovelId.Value);

        return await query.OrderByDescending(a => a.DataGeracao).ToListAsync();
    }

    public async Task<AlertaConsumo?> GetAlertaByIdAsync(int id)
    {
        return await _context.AlertasConsumo.FindAsync(id);
    }

    public async Task<AlertaConsumo> AddAlertaAsync(AlertaConsumo alerta)
    {
        _context.AlertasConsumo.Add(alerta);
        await _context.SaveChangesAsync();
        return alerta;
    }

    public async Task<AlertaConsumo> UpdateAlertaAsync(AlertaConsumo alerta)
    {
        _context.AlertasConsumo.Update(alerta);
        await _context.SaveChangesAsync();
        return alerta;
    }

    public async Task<bool> DeleteAlertaAsync(int id)
    {
        var alerta = await _context.AlertasConsumo.FindAsync(id);
        if (alerta is null) return false;

        _context.AlertasConsumo.Remove(alerta);
        await _context.SaveChangesAsync();
        return true;
    }
}
