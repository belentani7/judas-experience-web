# TASK LIST: judas-experience-web

## Phase 0: Repository Setup (PR #1)

- [ ] **Task**: Inicializar git repo y configurar remote
  - Acceptance: `git remote -v` muestra `origin → github.com/belentani7/judas-experience-web`
  - Verify: `git push -u origin main` exit 0
  - Files: `.git/`, `.gitignore`

- [ ] **Task**: Crear `.gitignore` completo
  - Acceptance: Ignora `node_modules`, `.env*`, `*.log`, `*.lock`, `dist/`, `.vercel/`, `.DS_Store`, `Thumbs.db`
  - Verify: `git status` limpio (solo archivos intencionales)
  - Files: `.gitignore`

- [ ] **Task**: Commit inicial convencional
  - Acceptance: Mensaje `chore: initial commit - Three.js visual experience`
  - Verify: `git log --oneline -1` muestra commit convencional
  - Files: All project files

## Phase 1: CI/CD Pipeline (PR #2)

- [ ] **Task**: Crear `.github/workflows/ci.yml`
  - Acceptance: Workflow ejecuta lint, typecheck, test, a11y, lighthouse, spec-validation
  - Verify: Push a feature branch → GitHub Actions pasa todos los jobs
  - Files: `.github/workflows/ci.yml`

- [ ] **Task**: Configurar Dependabot (`.github/dependabot.yml`)
  - Acceptance: PRs semanales para npm/github-actions
  - Verify: Dependabot PR aparece en repo
  - Files: `.github/dependabot.yml`

- [ ] **Task**: Activar CodeQL (`.github/codeql/codeql-config.yml`)
  - Acceptance: Code scanning activado en Security tab
  - Verify: CodeQL analysis runs en CI
  - Files: `.github/codeql/codeql-config.yml`

- [ ] **Task**: Crear script validación spec (`tools/validate-spec.py`)
  - Acceptance: `python tools/validate-spec.py SPEC.md` exit 0 si spec válida
  - Verify: Ejecutar localmente + en CI
  - Files: `tools/validate-spec.py`

## Phase 2: Vercel Deploy (PR #3)

- [ ] **Task**: Crear proyecto Vercel y configurar
  - Acceptance: `vercel link` conecta repo, `vercel --prod` deploya
  - Verify: URL live responde 200
  - Files: `.vercel/project.json` (no commitear), env vars en Dashboard

- [ ] **Task**: Configurar env vars en Vercel Dashboard
  - Acceptance: `VERCEL_TOKEN` + cualquier otra var en Settings → Environment Variables
  - Verify: Deploy usa vars correctamente
  - Files: Ninguno (Dashboard only)

- [ ] **Task**: Health endpoint `/health`
  - Acceptance: `curl -I https://<url>/health` → 200
  - Verify: Post-deploy step en CI valida
  - Files: `health.txt` o edge function

- [ ] **Task**: Configurar custom domain (opcional)
  - Acceptance: `judas.belentani.com` → Vercel deployment
  - Verify: DNS + SSL activo
  - Files: `vercel.json` (domains), DNS provider

## Phase 3: Quality Gates (PR #4)

- [ ] **Task**: Configurar ESLint para HTML/JS
  - Acceptance: `npx eslint . --ext .js,.html` sin errores
  - Verify: CI job lint pasa
  - Files: `.eslintrc.json`, `package.json` (devDeps)

- [ ] **Task**: Configurar Playwright E2E tests
  - Acceptance: `npx playwright test` pasa en chromium/firefox/webkit
  - Verify: CI job test pasa
  - Files: `playwright.config.ts`, `e2e/*.spec.ts`

- [ ] **Task**: Configurar axe-core accessibility tests
  - Acceptance: `npx axe-core-cli http://localhost:3000 --tags wcag2aa` → 0 violations
  - Verify: CI job a11y pasa
  - Files: `e2e/a11y.spec.ts`

- [ ] **Task**: Configurar Lighthouse CI budgets
  - Acceptance: `lighthouse-ci` budgets: LCP<2500, CLS<0.1, TBT<200, SI<3000
  - Verify: CI job lighthouse pasa
  - Files: `lighthouse-budget.json`, `.github/workflows/ci.yml`

## Phase 4: Performance & Assets (PR #5)

- [ ] **Task**: Script actualización Three.js vendor (`tools/update-threejs.js`)
  - Acceptance: Descarga Three.js latest r158+, extrae `three.module.js` + `addons/` a `vendor/three/`
  - Verify: `node tools/update-threejs.js` actualiza vendor sin romper
  - Files: `tools/update-threejs.js`, `vendor/three/`

- [ ] **Task**: Validador shaders GLSL (`tools/validate-shaders.js`)
  - Acceptance: Parse todos `.glsl`/`.vert`/`.frag` en `sources/shaders/`, reporta syntax errors + performance hints
  - Verify: Ejecuta en CI pre-deploy
  - Files: `tools/validate-shaders.js`

- [ ] **Task**: Optimizador assets (`tools/optimize-assets.js`)
  - Acceptance: Convierte textures a WebP/AVIF, genera múltiples tamaños, actualiza referencias
  - Verify: Tamaño total assets reducido >30%
  - Files: `tools/optimize-assets.js`, `assets/`

## Phase 5: Accessibility & SEO (PR #6)

- [ ] **Task**: Meta tags multilingües PT/ES/EN/CA en `index.html`
  - Acceptance: `og:title`, `og:description`, `twitter:card` en 4 idiomas (lang attribute switching)
  - Verify: Social preview correcto en Facebook/Twitter/LinkedIn
  - Files: `index.html`

- [ ] **Task**: Generar `robots.txt` + `sitemap.xml` en CI
  - Acceptance: `curl https://<url>/robots.txt` → 200, `curl https://<url>/sitemap.xml` → 200 + URLs válidas
  - Verify: CI step genera y despliega
  - Files: `.github/workflows/ci.yml` (generate step), `public/` (output)

- [ ] **Task**: Semantic HTML + ARIA en canvas Three.js
  - Acceptance: `<canvas role="img" aria-label="The Judas Experience - planeta procedural, diamante, chave, máquina">`
  - Verify: axe-core pasa sin violations ARIA
  - Files: `index.html`, `core/Experience.js`

- [ ] **Task**: Reduced motion support
  - Acceptance: `@media (prefers-reduced-motion: reduce)` desactiva animaciones automáticas
  - Verify: Test Playwright con `prefers-reduced-motion: reduce`
  - Files: `index.html` (CSS), `core/Experience.js`

## Phase 6: Observability & Polish (PR #7)

- [ ] **Task**: Logging estructurado JSON en `core/Experience.js`
  - Acceptance: `console.log(JSON.stringify({level, event, data, timestamp}))` para eventos clave
  - Verify: Logs visibles en Vercel Functions / Browser console
  - Files: `core/Experience.js`

- [ ] **Task**: Vercel Analytics + Speed Insights activados
  - Acceptance: Dashboard Vercel muestra Analytics + Web Vitals
  - Verify: Post-deploy verifica
  - Files: Ninguno (Dashboard)

- [ ] **Task**: README.md con enlaces vivos
  - Acceptance: README incluye: descripción, install, run, deploy, env vars, **URL live verificada**
  - Verify: `cat README.md` muestra URL Vercel funcional
  - Files: `README.md`

- [ ] **Task**: CHANGELOG.md inicial
  - Acceptance: `CHANGELOG.md` con `## [Unreleased]` y `## [1.0.0] - 2026-09-22`
  - Verify: `cat CHANGELOG.md`
  - Files: `CHANGELOG.md`

## Phase 7: Final Verification & Ship (PR #8 - merge to main)

- [ ] **Task**: Ejecutar auditoría completa producción
  - Acceptance: `python tools/audit-production-readiness.py --repo . --level 2` → 30/30 criterios ✅
  - Verify: Script output muestra todo verde
  - Files: `tools/audit-production-readiness.py`

- [ ] **Task**: Verificar spec-code convergence
  - Acceptance: `python tools/check-spec-convergence.py --spec SPEC.md --diff HEAD~1..HEAD` → 0 drift
  - Verify: Script output
  - Files: `tools/check-spec-convergence.py`

- [ ] **Task**: Merge a main + tag release
  - Acceptance: PR aprobado, mergeado, tag `v1.0.0` pushed
  - Verify: GitHub releases muestra v1.0.0
  - Files: Git tags

- [ ] **Task**: Verificación post-deploy final
  - Acceptance: URL live 200, health 200, Lighthouse CI budgets pasan, axe-core 0 violations
  - Verify: Checklist manual + CI status
  - Files: Ninguno (runtime)

---

## Estado Actual
- **Proyecto**: judas-experience-web
- **Fase actual**: E3 TASKS (esta lista)
- **Próximo gate**: Human aprueba task list → E4 IMPLEMENT
- **Repositorio destino**: `github.com/belentani7/judas-experience-web`
- **Deploy target**: Vercel (static)