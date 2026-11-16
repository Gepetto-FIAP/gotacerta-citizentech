# Parte 3 · Plano de testes
**Gota Certa · FIAP Global Solution 2026/2 · Responsável: João**

## 1. Casos de teste

Os 10 casos abaixo são executados automaticamente por [`test_api.py`](./test_api.py). Eles cobrem sucesso (`200`, `201`) e erro (`400`, `401`, `403`, `404`).

Usuário de teste: `maria.silva@email.com` / `GotaCerta@2026` (perfil `MORADOR`, dona do imóvel 1). Nos casos marcados com 🔑, a requisição leva o token JWT dela no header `Authorization: Bearer <token>`.

| ID | Cenário | Requisição | Entrada | Saída esperada | Status |
|---|---|---|---|---|:---:|
| CT-01 | Login com credenciais válidas | `POST /api/auth/login` | `{"email": "maria.silva@email.com", "senha": "GotaCerta@2026"}` | JSON com `tokenJwt` e `perfil: "MORADOR"`, sem expor o hash da senha | `200` |
| CT-02 | Login com senha errada | `POST /api/auth/login` | `{"email": "maria.silva@email.com", "senha": "SenhaIncorreta999"}` | `{"erro": "Credenciais inválidas..."}`, sem dizer se o e-mail existe | `401` |
| CT-03 | Cadastro com dados inválidos | `POST /api/auth/register` | `{"nome": "A", "email": "invalido", "senha": "123"}` | Mensagens de validação de nome, e-mail e senha | `400` |
| CT-04 | Dashboard do próprio imóvel 🔑 | `GET /api/imoveis/1/dashboard` | `id = 1` | Vazão, consumo do mês em litros, `valorEstimadoReais` e meta | `200` |
| CT-05 | Imóvel inexistente 🔑 | `GET /api/imoveis/99999` | `id = 99999` | `{"erro": "Imóvel com ID 99999 não encontrado."}` | `404` |
| CT-06 | Alterar a meta do mês 🔑 | `PUT /api/imoveis/1` | `{"apelidoLocal": "Residência Dona Maria", "endereco": "Rua das Acácias, 142", "bairro": "Jardim Pantanal", "metaConsumoMensalLitros": 10000}` | Imóvel atualizado | `200` |
| CT-07 | Rota protegida sem token | `DELETE /api/imoveis/1` | Sem header `Authorization` | Acesso negado | `401` |
| CT-08 | Morador tentando ação de gestor 🔑 | `DELETE /api/imoveis/1` | Token de `MORADOR` (a rota exige `ADMIN`) | Acesso negado | `403` |
| CT-09 | Leitura de madrugada gera alerta | `POST /api/leituras` | `{"codigoDispositivo": "GC-001", "dataHora": "2026-11-15T03:00:00Z", "pulsosUltimoMinuto": 1, "leituraAcumuladaLitros": 1234590, "intensidadeLuz": 0.18}` | Leitura gravada com `alertaGerado: true` (`VAZAMENTO_OCULTO_MADRUGADA`) | `201` |
| CT-10 | Confirmar reparo do alerta 🔑 | `PUT /api/alertas/{id}` | `id` do alerta ativo mais recente da moradora | Alerta com `resolvido: true` | `200` |

## 2. Como executar

Com a API rodando em `http://localhost:8080` (veja o [README principal](../README.md)) e Python 3 instalado:

```bash
python tests-and-docs/test_api.py
```

O script mostra `PASS` ou `FAIL` para cada caso e salva o relatório em `tests-and-docs/relatorio_execucao_testes.txt`, que é a evidência para o PDF.

Os testes de segurança (token adulterado, morador em imóvel de outra pessoa, SQL injection no login e força bruta) estão em [`backend/seguranca.md`](../backend/seguranca.md), seção 5.
