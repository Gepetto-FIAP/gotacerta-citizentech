# Guia do Vídeo Pitch (5,0 Pontos) e Estrutura do PDF Único
**Projeto GotaCerta — CitizenTech (3ESOA)**
*Responsável pela coordenação: João (junto com todo o grupo)*

---

## 1. Roteiro Cronometrado do Vídeo Pitch (Máximo: 2min50s)

> [!IMPORTANT]
> **Regras de Ouro do Edital (Página 27):**
> * **Até 3 minutos** (o que passar de 3:00 não é avaliado — mire em **2:45 a 2:50**).
> * **Mostre o protótipo funcionando** (nada de vídeo só lendo slides!).
> * **Link público** no YouTube (Não listado ou Público), Google Drive (Acesso aberto a qualquer pessoa com o link) ou Vimeo. **Testem em aba anônima antes de enviar!**

| Tempo | Bloco do Edital (Pág. 28) | O que mostrar na tela | O que falar (Script enxuto) |
| :---: | :--- | :--- | :--- |
| **0:00 – 0:30** | **1. O Problema e o Cidadão (1 pt)** | Imagem rápida de um hidrômetro residencial comum + conta de água alta / caixa d'água vazia. | *"No Brasil, quase 40% da água tratada se perde em vazamentos, e milhões de famílias, escolas públicas e pequenos comércios sofrem com contas impagáveis por vazamentos invisíveis ou cortes repentinos de abastecimento. O problema? Mais de 95% dos hidrômetros são analógicos e lacrados pela concessionária: o cidadão só descobre um vazamento 30 dias depois, quando a conta chega."* |
| **0:30 – 0:50** | **2. A Solução CitizenTech** | Diagrama simples do **GotaCerta** (Sensor na relojoaria do hidrômetro + Sensor na caixa d'água → API → App Mobile). | *"Para colocar a tecnologia a serviço do cidadão, criamos o **GotaCerta**: uma plataforma CitizenTech inspirada em pesquisa de telemetria da UNICAMP que acopla um sensor magnético não-invasivo de baixo custo por fora do visor do hidrômetro existente, combinado a um sensor ultrassônico na caixa d'água."* |
| **0:50 – 2:10** | **3. Demonstração ao Vivo (2 pts)** | **Tela dividida:**<br>1) App Mobile-First (Next.js) + Swagger da API C#<br>2) Terminal rodando `python3 iot-simulator/simulator.py --mode demo` | *"Veja a solução funcionando na prática: aqui no nosso App Mobile-First consumindo nossa API em C# ASP.NET Core com banco SQLite/MySQL em Docker, acompanhamos a Residência da Dona Maria e a Escola Pública do bairro. Agora, nosso simulador IoT envia os pulsos da relojoaria simulando um vazamento oculto de madrugada e um cano rompido na escola. Em tempo real, a API responde `201 Created`, processa a regra e dispara o alerta crítico no celular do cidadão, que pode confirmar o reparo com um toque!"* |
| **2:10 – 2:40** | **4. Impacto e ODS (1 pt)** | Card com ODS 11, ODS 9 e ODS 13 + relato curto da validação com morador real. | *"O GotaCerta atende diretamente aos **ODS 11, 9 e 13 da ONU**. Conversamos com moradores reais para validar a interface e incluímos o alerta comunitário de pressão zero na rua, avisando todo o bairro quando falta água na rede pública."* |
| **2:40 – 2:55** | **5. Fechamento (1 pt)** | Tela final com logo do GotaCerta e nomes dos 5 integrantes. | *"Simples de instalar sem cortar um único cano, seguro com autenticação JWT e hash criptográfico, e acessível para quem mais precisa. GotaCerta: cada gota conta quando o cidadão está no centro da inovação."* |

---

## 2. Estrutura Obrigatória do PDF Único da Entrega

No arquivo `.zip` final, além do código, do `README.md` e do `integrantes.txt`, vocês devem incluir um arquivo **`Entrega_GotaCerta_3ESOA.pdf`** contendo:
1. **Capa & Integrantes:** Nome do grupo, RM e nome completo dos 5 integrantes + Link público do Pitch + Link do GitHub (`Gepetto-FIAP`).
2. **Proposta CitizenTech & ODS:** As 6 respostas da página 7 do edital + conexão com os ODS 11, 9 e 13 + resumo da validação com usuário real.
3. **Parte 1 — Banco de Dados (Antônio):** Imagem do Diagrama ER (`database/README_DATABASE.md`) + prints das 5 consultas SQL rodando.
4. **Parte 2 — API RESTful (Antônio):** Print da arquitetura em camadas (`Controllers`, `Services`, `Repositories`) e print do Swagger mostrando os endpoints.
5. **Parte 3 — Plano de Testes (João):** A tabela dos 10 casos de teste (`tests-and-docs/PLANO_DE_TESTES.md`) + prints/logs do `test_api.py` executado.
6. **Parte 4 — Frontend Mobile-First (Danilo):** Prints das 5 telas funcionando integradas à API.
7. **Parte 5 — Segurança (Vitória):** Explicação + prints do código de Hash PBKDF2-SHA256, JWT RBAC (`ADMIN` vs `MORADOR`) e as práticas contra SQLi/XSS.
8. **Parte 6 — Simulação de IoT (Luiz):** Explicação dos 2 sensores (citando o artigo PIBIC/UNICAMP de Perissinotto & Manera) + prints do simulador disparando alertas na API.
