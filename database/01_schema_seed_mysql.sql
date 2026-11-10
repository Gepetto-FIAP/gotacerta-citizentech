-- ============================================================================
-- FIAP - GLOBAL SOLUTION 2026/2 - CITIZENTECH (3ESOA)
-- PROJETO: GOTACERTA - TELEMETRIA DE HIDRÔMETROS E COMBATE AO DESPERDÍCIO
-- ARQUIVO: 01_schema_seed_mysql.sql (MySQL 8.0 / Docker Init Script)
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS alertas_consumo;
DROP TABLE IF EXISTS leituras_hidrometro;
DROP TABLE IF EXISTS sensores_iot;
DROP TABLE IF EXISTS imoveis;
DROP TABLE IF EXISTS usuarios;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    perfil VARCHAR(30) NOT NULL,
    telefone VARCHAR(20),
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_usuarios_perfil CHECK (perfil IN ('MORADOR', 'ADMIN'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE imoveis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    apelido_local VARCHAR(100) NOT NULL,
    tipo_imovel VARCHAR(40) NOT NULL,
    endereco VARCHAR(200) NOT NULL,
    bairro VARCHAR(80) NOT NULL,
    cep VARCHAR(15) NOT NULL,
    numero_serie_hidrometro VARCHAR(50) NOT NULL UNIQUE,
    meta_consumo_mensal_litros DECIMAL(10,2) NOT NULL,
    capacidade_caixa_litros DECIMAL(10,2) NOT NULL,
    moradores_atendidos INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_imoveis_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT chk_imoveis_tipo CHECK (tipo_imovel IN ('RESIDENCIAL', 'ESCOLA_PUBLICA', 'COMERCIO', 'COMUNITARIO'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE sensores_iot (
    id INT AUTO_INCREMENT PRIMARY KEY,
    imovel_id INT NOT NULL,
    codigo_dispositivo VARCHAR(60) NOT NULL UNIQUE,
    tipo_sensor VARCHAR(50) NOT NULL,
    modelo_hardware VARCHAR(120) NOT NULL,
    fator_pulsos_por_litro DECIMAL(8,2) NOT NULL DEFAULT 1.00,
    limite_vazao_alerta_lpm DECIMAL(8,2) NOT NULL DEFAULT 20.00,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    instalado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sensores_imovel FOREIGN KEY (imovel_id) REFERENCES imoveis(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE leituras_hidrometro (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sensor_id INT NOT NULL,
    pulsos_registrados INT NOT NULL,
    vazao_instantanea_lpm DECIMAL(10,2) NOT NULL,
    volume_acumulado_litros DECIMAL(12,2) NOT NULL,
    nivel_caixa_percentual DECIMAL(5,2) NOT NULL,
    pressao_rua_bar DECIMAL(5,2) NOT NULL,
    data_hora_leitura DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_leituras_sensor FOREIGN KEY (sensor_id) REFERENCES sensores_iot(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE alertas_consumo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    imovel_id INT NOT NULL,
    leitura_id INT NULL,
    tipo_alerta VARCHAR(50) NOT NULL,
    severidade VARCHAR(20) NOT NULL,
    mensagem VARCHAR(300) NOT NULL,
    desperdicio_estimado_litros DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    resolvido TINYINT(1) NOT NULL DEFAULT 0,
    data_geracao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_alertas_imovel FOREIGN KEY (imovel_id) REFERENCES imoveis(id) ON DELETE CASCADE,
    CONSTRAINT fk_alertas_leitura FOREIGN KEY (leitura_id) REFERENCES leituras_hidrometro(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO usuarios (id, nome, email, senha_hash, perfil, telefone, criado_em) VALUES
(1, 'Antônio Schappo (Admin Defesa Hídrica)', 'admin@gotacerta.org.br', '$2a$11$K8Zp9W3qR7xL2mN5vB8cOe1yT4uI6oP9aS2dF5gH8jK1lZ4xC7vB.', 'ADMIN', '11999990001', '2026-11-01 08:00:00'),
(2, 'Dona Maria Aparecida Silva', 'maria.silva@email.com', '$2a$11$K8Zp9W3qR7xL2mN5vB8cOe1yT4uI6oP9aS2dF5gH8jK1lZ4xC7vB.', 'MORADOR', '11988881122', '2026-11-01 09:15:00'),
(3, 'Carlos Eduardo Santos (Diretor Escolar)', 'diretoria@emeluzdosaber.edu.br', '$2a$11$K8Zp9W3qR7xL2mN5vB8cOe1yT4uI6oP9aS2dF5gH8jK1lZ4xC7vB.', 'MORADOR', '11977773344', '2026-11-02 10:30:00'),
(4, 'Padaria Comunitária Pão da Vila', 'contato@paodavila.com.br', '$2a$11$K8Zp9W3qR7xL2mN5vB8cOe1yT4uI6oP9aS2dF5gH8jK1lZ4xC7vB.', 'MORADOR', '11966665566', '2026-11-02 14:00:00'),
(5, 'João Pereira (Líder Comunitário)', 'joao.pereira@comunidade.org', '$2a$11$K8Zp9W3qR7xL2mN5vB8cOe1yT4uI6oP9aS2dF5gH8jK1lZ4xC7vB.', 'MORADOR', '11955557788', '2026-11-03 11:20:00');

INSERT INTO imoveis (id, usuario_id, apelido_local, tipo_imovel, endereco, bairro, cep, numero_serie_hidrometro, meta_consumo_mensal_litros, capacidade_caixa_litros, moradores_atendidos) VALUES
(1, 2, 'Residência Dona Maria', 'RESIDENCIAL', 'Rua das Acácias, 142', 'Jardim Pantanal', '08090-100', 'HIDRO-LAO-2024-8891', 12000.00, 1000.00, 4),
(2, 3, 'EMEI Luz do Saber', 'ESCOLA_PUBLICA', 'Av. Esperança, 850', 'Jardim Pantanal', '08090-210', 'HIDRO-SABESP-2023-4410', 85000.00, 10000.00, 320),
(3, 4, 'Padaria Pão da Vila', 'COMERCIO', 'Rua Central, 55', 'Vila Itaim', '08110-030', 'HIDRO-ELSTER-2024-1102', 25000.00, 2000.00, 12),
(4, 5, 'Horta & Cozinha Comunitária', 'COMUNITARIO', 'Travessa União, 19', 'Vila Itaim', '08110-080', 'HIDRO-ITRON-2022-9920', 30000.00, 5000.00, 85);

INSERT INTO sensores_iot (id, imovel_id, codigo_dispositivo, tipo_sensor, modelo_hardware, fator_pulsos_por_litro, limite_vazao_alerta_lpm, ativo, instalado_em) VALUES
(1, 1, 'ESP32-UNICAMP-REED-001', 'PULSO_RELOJOARIA_HIDROMETRO', 'Reed Switch + Hall A3144 Acoplado à Relojoaria', 1.00, 18.00, 1, '2026-11-03 15:00:00'),
(2, 1, 'ESP32-SONAR-CAIXA-001', 'ULTRASSONICO_CAIXA_DAGUA', 'Ultrassônico Impermeável JSN-SR04T + Pressão', 1.00, 18.00, 1, '2026-11-03 15:10:00'),
(3, 2, 'ESP32-UNICAMP-REED-002', 'PULSO_RELOJOARIA_HIDROMETRO', 'Sensor Óptico/Magnético Relojoaria TCRT5000 + Hall', 1.00, 45.00, 1, '2026-11-04 09:00:00'),
(4, 3, 'ESP32-UNICAMP-REED-003', 'PULSO_RELOJOARIA_HIDROMETRO', 'Reed Switch + Hall A3144 Acoplado à Relojoaria', 1.00, 25.00, 1, '2026-11-04 11:00:00'),
(5, 4, 'ESP32-UNICAMP-REED-004', 'PULSO_RELOJOARIA_HIDROMETRO', 'Reed Switch + Hall A3144 Acoplado à Relojoaria', 1.00, 30.00, 1, '2026-11-04 14:30:00');

INSERT INTO leituras_hidrometro (id, sensor_id, pulsos_registrados, vazao_instantanea_lpm, volume_acumulado_litros, nivel_caixa_percentual, pressao_rua_bar, data_hora_leitura) VALUES
(1, 1, 144, 2.40, 14520.00, 88.00, 2.10, '2026-11-08 02:00:00'),
(2, 1, 144, 2.40, 14664.00, 85.00, 2.10, '2026-11-08 03:00:00'),
(3, 1, 144, 2.40, 14808.00, 82.00, 2.05, '2026-11-08 04:00:00'),
(4, 1, 420, 7.00, 15228.00, 78.00, 1.90, '2026-11-08 08:00:00'),
(5, 3, 600, 10.00, 62100.00, 92.00, 2.30, '2026-11-08 12:00:00'),
(6, 3, 3510, 58.50, 65610.00, 48.00, 1.80, '2026-11-08 13:00:00'),
(7, 4, 540, 9.00, 18400.00, 35.00, 0.40, '2026-11-08 14:00:00'),
(8, 4, 480, 8.00, 18880.00, 16.50, 0.00, '2026-11-08 16:00:00'),
(9, 5, 300, 5.00, 21300.00, 19.00, 0.00, '2026-11-08 16:05:00');

INSERT INTO alertas_consumo (id, imovel_id, leitura_id, tipo_alerta, severidade, mensagem, desperdicio_estimado_litros, resolvido, data_geracao) VALUES
(1, 1, 3, 'VAZAMENTO_OCULTO_MADRUGADA', 'MEDIA', 'Fluxo contínuo de 2.4 L/min detectado na relojoaria entre 02h e 04h da manhã. Verifique boia da caixa d''água e válvula de descarga.', 432.00, 0, '2026-11-08 04:01:00'),
(2, 2, 6, 'CANO_ROMPIDO_PICO', 'CRITICA', 'Vazão crítica de 58.5 L/min ultrapassou o limite da escola (45 L/min). Possível rompimento de tubulação no pátio!', 3510.00, 0, '2026-11-08 13:01:00'),
(3, 3, 8, 'CAIXA_DAGUA_CRITICA', 'CRITICA', 'Pressão da rede pública caiu a 0.0 bar e reservatório atingiu 16.5%. Autonomia estimada: menos de 2 horas.', 0.00, 0, '2026-11-08 16:01:00'),
(4, 4, 9, 'FALTA_DAGUA_BAIRRO', 'MEDIA', 'Múltiplos sensores no bairro Vila Itaim detectaram pressão 0.0 bar na rede. Ative o plano comunitário de economia.', 0.00, 0, '2026-11-08 16:06:00');
