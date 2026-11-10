# Parte 4 de 6 — Frontend Web Mobile-First (3,0 Pontos)
**Projeto GotaCerta — Interface Cidadã Responsiva (Next.js + Tailwind CSS)**
*Responsável principal: Danilo*

---

## 1. Telas Implementadas (Critério 01 — 1,0 pt)
A aplicação foi desenhada no formato **Mobile-First** (container de smartphone `max-w-md` com barra de navegação inferior fixa) e conta com **5 telas funcionais**:
1. **Tela de Login Seguro (`login`):** Autentica via `POST /api/auth/login` recebendo o Token JWT e perfil de acesso (`MORADOR` ou `ADMIN`).
2. **Tela de Lista / Dashboard de Imóveis (`dashboard`):** Consome `GET /api/imoveis` exibindo status em tempo real de cada hidrômetro monitorado.
3. **Tela de Detalhe e Telemetria (`detalhe`):** Consome `GET /api/leituras` mostrando a vazão instantânea ($\text{L/min}$), pulsos da relojoaria, pressão da rua ($\text{bar}$) e nível da caixa d'água ($\%$).
4. **Tela de Central de Alertas (`alertas`):** Consome `GET /api/alertas` e permite confirmar o reparo de vazamentos via `PUT /api/alertas/{id}/resolver`.
5. **Tela de Cadastro de Imóvel/Hidrômetro (`cadastro`):** Envia `POST /api/imoveis` com validação e feedback visual imediato.

## 2. Como Executar Localmente
```bash
cd frontend
npm install
npm run dev
```
Acesse `http://localhost:3000`.
