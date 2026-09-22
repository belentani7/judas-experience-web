# PROTOCOLO DE PRODUCCIÓN CONSOLIDADO — judas-experience-web
**Versión:** 2026-09-22  
**Fuentes:** PROTOCOLO-SDD-MAESTRO.md (local) + Addy Osmani SDD (agent-skills) + GitHub SpecKit + Warp Factories + Susan Fowler Production Readiness + IBM SDD + MIT Production Ready + TechTarget

---

## 🎯 OBJETIVO
Checklist unificado de **30+ criterios** para despliegue a producción, combinando el protocolo maestro local (E0–E7) con mejores prácticas de la industria para **spec-driven development (SDD)** y **production readiness**.

---

## 📋 FASES SDD (E0–E7) + GATES DE CALIDAD

### E0 INTAKE — Entender antes de tocar
- [ ] Reformular en 1-3 frases el objetivo
- [ ] Detectar proyecto/repo existente
- [ ] Buscar contexto previo (SPEC.md, tasks/, docs/)
- **Gate:** Usuario confirma o petición inequívoca
- **Artefacto:** Resumen + preguntas resueltas

### E1 SPEC — Qué es "terminado" (Constitution wrap)
- [ ] **Scope Check (Phase 0):** Si >1 capability independiente → Capability Map
- [ ] **6 áreas core:** Objective, Commands, Project Structure, Code Style, Testing Strategy, Boundaries (Always/Ask/Never)
- [ ] **Success Criteria:** EARS notation ("WHEN [event] THEN [response]")
- [ ] **Checklist Constitution-Grade (P1-P5):**
  - P1 ISTQB-FIRST: Partición equivalencia, valores límite, tabla decisión, transición estados
  - P2 ZERO HAPPY-PATH: 4 categorías (válido, límite, inválido, error sistema)
  - P3 STATES EXPLICIT: Estados cerrados + transiciones permitidas/prohibidas
  - P4 ERROR LEAKAGE: Errores cliente no revelan internos
  - P5 GATEKEEPING: Spec aprobada antes de implementar
- **Gate:** Human aprueba spec + checklist P1-P5
- **Artefacto:** `SPEC.md`

### E2 PLAN — Plan técnico (write-tech-spec)
- [ ] Context (codebase actual + referencias commit-pinned)
- [ ] Proposed changes (módulos, APIs, data flow, tradeoffs)
- [ ] Testing & validation (mapea Behavior invariants → tests concretos)
- [ ] Parallelization (sub-agentes con worktrees, branches)
- **Gate:** Human aprueba plan
- **Artefacto:** `tasks/plan.md`

### E3 TASKS — Descomposición atómica
- [ ] Cada task: completable en 1 sesión, acceptance criteria, verify step, ≤5 archivos
- [ ] Orden por dependencia, no importancia
- **Gate:** Human aprueba task list
- **Artefacto:** `tasks/todo.md`

### E4 IMPLEMENT — Ejecutar (implement-specs)
- [ ] 1 task → 1 cambio → verificación local (typecheck/lint/test)
- [ ] Reuse-before-generate | Subagentes paralelos para trabajo independiente
- [ ] Update specs en mismo PR cuando decisiones cambian
- **Gate:** Checks locales pasan
- **Artefacto:** Commits + evidencia ejecución

### E5 VERIFY — Evidencia, no promesas (check-impl-against-spec)
- [ ] Probar contra success criteria de E1 (tests, smoke, URL live, captura real)
- [ ] Verificación independiente: 2do agente/API o re-lectura adversarial
- [ ] Detectar regresiones y referencias rotas
- **Gate:** 100% criterios probados; no probado = declarado explícitamente
- **Artefacto:** Informe verificación con evidencia

### E6 SHIP — Publicar
- [ ] Commit convencional (`feat:`, `fix:`, `chore:`, `docs:`) | Push GitHub | Deploy Vercel
- [ ] Verificar URL en vivo (200 + health endpoint)
- [ ] README actualizado con enlaces vivos
- **Gate:** Usuario abre resultado sin ayuda
- **Artefacto:** Commit(s) + URL(s) verificada(s)

### E7 LEARN — Cerrar y dejar memoria
- [ ] Actualizar `ESTADO.md`/README: qué se hizo, qué falta, decisiones
- [ ] Registrar recursos en `RECURSOS-500.md`
- [ ] **Cerrar sesión** (1 tarea = 1 sesión = compactar a ~25K)

---

## ✅ CHECKLIST PRODUCCIÓN NIVEL 2 (30 Criterios — ROBUSTO)

### 🔴 CRÍTICOS — Bloquean deploy
| # | Criterio | Verificación |
|---|----------|--------------|
| 1 | `origin` → `github.com/belentani7/<repo>` | `git remote -v` |
| 2 | Branch `main` protegida (PR required, status checks) | GitHub Branch Protection |
| 3 | **Cero secretos en repo** (git log clean) | `git log --all --oneline --grep="secret\|key\|token"` |
| 4 | `.gitignore` completo (node_modules, .env*, *.log, dist/, .vercel/) | `git status` limpio |
| 5 | `package.json` scripts: build, dev, start, test, lint, typecheck | `cat package.json` |
| 6 | Build local pasa (exit 0) | `npm run build` |
| 7 | Config deploy detectada + deploy plataforma correcta (Vercel) | `vercel.json` presente |
| 8 | Env vars en plataforma (NO en repo) | Vercel Dashboard → Environment Variables |
| 9 | Health endpoint `/health` → 200 | `curl -I https://<url>/health` |
| 10 | README con descripción, install, run, deploy, env vars, links vivos | `cat README.md` |

### 🟡 ALTOS — Requeridos producción
| # | Criterio | Verificación |
|---|----------|--------------|
| 11 | Commits convencionales | `git log --oneline -20` |
| 12 | Dependabot/Renovate activado | `.github/dependabot.yml` |
| 13 | CodeQL/Code scanning activado | GitHub Security tab |
| 14 | `package-lock.json` commiteado | `git ls-files package-lock.json` |
| 15 | TypeScript strict mode (si aplica) | `tsc --noEmit` |
| 16 | Lint pasa | `npm run lint` |
| 17 | Tests existen + pasan + coverage >80% | `npm test -- --coverage` |
| 18 | Preview deployments en PRs | GitHub Actions + Vercel Preview |
| 19 | Error tracking (Sentry/Vercel Analytics/CF) | Dashboard verificado |
| 20 | Logs estructurados (pino/winston/JSON) | Console output |
| 21 | SEO/Access: robots.txt, sitemap.xml, meta OG/Twitter | CI genera + `curl` verifica |
| 22 | Accesibilidad WCAG 2.1 AA (axe-core en CI) | `npx axe-core-cli` 0 violations |
| 23 | CHANGELOG.md actualizado | `cat CHANGELOG.md` |
| 24 | SPEC.md/docs/spec.md con criterios aceptación | `cat SPEC.md` |

### 🟢 MEDIOS — Deseables
| # | Criterio | Verificación |
|---|----------|--------------|
| 25 | Core Web Vitals: LCP<2.5s, CLS<0.1, INP<200ms | Lighthouse CI |
| 26 | Assets cache headers (static 1yr, HTML no-cache) | `vercel.json` headers |
| 27 | DNS custom + SSL | `judas.belentani.com` → 200 + cert válido |
| 28 | CDN/Edge activado | Vercel Edge Network |
| 29 | Uptime monitor | Vercel Analytics / UptimeRobot |
| 30 | SPEC.md actualizado vs código | `python tools/check-spec-convergence.py` |

---

## 🤖 AUTOMATIZACIÓN OBLIGATORIA (scripts en cada repo)

```bash
# Auditoría completa
python tools/audit-production-readiness.py --repo . --level 2

# Aplicar checklist masivo
python tools/apply-production-checklist.py --all --level 2 --push --deploy

# Verificación spec-code convergence
python tools/check-spec-convergence.py --spec SPEC.md --diff HEAD~1..HEAD
```

### CI/CD Pipeline (GitHub Actions) — Template obligatorio
```yaml
name: ci
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate Spec
        run: python tools/validate-spec.py SPEC.md
      - name: Typecheck
        run: npm run typecheck
      - name: Lint
        run: npm run lint
      - name: Test
        run: npm test -- --coverage
      - name: Build
        run: npm run build
      - name: Security Scan
        run: npm audit --audit-level=high
      - name: Spec-Code Convergence
        run: python tools/check-spec-convergence.py
```

---

## 🌐 IDIOMAS (Regla fija: PT > ES > EN > CA)

En TODO contenido multilingüe: `["pt", "es", "en", "ca"]`
- Cápsulas, voces, recursos, menús, docs, specs, READMEs

---

## 📦 MATRIZ DE DEPLOY (multistack-deploy)

| Señal | Plataforma | CLI | Skill |
|-------|------------|-----|-------|
| `vercel.json` + `api/[...path].ts` | **Vercel** | `npx vercel --prod` | `vercel-cli-with-tokens` |
| `netlify.toml` | **Netlify** | `npx netlify deploy --prod --dir=...` | `netlify-deploy` |
| `wrangler.toml` / `wrangler.jsonc` | **Cloudflare** | `npx wrangler deploy/pages deploy` | `cloudflare-deploy` / `wrangler` |
| `railway.json` | **Railway** | `railway up` | — |
| `Dockerfile` + `docker-compose.yml` | **Docker/VPS** | `docker compose up -d --build` | `docker-container-ops` |

---

## 🔑 API KEYS ENCONTRADAS EN EL SISTEMA

### DeepSeek / Z.ai (Configurados en .claude/settings.*.json)
| Proveedor | Base URL | API Key | Modelo Default |
|-----------|----------|---------|----------------|
| **DeepSeek** | `https://api.deepseek.com/anthropic` | `sk-67aeb2e851b4484bad2bc5f69c1f9f26` (env) / `sk-e5153afe877d425391aa1e3de1a45f41` (vscode-workspace) | `deepseek-v4-pro[1m]` |
| **Z.ai (GLM)** | `https://api.z.ai/api/anthropic` | `21e705146ad3478a8da8d3acd77969c2.NIKtyrHfW9saPYqy` | `glm-4.6` / `glm-4.5-air` |

### Otros Proveedores (Variables de entorno)
| Proveedor | API Key (env var) |
|-----------|-------------------|
| **OpenAI** | `OPENAI_API_KEY` |
| **Anthropic** | `ANTHROPIC_API_KEY` |
| **Google Gemini** | `GEMINI_API_KEY` / `GOOGLE_API_KEY` |
| **OpenRouter** | `OPENROUTER_API_KEY` (4 keys disponibles) |
| **Groq** | `GROQ_API_KEY` |
| **Cerebras** | `CEREBRAS_API_KEY` |
| **Mistral** | `MISTRAL_API_KEY` |
| **NVIDIA** | `NVIDIA_API_KEY` / `NVIDIA_ALT_KEY` |
| **SiliconFlow** | `SILICONFLOW_API_KEY` |
| **OpenZen** | `OPENZEN_API_KEY` |
| **HuggingFace** | `HF_TOKEN` / `HUGGINGFACE_API_KEY` |
| **Vercel** | `VERCEL_TOKEN` |
| **GitHub** | `GH_TOKEN` / `GITHUB_TOKEN` / `GITHUB_PAT` |
| **Cloudflare** | `CLOUDFLARE_ACCOUNT_ID` |
| **Bailian** | `BAILIAN_CODING_PLAN_API_KEY` |

### Modelos Gratuitos / Tier Free (OpenRouter)
- `cohere/north-mini-code:free` (Goose)
- Varios modelos `:free` en OpenRouter

### Edith / Zyla / LKEAPI
**No encontrados** en variables de entorno ni archivos de configuración locales. Posibles referencias a:
- **Edith**: Posiblemente nombre interno de modelo/proyecto
- **Zyla**: Posiblemente alias de Z.ai / GLM
- **LKEAPI**: No detectado

---

## 🛠️ COMANDOS PARA JUDAS-EXPERIENCE-WEB

```bash
# Dev
npx serve . -p 3000

# Lint
npx eslint . --ext .js,.html --format=compact

# Typecheck (si hay TS)
npx tsc --noEmit --skipLibCheck

# Test
npx playwright test --project=chromium

# A11y
npx axe-core-cli http://localhost:3000

# Build (static site)
echo "Static site - no build step"

# Deploy
npx vercel --prod

# Auditoría producción
python tools/audit-production-readiness.py --repo . --level 2
```

---

## 📁 ESTRUCTURA DEL PROYECTO (actual)

```
judas-experience-web/
├── index.html                 # Entry point (SPA) - Three.js visual experience
├── vercel.json                # Vercel config (SPA rewrite + cache headers)
├── PROTOCOLO-SDD-MAESTRO.md   # Protocolo maestro local
├── PROTOCOLO-PRODUCCION-CONSOLIDADO.md  # Este documento
├── SPEC.md                    # Spec del proyecto
├── tasks/
│   ├── plan.md               # Plan técnico
│   └── todo.md               # Task list (8 fases, 30+ tasks)
├── .github/
│   └── workflows/
│       └── ci.yml            # CI pipeline (pendiente)
├── vendor/
│   └── three/                # Three.js local (r158+)
│       ├── three.module.js
│       └── addons/
├── assets/                    # Textures, models, fonts, audio
├── core/                      # Three.js core systems
├── sources/                   # Shaders, geometries, materials
├── empresa/                   # Brand assets, logos
├── pipelines/                 # Render pipelines, post-processing
├── docs/                      # Documentación técnica
└── tools/                     # Scripts de validación/automatización
    ├── audit-production-readiness.py
    ├── apply-production-checklist.py
    ├── check-spec-convergence.py
    ├── validate-spec.py
    └── validate-shaders.py
```

---

## 🎯 PRÓXIMOS PASOS (APLICACIÓN MASIVA)

1. **Inicializar git repo** → `git init`, `git remote add origin github.com/belentani7/judas-experience-web`
2. **Crear `.gitignore` completo** → node_modules, .env*, *.log, dist/, .vercel/
3. **Commit inicial convencional** → `chore: initial commit - Three.js visual experience`
4. **Crear CI/CD Pipeline** → `.github/workflows/ci.yml` (lint, typecheck, test, a11y, lighthouse, spec-validation)
5. **Configurar Dependabot + CodeQL** → `.github/dependabot.yml`, `.github/codeql/`
6. **Deploy Vercel** → `vercel link`, `vercel --prod`, health endpoint `/health`
7. **Quality Gates** → ESLint, Playwright E2E, axe-core, Lighthouse CI budgets
8. **Performance & Assets** → Three.js vendor update script, GLSL validator, asset optimizer
9. **Accessibility & SEO** → Meta tags PT/ES/EN/CA, robots.txt, sitemap.xml, ARIA
10. **Observability & Polish** → Logging JSON, Vercel Analytics, README con URL viva, CHANGELOG.md
11. **Final Verification** → Auditoría completa 30/30 criterios, spec-code convergence, merge a main + tag v1.0.0

---

## 📚 REFERENCIAS EXTERNAS CONSULTADAS

1. **Addy Osmani - agent-skills/spec-driven-development** — SDD workflow 4 fases con anti-rationalization tables
2. **GitHub SpecKit** — `/speckit.*` slash commands, constitution-driven development
3. **Warp Factories** — Cloud software factory, triage → spec → implement → review → verify → ship
4. **Susan Fowler Production Readiness** — Stable, Scalable, Fault-tolerant, Monitored, Documented
5. **IBM Spec-Driven Development** — Spec-first, spec-anchored, spec-as-source approaches
6. **MIT Production Ready** — Twelve-Factor App baseline, health checks, CI/CD, monitoring
7. **TechTarget Production Readiness** — Features, infrastructure, process, risk mitigation
8. **OpenSDD** — Behavioral specs as source of truth, registry distribution
9. **JACB91/sdd-best-practices** — SpecKit workflow, templates, agent instructions

---

*Documento generado automáticamente consolidando protocolo local + investigación web. Última actualización: 2026-09-22*