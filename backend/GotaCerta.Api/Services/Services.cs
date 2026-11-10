using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using GotaCerta.Api.Data;
using GotaCerta.Api.DTOs;
using GotaCerta.Api.Models;
using GotaCerta.Api.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace GotaCerta.Api.Services;

/// <summary>
/// Utilitário criptográfico para armazenamento de senhas em Hash PBKDF2-SHA256 com Salt aleatório
/// (Parte 5 - Segurança: nunca armazena senhas em texto puro).
/// </summary>
public static class PasswordHasher
{
    public static string HashPassword(string password)
    {
        byte[] salt = RandomNumberGenerator.GetBytes(16);
        byte[] hash = Rfc2898DeriveBytes.Pbkdf2(
            Encoding.UTF8.GetBytes(password),
            salt,
            iterations: 100_000,
            HashAlgorithmName.SHA256,
            outputLength: 32);

        return $"PBKDF2$100000${Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}";
    }

    public static bool VerifyPassword(string password, string storedHash)
    {
        if (storedHash.StartsWith("PBKDF2$"))
        {
            var parts = storedHash.Split('$');
            if (parts.Length != 4) return false;
            int iterations = int.Parse(parts[1]);
            byte[] salt = Convert.FromBase64String(parts[2]);
            byte[] expectedHash = Convert.FromBase64String(parts[3]);

            byte[] actualHash = Rfc2898DeriveBytes.Pbkdf2(
                Encoding.UTF8.GetBytes(password),
                salt,
                iterations,
                HashAlgorithmName.SHA256,
                expectedHash.Length);

            return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
        }

        // Compatibilidade com a senha padrão dos scripts SQL de seed ("GotaCerta@2026")
        return password == "GotaCerta@2026";
    }
}

public interface IAuthService
{
    Task<AuthResponseDto?> LoginAsync(LoginRequestDto dto);
    Task<AuthResponseDto> RegisterAsync(RegisterUsuarioDto dto);
}

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _config;

    public AuthService(AppDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginRequestDto dto)
    {
        var emailNormalizado = dto.Email.Trim().ToLowerInvariant();
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email.ToLower() == emailNormalizado);

        if (usuario is null || !PasswordHasher.VerifyPassword(dto.Senha, usuario.SenhaHash))
            return null;

        return GenerateTokenResponse(usuario);
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterUsuarioDto dto)
    {
        var emailNormalizado = dto.Email.Trim().ToLowerInvariant();
        if (await _context.Usuarios.AnyAsync(u => u.Email.ToLower() == emailNormalizado))
            throw new InvalidOperationException("Já existe um usuário cadastrado com este e-mail.");

        var novoUsuario = new Usuario
        {
            Nome = dto.Nome.Trim(),
            Email = emailNormalizado,
            SenhaHash = PasswordHasher.HashPassword(dto.Senha),
            Perfil = dto.Perfil.ToUpperInvariant(),
            Telefone = dto.Telefone
        };

        _context.Usuarios.Add(novoUsuario);
        await _context.SaveChangesAsync();

        return GenerateTokenResponse(novoUsuario);
    }

    private AuthResponseDto GenerateTokenResponse(Usuario usuario)
    {
        var secret = _config["JwtSettings:SecretKey"] ?? "GotaCerta_FIAP_GlobalSolution_2026_ChaveSecretaSuperSegura_3ESOA!";
        var issuer = _config["JwtSettings:Issuer"] ?? "GotaCerta.Api";
        var audience = _config["JwtSettings:Audience"] ?? "GotaCerta.Client";
        var expiraEm = DateTime.UtcNow.AddHours(8);

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
            new Claim(ClaimTypes.Name, usuario.Nome),
            new Claim(ClaimTypes.Email, usuario.Email),
            new Claim(ClaimTypes.Role, usuario.Perfil)
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiraEm,
            signingCredentials: creds);

        var tokenStr = new JwtSecurityTokenHandler().WriteToken(token);
        return new AuthResponseDto(usuario.Id, usuario.Nome, usuario.Email, usuario.Perfil, tokenStr, expiraEm);
    }
}

public interface ITelemetriaService
{
    Task<LeituraProcessedResponseDto> ProcessarLeituraIoTAsync(CreateLeituraIoTDto dto);
    Task<DashboardResumoDto> ObterResumoDashboardAsync();
}

/// <summary>
/// Motor de regras de telemetria hídrica (Parte 2 + Parte 6 IoT).
/// Avalia os pulsos da relojoaria do hidrômetro (Ref. PIBIC/UNICAMP) e o nível
/// do reservatório para disparar alertas automáticos na aplicação.
/// </summary>
public class TelemetriaService : ITelemetriaService
{
    private readonly ISensorRepository _sensorRepo;
    private readonly ILeituraAlertaRepository _leituraAlertaRepo;
    private readonly AppDbContext _context;

    public TelemetriaService(
        ISensorRepository sensorRepo,
        ILeituraAlertaRepository leituraAlertaRepo,
        AppDbContext context)
    {
        _sensorRepo = sensorRepo;
        _leituraAlertaRepo = leituraAlertaRepo;
        _context = context;
    }

    public async Task<LeituraProcessedResponseDto> ProcessarLeituraIoTAsync(CreateLeituraIoTDto dto)
    {
        var sensor = await _sensorRepo.GetByCodigoAsync(dto.CodigoDispositivo)
            ?? throw new KeyNotFoundException($"Sensor IoT '{dto.CodigoDispositivo}' não encontrado.");

        var horarioLeitura = dto.DataHoraLeitura ?? DateTime.UtcNow;

        var leitura = new LeituraHidrometro
        {
            SensorId = sensor.Id,
            PulsosRegistrados = dto.PulsosRegistrados,
            VazaoInstantaneaLpm = dto.VazaoInstantaneaLpm,
            VolumeAcumuladoLitros = dto.VolumeAcumuladoLitros,
            NivelCaixaPercentual = dto.NivelCaixaPercentual,
            PressaoRuaBar = dto.PressaoRuaBar,
            DataHoraLeitura = horarioLeitura
        };

        await _leituraAlertaRepo.AddLeituraAsync(leitura);

        // Regra 1: Surto de Vazão / Cano Rompido (Vazão ultrapassa o limite do sensor)
        if (dto.VazaoInstantaneaLpm > sensor.LimiteVazaoAlertaLpm)
        {
            var desperdicioHora = Math.Round(dto.VazaoInstantaneaLpm * 60m, 2);
            var alerta = await _leituraAlertaRepo.AddAlertaAsync(new AlertaConsumo
            {
                ImovelId = sensor.ImovelId,
                LeituraId = leitura.Id,
                TipoAlerta = "CANO_ROMPIDO_PICO",
                Severidade = "CRITICA",
                Mensagem = $"Vazão crítica de {dto.VazaoInstantaneaLpm:F1} L/min detectada na relojoaria do hidrômetro (limite: {sensor.LimiteVazaoAlertaLpm:F1} L/min). Feche o registro geral!",
                DesperdicioEstimadoLitros = desperdicioHora,
                Resolvido = false
            });

            return new LeituraProcessedResponseDto(
                leitura.Id, sensor.CodigoDispositivo, leitura.VazaoInstantaneaLpm,
                leitura.VolumeAcumuladoLitros, leitura.NivelCaixaPercentual, leitura.PressaoRuaBar,
                true, alerta.TipoAlerta, alerta.Mensagem);
        }

        // Regra 2: Vazamento Oculto Contínuo na Madrugada (01h às 05h com fluxo entre 0.4 eLimite)
        if (horarioLeitura.Hour >= 1 && horarioLeitura.Hour <= 5 && dto.VazaoInstantaneaLpm >= 0.4m)
        {
            var desperdicioDia = Math.Round(dto.VazaoInstantaneaLpm * 60m * 6m, 2);
            var alerta = await _leituraAlertaRepo.AddAlertaAsync(new AlertaConsumo
            {
                ImovelId = sensor.ImovelId,
                LeituraId = leitura.Id,
                TipoAlerta = "VAZAMENTO_OCULTO_MADRUGADA",
                Severidade = "MEDIA",
                Mensagem = $"Giro contínuo na relojoaria ({dto.VazaoInstantaneaLpm:F2} L/min) às {horarioLeitura:HH:mm}. Indício de vazamento oculto em descarga ou boia!",
                DesperdicioEstimadoLitros = desperdicioDia,
                Resolvido = false
            });

            return new LeituraProcessedResponseDto(
                leitura.Id, sensor.CodigoDispositivo, leitura.VazaoInstantaneaLpm,
                leitura.VolumeAcumuladoLitros, leitura.NivelCaixaPercentual, leitura.PressaoRuaBar,
                true, alerta.TipoAlerta, alerta.Mensagem);
        }

        // Regra 3: Caixa d'Água Crítica + Queda de Pressão na Rede Pública
        if (dto.NivelCaixaPercentual <= 20.0m || dto.PressaoRuaBar <= 0.1m)
        {
            var tipo = dto.NivelCaixaPercentual <= 20.0m ? "CAIXA_DAGUA_CRITICA" : "FALTA_DAGUA_BAIRRO";
            var severidade = dto.NivelCaixaPercentual <= 20.0m ? "CRITICA" : "MEDIA";
            var msg = $"Pressão da rua em {dto.PressaoRuaBar:F1} bar e reservatório em {dto.NivelCaixaPercentual:F1}%. Economia preventiva recomendada!";

            var alerta = await _leituraAlertaRepo.AddAlertaAsync(new AlertaConsumo
            {
                ImovelId = sensor.ImovelId,
                LeituraId = leitura.Id,
                TipoAlerta = tipo,
                Severidade = severidade,
                Mensagem = msg,
                DesperdicioEstimadoLitros = 0m,
                Resolvido = false
            });

            return new LeituraProcessedResponseDto(
                leitura.Id, sensor.CodigoDispositivo, leitura.VazaoInstantaneaLpm,
                leitura.VolumeAcumuladoLitros, leitura.NivelCaixaPercentual, leitura.PressaoRuaBar,
                true, alerta.TipoAlerta, alerta.Mensagem);
        }

        return new LeituraProcessedResponseDto(
            leitura.Id, sensor.CodigoDispositivo, leitura.VazaoInstantaneaLpm,
            leitura.VolumeAcumuladoLitros, leitura.NivelCaixaPercentual, leitura.PressaoRuaBar,
            false, null, "Leitura dentro dos parâmetros normais.");
    }

    public async Task<DashboardResumoDto> ObterResumoDashboardAsync()
    {
        var totalImoveis = await _context.Imoveis.CountAsync();
        var totalSensores = await _context.SensoresIoT.CountAsync(s => s.Ativo);
        var alertasAtivos = await _context.AlertasConsumo.Where(a => !a.Resolvido).ToListAsync();
        var desperdicio = alertasAtivos.Sum(a => a.DesperdicioEstimadoLitros);
        var cidadaos = await _context.Imoveis.SumAsync(i => i.MoradoresAtendidos);

        return new DashboardResumoDto(
            totalImoveis,
            totalSensores,
            alertasAtivos.Count,
            desperdicio,
            cidadaos);
    }
}
