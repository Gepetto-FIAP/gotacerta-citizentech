-- ============================================================================
-- FIAP - GLOBAL SOLUTION 2026/2 - CITIZENTECH (3ESOA)
-- PROJETO: GOTACERTA - CONSULTAS DE USO REAL (PARTE 1 - ITEM 03: 1,0 PONTO)
-- 5+ SELECTs com JOIN, GROUP BY e Funções de Agregação (SUM, AVG, COUNT, MAX, MIN)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- CONSULTA 1: Resumo de telemetria por Imóvel e Responsável
-- Exibe o total de leituras recebidas, vazão média (L/min), pico máximo de vazão
-- e leitura atual do hidrômetro (volume acumulado).
-- ----------------------------------------------------------------------------
SELECT
    i.apelido_local AS imovel,
    i.bairro,
    u.nome AS responsavel,
    i.numero_serie_hidrometro AS hidrometro,
    COUNT(l.id) AS total_leituras,
    ROUND(AVG(l.vazao_instantanea_lpm), 2) AS vazao_media_lpm,
    ROUND(MAX(l.vazao_instantanea_lpm), 2) AS pico_vazao_lpm,
    ROUND(MAX(l.volume_acumulado_litros), 2) AS leitura_atual_litros
FROM imoveis i
INNER JOIN usuarios u ON u.id = i.usuario_id
INNER JOIN sensores_iot s ON s.imovel_id = i.id
INNER JOIN leituras_hidrometro l ON l.sensor_id = s.id
GROUP BY i.id, i.apelido_local, i.bairro, u.nome, i.numero_serie_hidrometro
ORDER BY pico_vazao_lpm DESC;

-- ----------------------------------------------------------------------------
-- CONSULTA 2: Impacto Hídrico e Desperdício Estimado por Bairro
-- Agrupa os alertas por bairro para identificar onde há mais vazamentos e
-- quantos litros de água potável estão sendo perdidos.
-- ----------------------------------------------------------------------------
SELECT
    i.bairro,
    COUNT(DISTINCT i.id) AS imoveis_afetados,
    COUNT(a.id) AS total_alertas_ativos,
    ROUND(SUM(a.desperdicio_estimado_litros), 2) AS total_agua_desperdicada_litros,
    SUM(i.moradores_atendidos) AS cidadaos_impactados
FROM imoveis i
INNER JOIN alertas_consumo a ON a.imovel_id = i.id
WHERE a.resolvido = 0
GROUP BY i.bairro
ORDER BY total_agua_desperdicada_litros DESC;

-- ----------------------------------------------------------------------------
-- CONSULTA 3: Auditoria de Vazamento Oculto Noturno / Alta Vazão
-- Identifica sensores de relojoaria que registraram vazão média superior a 2.0 L/min
-- ou pulsos acumulados elevados, cruzando com o limite configurado do sensor.
-- ----------------------------------------------------------------------------
SELECT
    s.codigo_dispositivo,
    s.modelo_hardware,
    i.apelido_local,
    s.limite_vazao_alerta_lpm AS limite_configurado_lpm,
    SUM(l.pulsos_registrados) AS total_pulsos_relojoaria,
    ROUND(AVG(l.vazao_instantanea_lpm), 2) AS media_vazao_lpm,
    ROUND(MAX(l.vazao_instantanea_lpm), 2) AS maior_vazao_registrada_lpm
FROM sensores_iot s
INNER JOIN imoveis i ON i.id = s.imovel_id
INNER JOIN leituras_hidrometro l ON l.sensor_id = s.id
GROUP BY s.id, s.codigo_dispositivo, s.modelo_hardware, i.apelido_local, s.limite_vazao_alerta_lpm
HAVING AVG(l.vazao_instantanea_lpm) > 2.00;

-- ----------------------------------------------------------------------------
-- CONSULTA 4: Mapa Comunitário de Risco de Desabastecimento (Falta d'Água)
-- Lista imóveis onde o nível mínimo da caixa d'água caiu abaixo de 50% ou
-- a pressão mínima da rua chegou perto de zero.
-- ----------------------------------------------------------------------------
SELECT
    i.bairro,
    i.apelido_local,
    i.tipo_imovel,
    i.capacidade_caixa_litros,
    ROUND(MIN(l.nivel_caixa_percentual), 1) AS menor_nivel_caixa_pct,
    ROUND(MIN(l.pressao_rua_bar), 2) AS menor_pressao_rua_bar,
    ROUND((MIN(l.nivel_caixa_percentual) / 100.0) * i.capacidade_caixa_litros, 0) AS volume_restante_caixa_litros
FROM imoveis i
INNER JOIN sensores_iot s ON s.imovel_id = i.id
INNER JOIN leituras_hidrometro l ON l.sensor_id = s.id
GROUP BY i.id, i.bairro, i.apelido_local, i.tipo_imovel, i.capacidade_caixa_litros
HAVING MIN(l.nivel_caixa_percentual) < 50.0 OR MIN(l.pressao_rua_bar) <= 0.50
ORDER BY menor_nivel_caixa_pct ASC;

-- ----------------------------------------------------------------------------
-- CONSULTA 5: Relatório Gerencial por Tipo de Alerta e Severidade
-- Demonstra a distribuição de ocorrências para tomada de decisão do Gestor/Admin.
-- ----------------------------------------------------------------------------
SELECT
    a.tipo_alerta,
    a.severidade,
    COUNT(a.id) AS quantidade_ocorrencias,
    ROUND(SUM(a.desperdicio_estimado_litros), 2) AS volume_perdido_litros,
    ROUND(AVG(l.vazao_instantanea_lpm), 2) AS vazao_media_no_momento_lpm
FROM alertas_consumo a
LEFT JOIN leituras_hidrometro l ON l.id = a.leitura_id
INNER JOIN imoveis i ON i.id = a.imovel_id
GROUP BY a.tipo_alerta, a.severidade
ORDER BY quantidade_ocorrencias DESC, volume_perdido_litros DESC;
