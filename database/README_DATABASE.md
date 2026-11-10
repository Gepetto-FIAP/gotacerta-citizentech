# Parte 1 de 6 — Banco de Dados Relacional (2,0 Pontos)
**Projeto GotaCerta — Telemetria Acessível para Hidrômetros e Combate ao Desperdício de Água**
*Responsável principal: Antônio Aloísio Schappo Neto (RM556429)*

---

## 1. Diagrama Entidade-Relacionamento (DER — 0,5 pt)

O modelo relacional do **GotaCerta** foi projetado na **Terceira Forma Normal (3FN)**, garantindo integridade referencial, ausência de redundâncias e aderência à regra *"Um domínio só: as entidades do banco são os recursos da API, e o app mobile consome essa API"*.

```mermaid
erDiagram
    USUARIOS ||--o{ IMOVEIS : "possui / monitora (1:N)"
    IMOVEIS ||--o{ SENSORES_IOT : "tem acoplado (1:N)"
    SENSORES_IOT ||--o{ LEITURAS_HIDROMETRO : "registra telemetria (1:N)"
    IMOVEIS ||--o{ ALERTAS_CONSUMO : "recebe (1:N)"
    LEITURAS_HIDROMETRO |o--o{ ALERTAS_CONSUMO : "dispara (0..1:N)"

    USUARIOS {
        INTEGER id PK "Auto-incremento"
        VARCHAR(120) nome "NOT NULL"
        VARCHAR(150) email UK "NOT NULL, UNIQUE"
        VARCHAR(255) senha_hash "NOT NULL (Hash BCrypt/SHA256)"
        VARCHAR(30) perfil "NOT NULL ('MORADOR' | 'ADMIN')"
        VARCHAR(20) telefone "Contato para alertas"
        DATETIME criado_em "DEFAULT CURRENT_TIMESTAMP"
    }

    IMOVEIS {
        INTEGER id PK "Auto-incremento"
        INTEGER usuario_id FK "NOT NULL -> usuarios(id)"
        VARCHAR(100) apelido_local "NOT NULL (ex: Casa Dona Maria, Escola)"
        VARCHAR(60) tipo_imovel "NOT NULL ('RESIDENCIAL' | 'ESCOLA_PUBLICA' | 'COMERCIO' | 'COMUNITARIO')"
        VARCHAR(200) endereco "NOT NULL"
        VARCHAR(80) bairro "NOT NULL"
        VARCHAR(15) cep "NOT NULL"
        VARCHAR(50) numero_serie_hidrometro UK "NOT NULL, UNIQUE (Relojoaria)"
        DECIMAL(10_2) meta_consumo_mensal_litros "NOT NULL (> 0)"
        DECIMAL(10_2) capacidade_caixa_litros "NOT NULL (> 0)"
        INTEGER moradores_atendidos "NOT NULL (>= 1)"
    }

    SENSORES_IOT {
        INTEGER id PK "Auto-incremento"
        INTEGER imovel_id FK "NOT NULL -> imoveis(id)"
        VARCHAR(60) codigo_dispositivo UK "NOT NULL, UNIQUE (ex: ESP32-HIDRO-001)"
        VARCHAR(60) tipo_sensor "NOT NULL ('PULSO_RELOJOARIA_HIDROMETRO' | 'ULTRASSONICO_CAIXA_DAGUA')"
        VARCHAR(120) modelo_hardware "Ex: Reed Switch Hall (PIBIC/UNICAMP) ou HC-SR04"
        DECIMAL(8_2) fator_pulsos_por_litro "NOT NULL DEFAULT 1.0"
        DECIMAL(8_2) limite_vazao_alerta_lpm "NOT NULL (Litros/min para alerta)"
        BOOLEAN ativo "NOT NULL DEFAULT 1"
        DATETIME instalado_em "DEFAULT CURRENT_TIMESTAMP"
    }

    LEITURAS_HIDROMETRO {
        INTEGER id PK "Auto-incremento"
        INTEGER sensor_id FK "NOT NULL -> sensores_iot(id)"
        INTEGER pulsos_registrados "NOT NULL (>= 0)"
        DECIMAL(10_2) vazao_instantanea_lpm "NOT NULL (Litros/minuto)"
        DECIMAL(12_2) volume_acumulado_litros "NOT NULL (Leitura total do hidrômetro)"
        DECIMAL(5_2) nivel_caixa_percentual "NOT NULL (0 a 100%)"
        DECIMAL(5_2) pressao_rua_bar "NOT NULL (Pressão da rede pública)"
        DATETIME data_hora_leitura "NOT NULL DEFAULT CURRENT_TIMESTAMP"
    }

    ALERTAS_CONSUMO {
        INTEGER id PK "Auto-incremento"
        INTEGER imovel_id FK "NOT NULL -> imoveis(id)"
        INTEGER leitura_id FK "NULLABLE -> leituras_hidrometro(id)"
        VARCHAR(60) tipo_alerta "NOT NULL ('VAZAMENTO_OCULTO_MADRUGADA' | 'CANO_ROMPIDO_PICO' | 'CAIXA_DAGUA_CRITICA' | 'FALTA_DAGUA_BAIRRO')"
        VARCHAR(20) severidade "NOT NULL ('BAIXA' | 'MEDIA' | 'CRITICA')"
        VARCHAR(300) mensagem "NOT NULL"
        DECIMAL(10_2) desperdicio_estimado_litros "NOT NULL DEFAULT 0"
        BOOLEAN resolvido "NOT NULL DEFAULT 0"
        DATETIME data_geracao "NOT NULL DEFAULT CURRENT_TIMESTAMP"
    }
```

---

## 2. Regras de Negócio e Normalização

1. **1ª Forma Normal (1FN):** Todos os atributos são atômicos e não há grupos repetitivos ou listas multivaloradas em nenhuma coluna.
2. **2ª Forma Normal (2FN):** Todas as tabelas possuem chave primária simples (`id`) e todos os atributos não-chave dependem funcionalmente da chave primária inteira.
3. **3ª Forma Normal (3FN):** Não há dependências transitivas (ex.: dados do imóvel como `bairro` e `numero_serie_hidrometro` ficam em `imoveis`, dados técnicos do hardware de telemetria ficam em `sensores_iot`, e cada medição temporal fica em `leituras_hidrometro`).

---

## 3. Como Executar e Testar os Scripts SQL (0,5 pt + 1,0 pt)

### Opção A — Executando direto com SQLite3 (Nativo / Sem instalar servidor)
Na raiz do repositório, execute:

```bash
sqlite3 /tmp/gotacerta_test.db < database/01_schema_seed.sql
sqlite3 -header -column /tmp/gotacerta_test.db < database/02_consultas_uso.sql
```

### Opção B — Executando via Docker com MySQL 8
Ao subir `docker compose up -d mysql`, o arquivo `database/01_schema_seed_mysql.sql` é executado automaticamente na inicialização do container. Para rodar as consultas de uso:

```bash
docker exec -i gotacerta-mysql mysql -ugotacerta -pgotacerta123 gotacerta_db < database/02_consultas_uso.sql
```
