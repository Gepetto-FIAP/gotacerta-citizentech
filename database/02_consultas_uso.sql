-- ============================================================================
-- FIAP - GLOBAL SOLUTION 2026/2 - CITIZENTECH (3ESOA)
-- PROJETO: GOTA CERTA - AS 5 CONSULTAS DE USO PLANEJADAS (PÁGINA 13 DO GUIA)
-- RESPONSÁVEL: Antônio Aloísio Schappo Neto (RM556429)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- CONSULTA 1: Consumo total (litros) e custo estimado (R$) por imóvel no mês
-- Técnica: JOIN de 4 tabelas (usuarios, imoveis, sensores_iot, leituras_hidrometro),
-- MAX - MIN para obter o volume consumido no mês, e cálculo da tarifa (R$ 8,50/m³).
-- Onde aparece: Dashboard
-- ----------------------------------------------------------------------------
SELECT
    i.apelido_local AS imovel,
    u.nome AS responsavel,
    i.numero_serie_hidrometro AS hidrometro,
    ROUND(MAX(l.volume_acumulado_litros) - MIN(l.volume_acumulado_litros), 2) AS consumo_mes_litros,
    i.meta_consumo_mensal_litros AS meta_mensal_litros,
    ROUND(((MAX(l.volume_acumulado_litros) - MIN(l.volume_acumulado_litros)) / 1000.0) * 8.50, 2) AS custo_estimado_reais
FROM usuarios u
INNER JOIN imoveis i ON i.usuario_id = u.id
INNER JOIN sensores_iot s ON s.imovel_id = i.id
INNER JOIN leituras_hidrometro l ON l.sensor_id = s.id
GROUP BY i.id, i.apelido_local, u.nome, i.numero_serie_hidrometro, i.meta_consumo_mensal_litros
ORDER BY consumo_mes_litros DESC;

-- ----------------------------------------------------------------------------
-- CONSULTA 2: Ranking de bairros com mais alertas de vazamento e volume desperdiçado
-- Técnica: JOIN, COUNT, SUM, GROUP BY
-- Onde aparece: Painel do gestor (/api/bairros/alertas)
-- ----------------------------------------------------------------------------
SELECT
    i.bairro,
    COUNT(DISTINCT i.id) AS imoveis_com_alerta,
    COUNT(a.id) AS total_alertas,
    ROUND(SUM(a.desperdicio_estimado_litros), 2) AS volume_desperdicado_litros
FROM imoveis i
INNER JOIN alertas_consumo a ON a.imovel_id = i.id
WHERE a.resolvido = 0
GROUP BY i.bairro
ORDER BY volume_desperdicado_litros DESC, total_alertas DESC;

-- ----------------------------------------------------------------------------
-- CONSULTA 3: Média de vazão na madrugada (02h às 05h) por hidrômetro
-- Técnica: JOIN, AVG, HAVING > 0.30 (detecta até descarga pingando de 0,33 L/min!)
-- Onde aparece: Auditoria de vazamento oculto
-- ----------------------------------------------------------------------------
SELECT
    i.apelido_local AS imovel,
    i.numero_serie_hidrometro AS hidrometro,
    s.codigo_dispositivo,
    COUNT(l.id) AS leituras_madrugada,
    ROUND(AVG(l.vazao_instantanea_lpm), 2) AS media_vazao_madrugada_lpm,
    ROUND(MIN(l.intensidade_luz), 2) AS menor_intensidade_luz_optica
FROM imoveis i
INNER JOIN sensores_iot s ON s.imovel_id = i.id
INNER JOIN leituras_hidrometro l ON l.sensor_id = s.id
WHERE CAST(strftime('%H', l.data_hora_leitura) AS INTEGER) BETWEEN 2 AND 5
GROUP BY i.id, i.apelido_local, i.numero_serie_hidrometro, s.codigo_dispositivo
HAVING AVG(l.vazao_instantanea_lpm) > 0.30
ORDER BY media_vazao_madrugada_lpm DESC;

-- ----------------------------------------------------------------------------
-- CONSULTA 4: Imóveis que passaram da meta de consumo no mês
-- Técnica: JOIN, MAX - MIN (ou SUM de consumo), GROUP BY, HAVING > meta
-- Onde aparece: Aviso de meta estourada (Gatilho 3)
-- ----------------------------------------------------------------------------
SELECT
    i.apelido_local AS imovel,
    i.bairro,
    i.meta_consumo_mensal_litros AS meta_litros,
    ROUND(MAX(l.volume_acumulado_litros) - MIN(l.volume_acumulado_litros), 2) AS consumo_atual_litros,
    ROUND((MAX(l.volume_acumulado_litros) - MIN(l.volume_acumulado_litros)) - i.meta_consumo_mensal_litros, 2) AS excedente_litros
FROM imoveis i
INNER JOIN sensores_iot s ON s.imovel_id = i.id
INNER JOIN leituras_hidrometro l ON l.sensor_id = s.id
GROUP BY i.id, i.apelido_local, i.bairro, i.meta_consumo_mensal_litros
HAVING (MAX(l.volume_acumulado_litros) - MIN(l.volume_acumulado_litros)) > i.meta_consumo_mensal_litros
ORDER BY excedente_litros DESC;

-- ----------------------------------------------------------------------------
-- CONSULTA 5: Total de leituras e alertas por tipo de sensor
-- Técnica: JOIN de 3 tabelas (sensores_iot, leituras_hidrometro, alertas_consumo), COUNT
-- Onde aparece: Saúde dos sensores
-- ----------------------------------------------------------------------------
SELECT
    s.tipo_sensor,
    COUNT(DISTINCT s.id) AS qtd_sensores_instalados,
    COUNT(DISTINCT l.id) AS total_leituras_recebidas,
    COUNT(DISTINCT a.id) AS total_alertas_disparados
FROM sensores_iot s
LEFT JOIN leituras_hidrometro l ON l.sensor_id = s.id
LEFT JOIN alertas_consumo a ON a.leitura_id = l.id
GROUP BY s.tipo_sensor
ORDER BY total_leituras_recebidas DESC;
