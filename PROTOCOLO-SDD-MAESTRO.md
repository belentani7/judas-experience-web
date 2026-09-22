# PROTOCOLO SDD MAESTRO — belentani7 ecosystem
Versión: 2026-09-22 | Basado en: GitHub Spec Kit, OpenSpec, AddyOsmani SDD, Warp SDD, protocolo-etapas

---

## 🏛️ CONSTITUCIÓN DEL PROYECTO (Inmutable - se decide UNA vez)

### Principios Funcionales (ISTQB-FIRST)
- **P1. ISTQB-FIRST**: Toda spec aplica 4 técnicas: partición equivalencia, valores límite, tabla decisión, transición estados
- **P2. ZERO HAPPY-PATH-ONLY**: 4 categorías mínimas: válido típico, límite, inválido, error sistema
- **P3. STATES EXPLICIT**: Conjunto cerrado de estados + transiciones permitidas + PROHIBIDAS con justificación
- **P4. ERROR LEAKAGE FORBIDDEN**: Errores cliente no revelan campo, stack, IDs internos, queries, infra
- **P5. GATEKEEPING BEFORE CODE**: Clarify obligatorio antes de Plan; checklist constitution-grade antes de Implement

### 7 Guardrails Arquitectónicos
1. **Single Source of Truth** — Un patrón por concern (cache, error serialization, query patterns)
2. **Boundary Contracts** — Interfaces en límites de módulos, no internos
3. **Dependency Direction** — Flechas una vía, sin ciclos
4. **Observability Built-in** — Logs estructurados, métricas, tracing desde día 1
5. **Security by Default** — AuthZ en cada endpoint, validación input, rate limiting
5. **Rollback Defined** — Estrategia de rollback ANTES de deploy
6. **Spec-Code Convergence** — Spec viva, actualizada en mismo PR que código

---

## 🚪 7 ETAPAS CON GATES (E0-E6 + Constitution wrap)

```
E0 INTAKE → E1 SPEC → E2 PLAN → E3 TASKS → E4 IMPLEMENT → E5 VERIFY → E6 SHIP → E7 LEARN
   │          │        │         │           │            │           │          │
   ▼          ▼        ▼         ▼           ▼            ▼           ▼          ▼
Human      Human    Human    Human      Human       Human      Human      Human
review     review   review   review     review      review     review     review
```

### **E0 INTAKE** — Entender antes de tocar
- Reformular en 1-3 frases | Detectar proyecto | Buscar contexto existente
- **Gate**: Usuario confirma o petición inequívoca
- **Artefacto**: Resumen + preguntas resueltas

### **E1 SPEC** — Qué es "terminado" (Constitution wrap)
- **Scope Check (Phase 0)**: Si >1 capability independiente → Capability Map (module table + build order)
- **Specify**: 6 áreas core: Objective, Commands, Project Structure, Code Style, Testing Strategy, Boundaries (Always/Ask/Never)
- **Success Criteria**: Específicos, testeables (EARS notation: "WHEN [event] THEN [response]")
- **Gate**: Human aprueba spec + checklist constitution-grade (P1-P5)
- **Artefacto**: `SPEC.md` o `specs/<id>/PRODUCT.md`

### **E2 PLAN** — Plan técnico (write-tech-spec)
- Context (codebase actual + referencias commit-pinned)
- Proposed changes (módulos, APIs, data flow, tradeoffs)
- Testing & validation (mapea Behavior invariants de PRODUCT.md a tests concretos)
- Parallelization (sub-agentes con worktrees, branches, coordination)
- **Gate**: Human aprueba plan
- **Artefacto**: `tasks/plan.md` o `specs/<id>/TECH.md`

### **E3 TASKS** — Descomposición atómica
- Cada task: completable en 1 sesión, acceptance criteria, verify step, ≤5 archivos
- Orden por dependencia, no importancia
- **Gate**: Human aprueba task list
- **Artefacto**: `tasks/todo.md` o `specs/<id>/TASKS.md`

### **E4 IMPLEMENT** — Ejecutar (implement-specs)
- 1 task → 1 cambio → verificación local (typecheck/lint/test)
- Reuse-before-generate | Subagentes paralelos para trabajo independiente
- Update specs en mismo PR cuando decisiones cambian
- **Gate**: Checks locales pasan
- **Artefacto**: Commits + evidencia ejecución

### **E5 VERIFY** — Evidencia, no promesas (check-impl-against-spec)
- Probar contra success criteria de E1 (tests, smoke, URL live, captura real)
- Verificación independiente: 2do agente/API o re-lectura adversarial
- Detectar regresiones y referencias rotas
- **Gate**: 100% criterios probados; no probado = declarado explícitamente
- **Artefacto**: Informe verificación con evidencia

### **E6 SHIP** — Publicar
- Commit convencional (`feat:`, `fix:`, `chore:`, `docs:`) | Push GitHub | Deploy plataforma correcta
- Verificar URL en vivo (200 + health endpoint)
- README actualizado con enlaces vivos
- **Gate**: Usuario abre resultado sin ayuda
- **Artefacto**: Commit(s) + URL(s) verificada(s)

### **E7 LEARN** — Cerrar y dejar memoria
- Actualizar `ESTADO.md`/README: qué se hizo, qué falta, decisiones
- Registrar recursos en `RECURSOS-500.md`
- **Cerrar sesión** (1 tarea = 1 sesión = compactar a ~25K)

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

## ✅ CHECKLIST PRODUCCIÓN NIVEL 2 (Robusto - 30 criterios)

### Críticos (🔴 - Bloquean deploy)
1. `origin` → `github.com/belentani7/<repo>`
2. Branch `main` protegida (PR required, status checks)
3. **Cero secretos en repo** (git log clean)
4. `.gitignore` completo
5. `package.json` scripts: build, dev, start, test, lint, typecheck
6. Build local pasa (exit 0)
7. Config deploy detectada + deploy plataforma correcta
8. Env vars en plataforma (NO en repo)
9. Health endpoint `/api/health` o `/healthz` → 200
10. README con descripción, install, run, deploy, env vars, links vivos

### Altos (🟡 - Requeridos producción)
11. Commits convencionales
12. Dependabot/Renovate activado
13. CodeQL/Code scanning
14. `package-lock.json` commiteado
15. TypeScript strict mode
16. Lint pasa
17. Tests existen + pasan + coverage >80%
18. Preview deployments en PRs
19. Error tracking (Sentry/Vercel Analytics/CF)
20. Logs estructurados (pino/winston/JSON)
21. SEO/Access: robots.txt, sitemap.xml, meta OG/Twitter
22. Accesibilidad WCAG 2.1 AA (axe-core en CI)
23. CHANGELOG.md actualizado
24. SPEC.md/docs/spec.md con criterios aceptación

### Medios (🟢 - Deseables)
25. Core Web Vitals: LCP<2.5s, CLS<0.1, INP<200ms
26. Assets cache headers (static 1yr, HTML no-cache)
27. DNS custom + SSL
28. CDN/Edge activado
29. Uptime monitor
30. Docs: SPEC.md actualizado

---

## 🤖 AUTOMATIZACIÓN OBLIGATORIA

### Scripts requeridos en cada repo:
```bash
# Auditoría completa
python tools/audit-production-readiness.py --repo . --level 2

# Aplicar checklist masivo
python tools/apply-production-checklist.py --all --level 2 --push --deploy

# Verificación spec-code convergence
python tools/check-spec-convergence.py --spec SPEC.md --diff HEAD~1..HEAD
```

### CI/CD Pipeline (GitHub Actions) - Template obligatorio:
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

## 🎯 APLICACIÓN MASIVA - PRÓXIMOS PASOS

1. **Crear `PROTOCOLO-SDD-MAESTRO.md`** en raíz de cada repo
2. **Para CADA proyecto detectado** → Ejecutar E0→E7 completo
3. **Crear SPEC.md + tasks/plan.md + tasks/todo.md** por proyecto
4. **Configurar CI/CD + deploy** según matriz
5. **Push a GitHub + deploy verificado**
6. **Actualizar README con URLs vivas**