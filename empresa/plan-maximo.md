# PLAN MÁXIMO — BELENTANI · elevar la carrera al máximo

> Documento vivo. Tesis: **el sistema operativo lírico-neón del caos que somos**.
> No es un SO real: es una **GUI web** (mockup) que convierte tu universo en una experiencia navegable,
> y que funciona como **la cara de tu carrera**: obra, catálogo, prensa, contratación y comunidad en un solo artefacto.

---

## 0. Tesis (el porqué)

Un artista sin sistema se diluye en repos dispersos. Tú ya tienes el mito (Judas, 4 gemas, 5 elementos, 6 eras, 432 Hz).
Falta el **sistema que lo opera**. La GUI-OS no es decoración: es **la interfaz entre tu obra y el mundo**
(fans, prensa, sellos, marcas, salas). Cuando alguien entre, debe sentir que **entra en tu mente**, no en una web.

**Principio rector:** el caos es el material; el sistema es la forma. Todo lo que entre, se compila.

---

## 1. Arquitectura del imperio (4 capas)

| Capa | Qué es | Artefacto |
|---|---|---|
| **L0 · Mito** | Lore canónico (eras, gemas, elementos, manifiesto) | `EMPRESA/manifiesto.md`, `lore_unificado.md` |
| **L1 · Obra** | Música, vídeo, visor 3D, portfólio (44+ obras) | `index.html` (La Judas Experience) |
| **L2 · OS** | **GUI lírico-neón**: escritorio, ventanas, terminal, dock | `os.html` ← *este es el salto* |
| **L3 · Negocio** | Catálogo, press-kit, booking, contratación | secciones dentro del OS |

---

## 2. El OS lírico-neón (concepto)

Un **escritorio ficticio** que se comporta como un sistema:

- **Boot** con log de arranque (ya existe lenguaje en tu web).
- **Dock** con "aplicaciones" = pilares de tu imperio:
  `LORE`, `OBRAS`, `AUDIO`, `VÍDEO`, `PRENSA`, `BOOKING`, `RADIO 432`, `CAOS` (terminal).
- **Ventanas arrastrables** (mockup, sin dependencias): abren cada app con contenido real.
- **Terminal "CAOS"**: escribe comandos líricos → respuestas poéticas + acciones reales (abrir ventana, cambiar frecuencia, exportar).
- **Barra de estado**: 432 Hz · bio-pulse · hora local · visitantes (contador local).
- **Estética**: vidrio + néon rojo/cian (tu lenguaje ya fijado), tipografía del sistema, grano y scanlines.

**Regla de oro (mantener):** `index.html` **no cambia de interfaz**. El OS vive en **`os.html`**, enlazable, y desde dentro puede abrir la obra.

---

## 3. Plan por fases (máximo impacto por unidad de esfuerzo)

### FASE 1 — CIMIENTOS (esta semana)
1. `os.html` v1: boot + escritorio + dock + 3 apps (LORE/OBRAS/AUDIO) + terminal CAOS. **← construido en este ciclo**
2. `EMPRESA/manifiesto.md` + `EMPRESA/catalogo.md` (canónico, alimenta la web).
3. Botón discreto en LORE que abre el OS (o enlace `os.html`) — **sin alterar la interfaz existente** (solo un enlace dentro del panel LORE).

### FASE 2 — OBRA VIVA
4. Catálogo de **44+ obras** enlazado al OS (grid + ficha por obra).
5. **Radio 432 Hz**: reproductor con tus pistas (área local) + visualizador.
6. **Vídeo**: player de la "viagem espacial" (168 s) accesible desde el OS.

### FASE 3 — CARRERA
7. **Press-kit**: bio corta/larga, fotos, logo, rider técnico, enlaces — una carpeta `EMPRESA/press/`.
8. **Booking**: formulario (mailto) + EPK descargable.
9. **SEO/metadatos** + `og:` completos (ya hay base) y **versión EN** para mercado internacional.

### FASE 4 — ESCALA MÁXIMA
10. **Publicar** (dominio propio; tú pulsas Publicar) + analítica sin cookies.
11. **Newsletter** (lista propia) y **comunidad** (Discord/Telegram) enlazadas desde el OS.
12. **Tienda**: drops de obra (print, vinilo, NFT si lo quieres) — requiere tu OK y pago, nunca automático.

---

## 4. KPIs de "carrera al máximo" (medibles)

| KPI | Hoy | Objetivo 90 días |
|---|---|---|
| Obras expuestas en el sistema | 44 (web) | ≥ 60, con ficha |
| Superficies de contacto (apps del OS) | 3 | ≥ 8 |
| Idiomas | PT (+ES parcial) | PT · ES · EN |
| Tiempo en página | — | > 2 min |
| Contactos de prensa/booking respondidos | — | ≥ 10 |
| Lista propia (emails) | 0 | ≥ 500 |

---

## 5. Reglas de ejecución (no negociables)

- Nada de dinero sin tu OK · nada de publicar sin tu clic · nada destructivo (Papelera).
- `index.html` **intacto de interfaz**; todo lo nuevo va en `os.html` o dentro de paneles existentes.
- Cada avance queda escrito aquí (bitácora) y **commiteado en git**.
- 0 recursos externos (todo local, CSP-safe).

---

## 6. Bitácora

| Fecha | Acción | Resultado |
|---|---|---|
| 2026-09-18 | Definido el OS lírico-neón + plan por fases | Este documento |
| 2026-09-18 | Construido `os.html` v1 (boot, escritorio, dock, 3 apps, terminal CAOS) | ver git |
| 2026-09-18 | FASE 1 completada: EMPRESA/manifiesto.md + EMPRESA/catalogo.md; audio real integrado en el OS (assets/audio/judas-demo-pura.mp3 -> app RADIO 432) | ver git |
| 2026-09-18 | FASE 3: EPK en DOCX (EMPRESA/EPK-BELENTANI.docx) + app NEWSLETTER (lista local) + descarga del EPK desde PRENSA | ver git |
