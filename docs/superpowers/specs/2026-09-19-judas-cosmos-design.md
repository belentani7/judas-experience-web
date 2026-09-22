# SPEC DE DISEÑO — JUDAS COSMOS

**Proyecto:** `judas-experience-unificado` → ampliación masiva **hub + universo**
**Fecha:** 2026-09-19
**Estado:** diseño aprobado (pendiente de plan de implementación)
**Autor:** Belentani · asistido por opencode
**Idioma del artefacto:** PT → ES → EN → CA (regla fija)

---

## 1. Visión artística

El artefacto deja de ser "una escena con reliquias" y se convierte en un **cosmos
navegable**. El hub actual (planeta vivo, diamante, llave dorada, máquina orgánica) pasa a ser
**portal**: cada reliquia abre un mundo. El visitante entra en la mente de Belentani, no en una web.

**Principio rector (heredado):** el caos es el material; el sistema es la forma.
**Principio nuevo (del usuario):** *no escribir lo que ya existe* — se vendoriza código abierto
probado y se tiñe con la estética del lore. Python + datos reales existentes generan lo pesado offline.

**Estética:** vidrio + neón rojo `#ff003c` sobre vacío `#010103`, acento oro `#ffd45c` y cian
`#65f7ff`. Frecuencia-raíz **432 Hz**. Grano y scanlines. Nada genérico.

---

## 2. Decisiones aprobadas (respuestas del usuario)

| # | Tema | Decisión |
|---|------|----------|
| 1 | Arquitectura | **Modular, pero reutilizando código existente** ("descargar algo parecido e inyectarlo"). Enfoque A. |
| 2 | Recursos externos | **Todo**: local-first por defecto, pero se permite CDN/embeds si aporta; se prefiere vendorizar. |
| 3 | Astronomía | **Combinar**: datos reales anclados al lore Judas (mundos ficticios sobre cuerpos reales). |
| 4 | Mundos | **Los 8**: sistema planetario procedural, agujero negro, galaxia/nebulosa navegable, océano espectral, aurora+atmósfera, nubes volumétricas con clima, tormenta/precipitación, sistema solar RTS. |
| 5 | Rendimiento | *"Visualmente el máximo posible."* → Se implementa **gestión de calidad adaptativa** (máximo visual, degradación automática en equipos flojos). |
| 6 | Publicación | **Los tres**: GitHub Pages + Vercel + Cloudflare Pages. |
| 7 | Navegación | **Híbrida**: cinematográfica por defecto + vuelo libre + orbit controls. |
| 8 | Audio | El usuario **grabará** narración + sonidos ambientales libres + canciones → se dejan ganchos y lecho procedural 432 Hz. |
| 9 | Idiomas | **PT, ES, EN, CA** (PT primero). |
| 10 | Entrega | **Una mega-iteración**, internamente modular y verificable por fases. |

**Prioridad explícita:** lo **artístico** manda. `empresa/` (OS, booking, press-kit) queda en segundo plano.

---

## 3. Enfoque elegido: A — Híbrido modular "inject-on-demand"

- **Núcleo propio pequeño** (`core/`): infraestructura compartida.
- **Mundos como código existente adaptado** (`worlds/`): cada mundo es un módulo aislado, cargado bajo demanda.
- **Cero build step**: ES modules + `importmap` local (ya existe en `index.html`).
- **Vendorización**: se copia código permisivo (MIT/CC) a `vendor/` + `worlds/`, con atribución.

**Alternativas descartadas:** B (fork de un mega-demo: rígido, difícil meter 8 mundos) y
C (R3F/Vite: reescribe todo, rompe la regla de reutilización y añade build step).

---

## 4. Arquitectura y árbol de archivos (rutas absolutas)

**Base del proyecto:**
`C:\Users\USER\.openclaw-autoclaw\workspace\projects\judas-experience-unificado`

```
judas-experience-unificado\
├─ index.html                     # HUB: reliquias + lore. Interfaz intacta; +botón "PORTAL"
│                                  #   RUTA: ...\judas-experience-unificado\index.html
├─ os.html                        # GUI lírico-neón (secundario, sin cambios por ahora)
│                                  #   RUTA: ...\judas-experience-unificado\os.html
├─ core\                          # NÚCLEO COMPARTIDO (nuevo)
│   ├─ cosmos.js                  #   sustrato: escala, LOD, starfield, nebulosa, culling
│   ├─ router.js                  #   World Router: carga/descarga de mundos + transiciones
│   ├─ camera-rig.js              #   navegación híbrida (cinemática | libre | orbit)
│   ├─ quality.js                 #   gestor AUTO/ECO/ULTRA adaptativo (FPS→presupuesto)
│   ├─ audio-bus.js               #   capas narración/ambient/canciones/procedural 432 Hz
│   └─ i18n.js                    #   PT/ES/EN/CA (PT primero) + carga de strings
├─ worlds\                        # MUNDOS (nuevo) — 1 módulo por mundo
│   ├─ planet-system.js
│   ├─ black-hole.js
│   ├─ galaxy.js
│   ├─ ocean.js
│   ├─ aurora.js
│   ├─ clouds.js
│   ├─ storm.js
│   └─ solar-rts.js
├─ vendor\                        # third-party (existe + se amplía)
│   ├─ three\                     #   three.module.js + three.core.js (ya presente)
│   │   └─ addons\                #   EffectComposer, UnrealBloomPass, etc. (ya presente)
│   ├─ <libs adaptadas>\          #   código abierto vendorizado con LICENSE + ATTRIBUTION.md
│   └─ ATTRIBUTION.md             #   registro de fuentes, licencias y autoría (nuevo)
├─ data\                          # DATOS pre-generados por Python (nuevo)
│   ├─ stars.hyg.json             #   catálogo de estrellas (HYG) filtrado
│   ├─ exoplanets.json            #   NASA Exoplanet Archive filtrado
│   ├─ planets.lore.json          #   mapeo cuerpo-real → mundo-lore
│   └─ textures\                  #   texturas bakeadas (PNG/EXR)
├─ pipelines\                     # SCRIPTS PYTHON offline (nuevo)
│   ├─ fetch_stars.py             #   descarga+limpia HYG → data/stars.hyg.json
│   ├─ fetch_exoplanets.py        #   descarga+limpia NASA → data/exoplanets.json
│   ├─ bake_textures.py           #   numpy/Pillow → data/textures/*.png
│   ├─ analyze_audio.py           #   librosa (ondas para visualizadores)
│   ├─ serve.py                   #   servidor local de desarrollo (http.server)
│   └─ budget.py                  #   mide MB / draw calls / triángulos
├─ assets\                        # EXISTENTE
│   ├─ audio\                     #   judas-demo-pura.mp3 (existe) + sessions\ (existe)
│   │   ├─ narration\             #   NUEVO: tus grabaciones de narración
│   │   ├─ ambient\               #   NUEVO: sonidos ambientales libres
│   │   └─ songs\                 #   NUEVO: canciones
│   └─ *.png                      #   key art + lore portal (existen)
├─ empresa\                       # SECUNDARIO (manifiesto, catálogo, EPK) — sin prioridad
└─ docs\superpowers\specs\        # ESTE DOCUMENTO + plan de implementación
```

**Copia de este plan en el Escritorio:**
`C:\Users\USER\Desktop\JUDAS-COSMOS-PLAN.md`

---

## 5. Componentes del núcleo (`core/`)

| Módulo | Responsabilidad | Depende de |
|--------|-----------------|------------|
| `cosmos.js` | Escala/LOD unificados, starfield GPU, nebulosa, culling, presupuesto de draw calls. Evita que 8 mundos colisionen. | three |
| `router.js` | Registra mundos, los carga bajo demanda (`import()`), transiciones cinematográficas, `dispose()` al salir. | cosmos, camera-rig, quality, i18n |
| `camera-rig.js` | Modos: `cinematic`, `free` (WASD+ratón), `orbit`. Estado por mundo; handoff con quaternions. | three |
| `quality.js` | Mide FPS; ajusta DPR, samples de bloom, pasos de raymarch, partículas. Modos AUTO/ECO/ULTRA + móvil. | three |
| `audio-bus.js` | Bus maestro con capas mezclables; lecho procedural 432 Hz; ganchos para narración/ambient/canciones tras gesto. | WebAudio |
| `i18n.js` | Strings PT/ES/EN/CA, orden fijo `["pt","es","en","ca"]`, fallback PT. | — |

---

## 6. Los 8 mundos (`worlds/`)

| Mundo | Archivo | Fuente de código/datos | Verificación |
|-------|---------|------------------------|--------------|
| Sistema planetario procedural | `worlds/planet-system.js` | skill `threejs-procedural-planets` + demo MIT vendorizado | órbitas, biomas, anillos, lunas |
| Agujero negro | `worlds/black-hole.js` | skill `threejs-raymarched-space-effects` + shader de lente | disco de acreción + lente gravitacional |
| Galaxia / nebulosa navegable | `worlds/galaxy.js` | generadores de galaxia (points/FFT) vendorizados | 100k+ estrellas a 60fps |
| Océano espectral | `worlds/ocean.js` | skill `threejs-spectral-ocean` (FFT/Gerstner) | olas, espuma, costas |
| Aurora + cielo atmosférico | `worlds/aurora.js` | skill `threejs-atmosphere-aerial-perspective` + aurora raymarch | transición suelo→espacio |
| Nubes volumétricas con clima | `worlds/clouds.js` | skill `threejs-volumetric-clouds` | densidad, silver lining, sombras |
| Tormenta / precipitación | `worlds/storm.js` | skill `threejs-precipitation-surfaces` | lluvia, mojado, rayos |
| Sistema solar interactivo RTS | `worlds/solar-rts.js` | datos reales (NASA/HYG) + UI de panel | sondas, trayectorias, ficha por cuerpo |

El **hub** (`index.html`) mapea sus 4 reliquias a portales:
Planeta → `planet-system` · Diamante → `black-hole` · Llave → `galaxy` · Máquina → `solar-rts`.
Los 4 mundos restantes se alcanzan navegando dentro del cosmos.

---

## 7. Navegación híbrida

- **Por defecto:** cinematográfica (cámara dirigida, transiciones entre mundos).
- **Al tomar control:** vuelo libre WASD/ratón con HUD espacial.
- **Foco:** orbit controls alrededor de cualquier cuerpo/objeto.
- Cambio de modo con tecla/botón; se recuerda por mundo; `prefers-reduced-motion` fuerza cinemática suave.

---

## 8. Rendimiento / calidad adaptativa

Aclaración pedida por el usuario: **no se recorta el arte**; se mide y se ajusta solo.
`quality.js` lee FPS y aplica presupuestos (DPR, samples, pasos de raymarch, nº de partículas,
LOD de estrellas). Modos: `AUTO` (mide), `ECO`, `ULTRA`. Objetivo: 60fps en mesa, jugable en móvil,
máximo visual donde la GPU aguante.

---

## 9. Audio

- Capas del bus: `narration`, `ambient`, `songs`, `procedural` (432 Hz).
- Ubicaciones de tus aportes: `assets\audio\narration\`, `assets\audio\ambient\`, `assets\audio\songs\`.
- Se activa tras gesto del usuario; el lecho 432 Hz procedural existe desde el inicio.
- `librosa` (Python) puede precalcular ondas para visualizadores.

---

## 10. i18n

- Idiomas: `pt`, `es`, `en`, `ca`; **PT primero** siempre.
- `core/i18n.js` centraliza strings; el Códice y la nueva UI consumen de ahí.
- Textos actuales del lore se migran a claves sin perder contenido.

---

## 11. Pipeline Python + datos reales existentes

**Fuentes de datos (verificar licencia en `vendor/ATTRIBUTION.md`):**
- **HYG Database** (astronexus, GitHub) → estrellas. Salida: `data\stars.hyg.json`.
- **NASA Exoplanet Archive** (TAP/CSV público) → exoplanetas. Salida: `data\exoplanets.json`.
- **Combinación con lore:** `data\planets.lore.json` mapea cuerpo real ↔ mundo/reliquia Judas.

**Scripts:** `pipelines\fetch_stars.py`, `fetch_exoplanets.py`, `bake_textures.py`,
`analyze_audio.py`, `serve.py`, `budget.py`.
**Dependencias Python:** `numpy`, `Pillow`, `requests` (+ `librosa` opcional). Entorno local, no en runtime.

---

## 12. Publicación

- Estático puro (sin servidor). Configs en la raíz del proyecto:
  `vercel.json` (Vercel), `_headers` + `wrangler.toml` o Pages (Cloudflare), `.github\workflows\pages.yml` (GitHub Pages).
- Repo: GitHub `belentani7`. **Nada se publica sin tu clic.**

---

## 13. Verificación

- `pipelines\serve.py` para desarrollo local.
- Screenshot + telemetría por mundo (arranque, FPS, draw calls).
- `pipelines\budget.py`: MB totales, triángulos, draw calls.
- Chequeo `prefers-reduced-motion` y fallback sin WebGL (ya existe).

---

## 14. Mega-iteración: fases internas (orden de ejecución)

| Fase | Contenido | Entregable verificable |
|------|-----------|------------------------|
| **F0** | Modularizar `index.html`; crear `core/` + importmap; hub intacto. | Hub antiguo funciona igual, ahora modular. |
| **F1** | Sustrato cósmico + hub-portal + navegación híbrida + i18n + quality. | Clic en reliquia → transición a mundo vacío. |
| **F2** | Mundos por lotes (galaxia → sistema planetario → agujero negro → océano → aurora → nubes → tormenta → solar RTS). | Cada mundo verificado, uno a uno. |
| **F3** | Audio bus + ganchos de narración/ambient/canciones. | Lecho 432 Hz + capas mezclables. |
| **F4** | Pipeline Python + datos reales (estrellas, exoplanetas) + bake de texturas. | `data/` poblado, mundos usando datos reales. |
| **F5** | Deploy triple + verificación final + README/attribution. | URLs vivas + presupuesto medido. |

---

## 15. Riesgos y decisiones abiertas

- **Licencias:** todo código vendorizado requiere LICENSE + atribución; si una fuente no es permisiva, se descarta.
- **Peso del repo:** datos/texuras grandes → vigilar con `budget.py`; considerar binario vs LFS.
- **Compatibilidad Three.js:** vendorizado (r160+); el código externo puede requerir adaptación de API.
- **Alcance de `empresa/`:** congelado salvo que lo pidas.
- **Audio del usuario:** llega después; los ganchos ya estarán listos.

---

## 16. Inventario de ubicaciones (referencia rápida)

| Qué | Ubicación |
|-----|-----------|
| Proyecto | `C:\Users\USER\.openclaw-autoclaw\workspace\projects\judas-experience-unificado` |
| Hub / motor actual | `...\judas-experience-unificado\index.html` |
| OS (secundario) | `...\judas-experience-unificado\os.html` |
| Núcleo nuevo | `...\judas-experience-unificado\core\` |
| Mundos nuevos | `...\judas-experience-unificado\worlds\` |
| Three.js local | `...\judas-experience-unificado\vendor\three\` |
| Addons | `...\judas-experience-unificado\vendor\three\addons\` |
| Atribuciones | `...\judas-experience-unificado\vendor\ATTRIBUTION.md` |
| Datos | `...\judas-experience-unificado\data\` |
| Python offline | `...\judas-experience-unificado\pipelines\` |
| Audio (tus aportes) | `...\judas-experience-unificado\assets\audio\{narration,ambient,songs}\` |
| Este spec | `...\judas-experience-unificado\docs\superpowers\specs\2026-09-19-judas-cosmos-design.md` |
| Plan (Escritorio) | `C:\Users\USER\Desktop\JUDAS-COSMOS-PLAN.md` |
| Kilo (sesión original) | `C:\Users\USER\.local\share\kilo\` · sesión `ses_f45803500ffe5Uglx7YjtsQn15` |

---

*Siguiente paso:* aprobación del spec → `writing-plans` → implementación por fases (F0→F5).
