# BELENTANI — The Judas Experience

> Universo visual procedural: planeta vivo, diamante espectral IOR 2.417, chave dourada PBR e máquina orgânica em Three.js. Dark pop, 432 Hz.

[![Deploy Status](https://github.com/belentani7/judas-experience-web/actions/workflows/ci.yml/badge.svg)](https://github.com/belentani7/judas-experience-web/actions/workflows/ci.yml)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000?logo=vercel)](https://judas-experience-web.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Spec-Driven](https://img.shields.io/badge/SDD-Spec%20Driven-purple)](SPEC.md)

---

## 🌐 Live Demo

**Production:** https://judas-experience-web.vercel.app
**Preview (PRs):** Auto-deployed on every PR

---

## 📋 Especificação (SDD)

Este projeto segue **Spec-Driven Development (SDD)** com protocolo maestro:

- 📄 **[SPEC.md](SPEC.md)** — Especificação completa com success criteria (EARS)
- 📋 **[tasks/plan.md](tasks/plan.md)** — Plan técnico com arquitetura, riscos, parallelização
- ✅ **[tasks/todo.md](tasks/todo.md)** — Task list atômica com acceptance criteria
- 🏛️ **[PROTOCOLO-SDD-MAESTRO.md](PROTOCOLO-SDD-MAESTRO.md)** — Protocolo completo E0-E7 + Constitution

---

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/belentani7/judas-experience-web.git
cd judas-experience-web

# Install dependencies
npm ci

# Development server (http://localhost:3000)
npm run dev

# Run all checks
npm run lint
npm run test
npm run a11y
npm run validate:spec
npm run audit
```

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **3D Engine** | Three.js r158+ (vendor local) |
| **Modules** | ES Modules + Import Maps |
| **Styling** | CSS Custom Properties, @property, Container Queries |
| **Shaders** | GLSL (vertex/fragment) |
| **Hosting** | Vercel (Static + Edge) |
| **CI/CD** | GitHub Actions |
| **Testing** | Playwright (E2E), axe-core (A11y), Lighthouse CI |
| **Linting** | ESLint (HTML/JS) |

---

## 📁 Project Structure

```
judas-experience-web/
├── index.html                 # Entry point (SPA)
├── vercel.json                # Vercel config (SPA rewrite + cache headers)
├── package.json               # Scripts & devDependencies
├── lighthouse-budget.json     # Lighthouse CI budgets
├── SPEC.md                    # Spec SDD
├── PROTOCOLO-SDD-MAESTRO.md   # Protocolo maestro
├── CHANGELOG.md               # Changelog
├── tasks/
│   ├── plan.md               # Plan técnico
│   └── todo.md               # Task list
├── .github/
│   ├── workflows/ci.yml      # CI pipeline
│   ├── dependabot.yml        # Dependabot config
│   └── codeql/               # CodeQL config
├── tools/                     # Automation scripts
│   ├── validate-spec.py
│   ├── check-spec-convergence.py
│   ├── validate-shaders.py
│   ├── audit-production-readiness.py
│   ├── apply-production-checklist.py
│   ├── update-threejs.js
│   └── optimize-assets.js
├── vendor/three/              # Three.js local (r158+)
├── assets/                    # Textures, models, fonts
├── core/                      # Three.js systems
├── sources/                   # Shaders, geometries, materials
├── empresa/                   # Brand assets
├── pipelines/                 # Render pipelines
└── docs/                      # Documentação
```

---

## ✅ Quality Gates (CI Pipeline)

| Job | Description | Required |
|-----|-------------|----------|
| `validate-spec` | SPEC.md structure + constitution checklist | ✅ |
| `lint` | ESLint HTML/JS | ✅ |
| `typecheck` | TypeScript (if present) | ✅ |
| `test` | Playwright E2E (Chromium/Firefox/WebKit) | ✅ |
| `accessibility` | axe-core WCAG 2.1 AA | ✅ |
| `lighthouse` | Performance budgets (LCP<2.5s, CLS<0.1, TBT<200ms) | ✅ |
| `validate-shaders` | GLSL syntax + performance hints | ✅ |
| `security` | npm audit + TruffleHog secrets scan | ✅ |
| `deploy-preview` | Vercel Preview on PR | ✅ |
| `deploy-production` | Vercel Production on merge to main | ✅ |

---

## 🌍 Idiomas (PT > ES > EN > CA)

Conteúdo multilingüe segue ordem fixa: **Português → Español → English → Català**

```json
["pt", "es", "en", "ca"]
```

- Meta tags Open Graph/Twitter em 4 idiomas
- Lore texts preparados para i18n
- Interface respeita `Accept-Language` header

---

## 🔧 Scripts Disponíveis

```bash
# Development
npm run dev              # Servidor local porta 3000
npm run build            # Static site - no build step

# Quality
npm run lint             # ESLint
npm run lint:fix         # Auto-fix
npm run test             # Playwright E2E
npm run test:ci          # CI reporter
npm run a11y             # axe-core accessibility
npm run lighthouse       # Performance audit

# Spec-Driven Development
npm run validate:spec            # Validar SPEC.md
npm run validate:convergence     # Spec-code convergence
npm run audit                    # Production readiness (30 criteria)

# Assets & Maintenance
npm run update:threejs   # Atualizar Three.js vendor
npm run optimize:assets  # Otimizar textures (WebP/AVIF)

# Deploy
npm run deploy:preview   # Vercel Preview
npm run deploy:prod      # Vercel Production
```

---

## 📦 Deploy

### Vercel (Produção)

```bash
# Login once
npx vercel login

# Link project
npx vercel link

# Deploy production
npm run deploy:prod
```

**Configuração:** `vercel.json` inclui:
- SPA rewrite: `/(.*)` → `/index.html`
- Cache headers: `/vendor/*` e `/assets/*` → 1 ano immutable
- Framework: `none` (static)

### Variáveis de Ambiente (Vercel Dashboard)

| Variable | Description | Required |
|----------|-------------|----------|
| `VERCEL_TOKEN` | Token para CLI deploy | ✅ |

---

## 🎯 Success Criteria (SPEC.md)

| ID | Criterion | Target | Verification |
|----|-----------|--------|--------------|
| SC-01 | LCP em 4G | < 2.5s | Lighthouse CI |
| SC-02 | 60fps sustentados | frame < 16.67ms | Playwright metrics |
| SC-03 | CLS | < 0.1 | Lighthouse CI |
| SC-04 | Acessibilidade | 0 violations WCAG 2.1 AA | axe-core CI |
| SC-05 | URL live | 200 + health check | curl -I |
| SC-06 | INP | < 200ms | Playwright + web-vitals |
| SC-07 | CI checks | All pass | GitHub Actions |
| SC-08 | Constitution-grade | P1-P5 pass | Human review |

---

## 🏛️ Constitution (Imutável)

| Principle | Description |
|-----------|-------------|
| **P1 ISTQB-FIRST** | 4 técnicas teste: equivalence, boundary, decision table, state machine |
| **P2 ZERO HAPPY-PATH** | 4 categorias: válido, limite, inválido, erro sistema |
| **P3 STATES EXPLICIT** | Estados: `loading` → `ready` → `interacting` \| `error` |
| **P4 ERROR LEAKAGE** | Erros usuário genéricos; detalhes só em console.dev |
| **P5 GATEKEEPING** | Spec aprovada antes de código; checklist antes de deploy |

---

## 🤝 Contribuindo

1. Fork → Feature branch (`feat/nova-funcionalidade`)
2. Escreva/atualize `SPEC.md` primeiro (SDD)
3. Implemente seguindo `tasks/todo.md`
4. `npm run audit` deve passar (Level 2)
5. PR → CI passa → Deploy preview → Review → Merge → Auto-deploy production

---

## 📄 Licença

MIT License — veja [LICENSE](LICENSE)

---

## 🔗 Links Relacionados

- **Protocolo SDD Maestro:** [PROTOCOLO-SDD-MAESTRO.md](PROTOCOLO-SDD-MAESTRO.md)
- **Workspace Belentani:** https://github.com/belentani7/belentani-workspace
- **Secure T University:** https://github.com/belentani7/secure-t-university
- **Belentani Unified:** https://github.com/belentani7/belentani-unified-master

---

*Gerado seguindo Protocolo SDD E0→E7 • Deploy verificado em produção • Spec-code convergence validada*