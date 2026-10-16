# Panel para editar los días

Herramienta local para cambiar el contenido del calendario sin tocar código: títulos,
textos, fotos, videos y audios de cada día.

## Cómo abrirlo

```bash
npm run admin
```

Se abre en **http://localhost:4400** (comando `npm run admin`). El panel levanta solo una
vista previa del calendario, así que no hace falta arrancar nada más.

> El panel corre **únicamente en tu computadora** y nunca se publica: no forma parte del
> sitio que se sube a GitHub Pages. Podés cerrarlo con `Ctrl+C`.

## Qué podés hacer

- **Editar cada día**: título + bloques de contenido. Podés agregar, reordenar (↑ ↓),
  duplicar y borrar bloques.
- **Cuatro tipos de bloque**:
  | Tipo | Qué usa |
  |------|---------|
  | Texto | el mensaje del día |
  | Foto | un archivo o una URL, con descripción y pie de foto |
  | Video | un archivo propio **o un enlace de YouTube/Vimeo** |
  | Audio | un archivo o una URL, con etiqueta |
- **Subir archivos**: botón *Subir archivo* dentro de cada bloque. Los archivos se guardan
  en `public/media/` con un nombre limpio y el prefijo del día (ej. `dia-07-foto-familiar.jpg`).
- **Reutilizar**: la galería de abajo muestra lo ya subido; hacé clic en un archivo para
  usarlo en el bloque que tocaste por última vez.
- **Vista previa** en vivo (a la derecha) con **todos los días desbloqueados**.
- **Guardar** (`Cmd+S` también sirve): escribe `src/data/days.json`.
- **Publicar**: hace commit de lo que haya pendiente, lo sube a GitHub y el sitio se
  re-despliega solo en ~1 minuto.

## Cómo funcionan los archivos

Las rutas se guardan **sin barra inicial** y la barra del sitio se agrega sola:

```
media/nuestra-cancion.mp3   ->  se ve como /adviento-calendar/media/nuestra-cancion.mp3
https://youtu.be/XXXX       ->  se incrusta como video de YouTube
```

Por eso, si escribís la ruta a mano, usá `media/nombre.jpg` (no `/media/...`).

### Límites de GitHub (importante)

- **100 MB máximo por archivo** (el panel bloquea arriba de 95 MB).
- Avisa (pero permite) desde los **50 MB**.
- Para **videos largos** conviene subirlos a **YouTube como "no listado"** y pegar el
  enlace en el bloque de video: el panel lo incrusta solo y el repo queda liviano.

## Publicar

El botón **Publicar** hace, sobre todo el repo:

```bash
git add -A            # incluye los archivos nuevos de public/media/
git commit -m "…"     # usa tu mensaje, o uno automático
git push              # dispara el deploy de GitHub Pages
```

El resultado se muestra en pantalla. Si el `push` falla (sin internet o sin permisos),
el commit queda hecho igual y podés reintentar.

## Dónde vive el contenido

- `src/data/days.json` → el contenido (lo que edita el panel).
- `src/data/days.ts` → los tipos y una **validación**: si algo está mal, el build falla
  con un mensaje claro en vez de mostrar una cajita vacía.

## Ojo con el secreto del regalo

El sitio es estático y el repo es **público**, así que el contenido de los 24 días está
en el código (visible para quien mire la fuente). Si querés que no se pueda espiar,
mirá el punto 2 de `PENDIENTES.md`.
