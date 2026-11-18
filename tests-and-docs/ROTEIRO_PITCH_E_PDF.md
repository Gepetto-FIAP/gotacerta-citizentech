# Roteiro do Vídeo Pitch e Estrutura do Relatório Técnico
**Gota Certa · FIAP Global Solution 2026/2**

## 1. Roteiro do Vídeo Pitch (até 3 minutos)

Diretrizes da apresentação em vídeo:
- Duração máxima de 3 minutos, demonstrando o sistema em execução.
- Hospedado em link público (YouTube, Google Drive ou Vimeo).

| Tempo | Bloco | Demonstração em tela | Tópicos abordados |
|:---:|---|---|---|
| 0:00–0:30 | **Problema e Cidadão** | Hidrômetro residencial e indicadores de perda hídrica (39,53% — Trata Brasil, 2026) | Impacto dos vazamentos ocultos em residências, escolas e pequenos comércios com medidores mecânicos. |
| 0:30–0:50 | **A Solução** | Funcionamento óptico do LED infravermelho e do fototransistor sobre o ponteiro de litros | Acoplamento não-invasivo sobre o visor do hidrômetro existente (1 volta = 1 pulso = 1 litro). |
| 0:50–2:10 | **Demonstração Prática** | Simulação no Wokwi e Node-RED · Swagger da API · Painel Mobile-First · Controle de acesso | Fluxo fim a fim: envio de telemetria via MQTT/HTTP, avaliação dos 3 gatilhos na API C#, chegada do alerta no painel da moradora, confirmação de reparo, visão por bairro do gestor e validação de segurança (401/403). |
| 2:10–2:40 | **Impacto e ODS** | Conexão com os ODS 6, 9, 11 e 13 e validação com usuários | Economia financeira e hídrica, viabilidade para municípios de pequeno e médio porte e retorno das conversas com moradores. |
| 2:40–3:00 | **Encerramento** | Identificação do projeto e dos integrantes | Síntese do benefício direto entregue ao cidadão. |

## 2. Estrutura do Documento PDF da Entrega

O documento PDF consolidado acompanha o código-fonte na entrega final:

1. **Capa e Identificação:** Nome do grupo, RM e nome completo dos 5 integrantes, link do vídeo pitch e link do repositório GitHub.
2. **Proposta CitizenTech e ODS:** Cidadão beneficiado, problema, solução, conexão com os ODS 6, 9, 11 e 13 e validação com moradores.
3. **Banco de Dados:** Diagrama ER ([`database/README_DATABASE.md`](../database/README_DATABASE.md)), script SQL e resultados das 5 consultas de uso.
4. **API RESTful:** Arquitetura em camadas (`Controllers`, `Services`, `Repositories`) e documentação Swagger dos endpoints.
5. **Plano de Testes:** Casos de teste ([`PLANO_DE_TESTES.md`](./PLANO_DE_TESTES.md)) e relatório de execução do script [`test_api.py`](./test_api.py).
6. **Frontend Mobile-First:** Telas da aplicação web responsiva, estados de carregamento/erro e integração com a API ([`frontend/README_FRONTEND.md`](../frontend/README_FRONTEND.md)).
7. **Segurança da Informação:** Hash de senha com BCrypt, autenticação JWT (`MORADOR` e `ADMIN`), Regra do Dono e práticas OWASP ([`backend/seguranca.md`](../backend/seguranca.md)).
8. **Simulação de IoT:** Detalhamento dos sensores, referência ao estudo da Unicamp (Perissinotto & Manera, 2019) e simulação no Wokwi e Node-RED ([`iot-simulator/sensores.md`](../iot-simulator/sensores.md)).
