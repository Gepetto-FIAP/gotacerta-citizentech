# Roteiro do vídeo pitch e estrutura do PDF
**Gota Certa · FIAP Global Solution 2026/2 · Responsável: João (com todo o grupo)**

## 1. Roteiro do vídeo (até 3 minutos)

Regras do case:
- Até 3 minutos. O que passar disso não é avaliado, então mire em 2:50.
- Mostre o sistema funcionando. Vídeo só com slides ou lendo texto da tela não vale.
- O link precisa ser público: YouTube (não listado), Google Drive ou Vimeo com acesso aberto. Teste numa aba anônima antes de enviar.

| Tempo | Bloco | Na tela · quem | Fala sugerida |
|:---:|---|---|---|
| 0:00–0:30 | **Problema e cidadão** (1 pt) | Luiz, que trabalha no setor; um hidrômetro real; o dado de 39,53% | "Quem trabalha numa companhia de saneamento ouve todo dia: minha conta veio absurda. Quase sempre é uma descarga vazando há um mês. O hidrômetro da casa é mecânico e só mostra isso na conta. No Brasil, quase 40% da água tratada se perde antes de chegar à torneira." |
| 0:30–0:50 | **Solução** | Desenho do LED infravermelho e do fototransistor sobre o ponteiro de litros | "A Gota Certa não troca o hidrômetro: ensina ele a falar. Um LED infravermelho ilumina o ponteiro de litros e um fototransistor conta cada volta, por cima do vidro, sem romper o lacre. Cada volta é um litro." |
| 0:50–2:10 | **Demonstração** (2 pts) | Luiz no Wokwi e no Node-RED · Antônio no Swagger · Danilo no app · Vitória num acesso negado | "No Wokwi, o ESP32 conta os pulsos do ponteiro. Aperto a descarga: às 3 da manhã, a água começa a passar. A leitura vai por MQTT, o Node-RED entrega na API, e a API testa os gatilhos e cria o alerta. No celular da Dona Maria, o aviso de vazamento chega sozinho, e ela confirma o reparo. O gestor vê os alertas de todo o bairro. E sem login, ou no imóvel de outra pessoa, a API nega o acesso." |
| 2:10–2:40 | **Impacto e diferencial** (1 pt) | Integrante falando; ODS 6, 9, 11 e 13; uma frase da conversa com um morador | "O morador economiza e acompanha o gasto em reais, e a companhia reduz perdas. As grandes companhias gastam bilhões trocando hidrômetros. A Gota Certa leva o mesmo benefício para quem ficou de fora, aproveitando o hidrômetro que já existe." |
| 2:40–3:00 | **Fechamento** | Nome do projeto e dos 5 integrantes | "Hoje o vazamento só aparece na conta. Com a Gota Certa, ele aparece no celular, no mesmo dia." |

**Clareza e tempo (1 pt):** cronometrem e ensaiem as falas em voz alta, sem ler. Cada um grava a tela da própria parte, e o João junta na edição. Áudio limpo vale mais que imagem perfeita.

Não digam "ninguém nunca fez isso": a banca pode conhecer soluções parecidas (Sabesp, Canal de Isabel II, Honeywell). Digam que a Gota Certa leva o benefício a quem ficou de fora.

## 2. Estrutura do PDF da entrega

O PDF vai no `.zip` junto com o código, o `README.md` e o `integrantes.txt`. Cada integrante escreve a sua seção, e o João junta.

1. **Capa e integrantes:** nome do grupo, RM e nome completo dos 5 integrantes, link público do pitch e link do GitHub.
2. **Proposta e ODS:** cidadão beneficiado, problema (com fonte dos números), solução, ODS 6, 9, 11 e 13 e o resumo das conversas com moradores.
3. **Parte 1 · Banco (Antônio):** diagrama ER ([`database/README_DATABASE.md`](../database/README_DATABASE.md)), explicação de cada uma das 5 consultas e print do resultado.
4. **Parte 2 · API (Antônio):** camadas Controller, Service e Repository e print do Swagger com os endpoints.
5. **Parte 3 · Testes (João):** tabela dos 10 casos ([`PLANO_DE_TESTES.md`](./PLANO_DE_TESTES.md)) e o relatório do `test_api.py` executado.
6. **Parte 4 · Frontend (Danilo):** prints de cada tela, dos estados de carregando e de erro e da versão de celular.
7. **Parte 5 · Segurança (Vitória):** hash BCrypt, JWT com perfis `MORADOR` e `ADMIN`, regra do dono e a tabela de práticas OWASP com os prints dos testes ([`backend/seguranca.md`](../backend/seguranca.md)).
8. **Parte 6 · IoT (Luiz):** os 2 sensores, o que medem e como influenciam o sistema, citando o artigo da Unicamp (Perissinotto & Manera, 2019), mais prints do Wokwi, do Node-RED e do alerta no app ([`iot-simulator/sensores.md`](../iot-simulator/sensores.md)).
