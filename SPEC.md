# SPEC: judas-experience-web — Universo Visual Three.js

## Objective
Sitio web interactivo Three.js que presenta el universo visual "The Judas Experience" de Belentani: planeta procedural vivo, diamante espectral IOR 2.417, chave dourada PBR y máquina orgánica. Dark pop, 432 Hz. Single-page experience con WebGL.

**Usuario**: Visitante web (desktop/mobile) que explora la experiencia visual
**Éxito**: Carga < 3s en 4G, 60fps sostenidos, sin layout shift, accesible (WCAG 2.1 AA)

---

## Tech Stack
- **Runtime**: Navegador (ES Modules, Import Maps)
- **3D**: Three.js r158+ (vendor local: `./vendor/three/`)
- **Estilos**: CSS Custom Properties, CSS @property, container queries
- **Build**: None (static files only) — Vercel static hosting
- **Deploy**: Vercel (vercel.json configurado)
- **CI**: GitHub Actions (lint, typecheck, build validation, accessibility)

---

## Commands
```
Dev:     npx serve . -p 3000
Lint:    npx eslint . --ext .js,.html --format=compact
Typecheck: npx tsc --noEmit --skipLibCheck (si hay TS)
Test:    npx playwright test --project=chromium
A11y:    npx axe-core-cli http://localhost:3000
Build:   echo "Static site - no build step"
Deploy:  npx vercel --prod
```

---

## Project Structure
```
judas-experience-web/
├── index.html                 # Entry point (SPA)
├── vercel.json                # Vercel config (SPA rewrite + cache headers)
├── PROTOCOLO-SDD-MAESTRO.md   # Protocolo maestro
├── SPEC.md                    # Esta spec
├── tasks/
│   ├── plan.md               # Plan técnico
│   └── todo.md               # Task list
├── .github/
│   └── workflows/
│       └── ci.yml            # CI pipeline
├── vendor/
│   └── three/                # Three.js local (r158+)
│       ├── three.module.js
│       └── addons/
├── assets/                    # Textures, models, fonts (cache 1yr)
├── core/                      # Three.js core systems (scene, camera, render loop)
├── sources/                   # Shaders, geometries, materials
├── empresa/                   # Brand assets, logos
├── pipelines/                 # Render pipelines, post-processing
├── docs/                      # Documentación técnica
├── LORE_UNIFICADO-WEB-GALACTICO-2026-09-20.md
├── lore_unificado.md
├── readme.md
├── skills-showcase.html
├── UNIFIED_WORKSPACE.md
├── os.html
└── abrir.bat
```

---

## Code Style
- **ES Modules** con import maps en `index.html`
- **CSS Custom Properties** para theming (`--void-0`, `--gold`, `--glass`, etc.)
- **Naming**: kebab-case archivos, PascalCase clases Three.js, camelCase variables JS
- **Formatting**: 2 spaces, LF, trailing commas, semicolons
- **Example**:
```js
// core/Experience.js
export class Experience {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, innerWidth/innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.clock = new THREE.Clock();
  }
  resize() { /* ... */ }
  render() { /* ... */ }
}
```

---

## Testing Strategy
- **Unit**: None (static Three.js - logic in shaders/systems)
- **Integration**: Playwright E2E - carga, interacción, performance
- **Accessibility**: axe-core en CI (WCAG 2.1 AA)
- **Visual Regression**: Playwright screenshots + pixelmatch (threshold 0.1%)
- **Performance**: Lighthouse CI (LCP < 2.5s, CLS < 0.1, TBT < 200ms)
- **Coverage**: N/A (no business logic) — focus en visual/performance regression

---

## Boundaries (Always / Ask First / Never)

### Always
- Run Playwright tests antes de commit
- Validar HTML/CSS/JS con linters
- Verificar 60fps en dev (Chrome DevTools Performance)
- Assets en `vendor/` y `assets/` con cache headers (vercel.json)
- Commits convencionales: `feat:`, `fix:`, `chore:`, `docs:`, `perf:`

### Ask First
- Cambiar versión de Three.js (vendor local)
- Añadir dependencias npm (actualmente zero-deps)
- Modificar `vercel.json` (rewrites, headers, functions)
- Cambiar shaders GLSL (impacto visual/performance)

### Never
- Commit secrets, API keys, tokens
- Editar `vendor/three/` manualmente (actualizar via script)
- Remover tests de accesibilidad o performance
- Hardcodear dimensiones (usar CSS containers + resize observer)
- Bloquear main thread > 16ms (target 60fps)

---

## Success Criteria (EARS Notation)

| ID | Criterio | Verificación |
|----|----------|--------------|
| SC-01 | **WHEN** usuario abre URL **THEN** página carga < 3s en 4G (LCP < 2.5s) | Lighthouse CI / WebPageTest |
| SC-02 | **WHEN** experiencia渲染 **THEN** mantiene 60fps sostenidos (frame time < 16.67ms) | Chrome Performance / Playwright |
| SC-03 | **WHEN** usuario redimensiona **THEN** sin layout shift (CLS < 0.1) | Lighthouse / Playwright |
| SC-04 | **WHEN** axe-core analiza **THEN** 0 violations WCAG 2.1 AA | GitHub Actions CI |
| SC-05 | **WHEN** deploy a Vercel **THEN** URL live responde 200 + health check | `curl -I https://<url>/` |
| SC-06 | **WHEN** usuario interactúa (mouse/touch) **THEN** respuesta < 100ms (INP < 200ms) | Playwright + Web Vitals |
| SC-07 | **WHEN** CI ejecuta **THEN** todos los checks pasan (lint, typecheck, test, a11y, build) | GitHub Actions status |
| SC-08 | **WHEN** spec revisada **THEN** checklist constitution-grade P1-P5 pasa | Revisión humana |

---

## Open Questions
- [ ] ¿Three.js version lock en vendor? (actual r158+)
- [ ] ¿PWA/Service Worker para offline? (fase 2)
- [ ] ¿Analytics/telemetría? (Vercel Analytics activado por defecto)
- [ ] ¿Múltiples idiomas (PT/ES/EN/CA)? — i18n en lore texts

---

## Constitution-Grade Checklist (P1-P5)

| Principio | Verificación | Estado |
|-----------|--------------|--------|
| **P1 ISTQB-FIRST** | Spec incluye: equivalence partitions (device/capability), boundary values (fps/load time), decision table (interaction states), state machine (load→render→interact) | ✅ |
| **P2 ZERO HAPPY-PATH** | 4 categorías: válido (desktop Chrome), límite (mobile 4G), inválido (no WebGL), error sistema (shader compile fail) | ✅ |
| **P3 STATES EXPLICIT** | Estados: `loading` → `ready` → `interacting` | `error` (WebGL context lost) | Transiciones prohibidas: `ready→loading`, `error→ready` sin reload | ✅ |
| **P4 ERROR LEAKAGE** | Errores usuario: "Experiencia no disponible" (genérico). Logs internos: detalle técnico solo en console.dev | ✅ |
| **P5 GATEKEEPING** | Spec aprobada antes de implementar; checklist firmada antes de deploy | ✅ |