# Calendario de Adviento 🎄

Un calendario de adviento web para regalar: 24 cajitas que se van abriendo solas, una por
día, hasta el 24 de diciembre.

Sitio: **https://leonel1524.github.io/adviento-calendar/**

## Cómo funciona

- Cada día se **desbloquea a las 9:00 a.m. hora de Venezuela** (UTC-4) del día que le toca en
  diciembre. La regla vive en un solo lugar (`src/lib/gating.ts`) y se usa tanto al construir
  el sitio como en el navegador.
- Los días abiertos se recuerdan en el navegador (`localStorage`).
- **Modo prueba**: `?unlock=all` en la URL abre los 24 días y muestra un banner.
  Ej: https://leonel1524.github.io/adviento-calendar/calendar/?unlock=all

## Comandos

| Comando | Qué hace |
| :--- | :--- |
| `npm install` | Instala las dependencias |
| `npm run dev` | Servidor de desarrollo en `localhost:4321` |
| `npm run admin` | **Panel para editar los días** (ver `PANEL.md`) |
| `npm run build` | Construye el sitio en `./dist/` |
| `npm run preview` | Previsualiza la versión construida |
| `npm run test:gating` | Pruebas de la regla de desbloqueo |

## Estructura

```text
src/
├── components/
│   ├── Welcome.astro      # portada con la magia (nieve, estrellas, trineo)
│   └── Grid.astro         # cajitas, modal y desbloqueo
├── data/
│   ├── days.json          # ← el contenido de los 24 días
│   └── days.ts            # tipos + validación del contenido
├── layouts/Layout.astro
├── lib/
│   ├── gating.ts          # cuándo se abre cada día
│   ├── media.ts           # rutas de fotos/videos/audios y embeds
│   └── paths.ts           # enlaces que respetan el `base`
├── pages/
│   ├── index.astro        # portada
│   └── calendar.astro     # calendario
└── styles/global.css      # tokens de diseño y estilos
public/media/              # fotos, videos y audios que sube el panel
tools/admin/               # el panel (no se publica)
```

## Deploy

Automático a GitHub Pages en cada push a `main` (`.github/workflows/deploy.yml`).
Alcanza con usar el botón **Publicar** del panel.

## Pendientes

Ver [`PENDIENTES.md`](./PENDIENTES.md) y la guía del panel en [`PANEL.md`](./PANEL.md).
