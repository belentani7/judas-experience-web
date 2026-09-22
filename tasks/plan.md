# PLAN TÉCNICO: judas-experience-web

## Context
- **Repo**: `belentani7/judas-experience-web` (por crear)
- **Commit base**: `git rev-parse HEAD` (actual: sin commits, workspace limpio)
- **Stack**: Static Three.js (ES Modules, Import Maps, vendor local)
- **Deploy**: Vercel (vercel.json ya configurado con SPA rewrite + cache headers)
- **Archivos clave**:
  - [`index.html:1-50`](index.html) — Entry point, import map, CSS custom properties
  - [`core/Experience.js`](core/Experience.js) — Three.js scene, camera, renderer, render loop
  - [`sources/shaders/`](sources/shaders/) — GLSL shaders (planet, diamond, key, machine)
  - [`vendor/three/three.module.js`](vendor/three/three.module.js) — Three.js r158+ local

---

## Proposed Changes

### 1. Repository Setup & CI/CD
- **Git init** + remote `origin` → `github.com/belentani7/judas-experience-web`
- **Branch protection**: main protegida (PR required, status checks: ci)
- **GitHub Actions CI** (`.github/workflows/ci.yml`):
  - Lint (ESLint HTML/JS)
  - Typecheck (si TS presente)
  - Playwright E2E (chromium, firefox, webkit)
  - axe-core accessibility (WCAG 2.1 AA)
  - Lighthouse CI (performance budgets)
  - Spec validation (custom script)
- **Dependabot** + **CodeQL** activados

### 2. Vercel Deploy Configuration
- **vercel.json** ya existe con:
  - SPA rewrite: `/(.*)` → `/index.html`
  - Cache headers: `/vendor/*` y `/assets/*` → 1yr immutable
  - Framework: none (static)
- **Env vars en Vercel Dashboard** (no en repo):
  - `VERCEL_TOKEN` (para CLI)
- **Health endpoint**: `/health` → 200 (static file `health.txt` o edge function)

### 3. Performance & Quality Gates
- **Three.js vendor lock**: Script `tools/update-threejs.js` para actualizar vendor
- **Shader validation**: `tools/validate-shaders.js` (GLSL syntax + performance hints)
- **Asset optimization**: `tools/optimize-assets.js` (textures WebP/AVIF, compression)
- **Bundle analysis**: N/A (sin bundler) — verificar tamaños en Network tab

### 4. Accessibility & SEO
- **Meta tags** en `index.html`: Open Graph, Twitter Card, description PT/ES/EN/CA
- **robots.txt** + **sitemap.xml** (generados en CI)
- **Semantic HTML**: `<canvas role="img" aria-label="...">`
- **Reduced motion**: `@media (prefers-reduced-motion: reduce)` desactiva animaciones

### 5. Observability
- **Vercel Analytics** (activado por defecto)
- **Vercel Speed Insights** (Core Web Vitals)
- **Console logging estructurado** (JSON) en `core/Experience.js` para debug

---

## Testing & Validation (Mapeo PRODUCT.md → Tests)

| Behavior Invariant (SPEC.md) | Test / Verificación |
|------------------------------|---------------------|
| SC-01: LCP < 2.5s en 4G | Lighthouse CI budget: `lcp: 2500` |
| SC-02: 60fps sostenidos | Playwright: `page.metrics()` frame timing < 16.67ms |
| SC-03: CLS < 0.1 | Lighthouse CI budget: `cls: 0.1` |
| SC-04: 0 violations WCAG 2.1 AA | axe-core CLI en CI: `axe http://localhost:3000 --tags wcag2aa` |
| SC-05: URL live 200 | `curl -I https://<url>/` en post-deploy step |
| SC-06: INP < 200ms | Playwright + web-vitals library |
| SC-07: CI checks pasan | GitHub Actions required status checks |

---

## Parallelization

| Sub-agent | Subtask | Mode | Worktree | Branch | Coordination |
|-----------|---------|------|----------|--------|--------------|
| `ci-setup` | Configurar `.github/workflows/ci.yml` + dependabot + codeql | local | `../worktrees/ci-setup` | `ci/setup` | Files: `.github/` |
| `vercel-deploy` | Configurar Vercel project, env vars, custom domain | remote | — | `deploy/vercel` | Vercel Dashboard |
| `a11y-audit` | Ejecutar axe-core, documentar gaps, fixes | local | `../worktrees/a11y` | `a11y/audit` | Files: `index.html`, `core/` |
| `perf-baseline` | Lighthouse CI baseline, budgets, regression detection | local | `../worktrees/perf` | `perf/baseline` | Files: `lighthouse-budget.json` |

**Dependency Graph**:
```
ci-setup → vercel-deploy
a11y-audit → vercel-deploy (blocking)
perf-baseline → vercel-deploy (blocking)
```

---

## Risks & Mitigations

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Three.js vendor desactualizado | Media | Alto | Script actualización mensual + tests regresión visual |
| Shader compile falla en móvil | Alta | Alto | Fallback shaders simplificados + feature detection |
| Vercel token expira | Baja | Medio | Rotación automática + alerta 30 días antes |
| Performance regression | Media | Alto | Lighthouse CI en cada PR + alerta si budget excedido |
| Accesibilidad rota por cambio visual | Media | Alto | axe-core en CI + screenshots comparativos |

---

## Follow-ups
- [ ] PWA / Service Worker para offline (fase 2)
- [ ] i18n PT/ES/EN/CA para lore texts
- [ ] Analytics custom events (interacciones Three.js)
- [ ] WebXR / AR support (fase 3)