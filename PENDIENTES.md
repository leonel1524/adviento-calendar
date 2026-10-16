# Pendientes

Estado del proyecto y cosas por hacer. Lo de arriba es lo más importante.

## 1. Contenido de los días

- [x] Los **24 días ya tienen contenido** (título + un bloque de texto) en `src/data/days.json`.
- [ ] **Agregar fotos y videos** a los días que lo pidan, con el panel: `npm run admin` (ver `PANEL.md`).
- [ ] Revisar los textos y ajustar lo que haga falta (son los que están en la nota de Keep).
- [ ] Decidir si los días 20 a 24 llevan algo especial (hoy tienen el mismo formato que el resto).

## 2. Panel de administración: hecho ✅

- [x] Panel local para editar el contenido sin tocar código (`npm run admin`). No se publica.
- [x] Subida de archivos a `public/media/`, embeds de YouTube/Vimeo y vista previa en vivo.
- [x] Botón **Publicar** (commit + push) que dispara el deploy.
- [x] El contenido pasó de `src/data/days.ts` a `src/data/days.json` (con validación al construir).

## 3. Ofuscar el contenido: moverlo a un servicio externo

Hoy el gating (que un día esté bloqueado o no) se resuelve **en el navegador**, así que el
contenido de **los 24 días viaja completo en el HTML** de `/calendar/`. Cualquiera puede
abrir el código fuente (o el inspector → Network) y leer todos los días por adelantado.

Opciones para que no se pueda espiar el regalo:

- [ ] **Supabase / Firebase**: guardar el contenido en una tabla y leerlo solo si el día ya
      está desbloqueado. La seguridad real se haría con Row Level Security, comparando la
      fecha del servidor.
- [ ] **Función serverless** (Netlify/Vercel/Cloudflare Function) que reciba el número de día
      y devuelva el contenido **solo si la fecha del servidor ya pasó** (así la validación
      es del lado del servidor y no se puede falsear cambiando el reloj del navegador).
- [ ] **Ofuscación ligera** (menos seguro, pero sin infraestructura): cifrar el JSON con una
      clave y descifrarlo en el cliente según la fecha. Frena al curioso promedio, pero no a
      alguien técnico.
- [ ] Cualquiera de estas opciones además **arregla otro detalle**: hoy se puede engañar el
      desbloqueo cambiando la hora del sistema (o el reloj del navegador).

## 4. Detalles menores

- [ ] Decidir qué hacer con `src/assets/sleigh2.png` (imagen de trineo descartada, hoy sin uso).
- [ ] Borrar `src/assets/astro.svg` y `src/assets/background.svg` si no se usan.
- [ ] Verificar cómo se ve todo en un celular real (el diseño es responsive, pero no se probó en dispositivo).
- [ ] (Opcional) Dominio propio en GitHub Pages.
- [ ] (Opcional) Volver el repo **privado** otra vez. Ojo: con GitHub Pages en plan free no se
      puede, así que habría que pasar a Netlify/Vercel, que sí permiten repo privado.

## Notas de comportamiento actual

- **Panel**: `npm run admin` abre el editor local en http://localhost:4400 (ver `PANEL.md`).
- **Contenido**: vive en `src/data/days.json`. El panel lo lee y lo escribe; `src/data/days.ts`
  lo valida y lo expone tipado.
- **Medios**: los archivos van en `public/media/` y se referencian como `media/nombre.jpg`
  (la barra del `base` la agrega `src/lib/media.ts`). Los enlaces de YouTube/Vimeo se incrustan
  con `iframe`; los archivos propios se reproducen con `<video>`/`<audio>`.
- **Desbloqueo**: cada día se abre a las **9:00 a.m. hora de Venezuela** (VET, UTC-4) del día
  que le corresponde en diciembre de 2026. Se calcula como un instante UTC fijo
  (`src/lib/gating.ts`), así que es igual sin importar desde qué país se visite.
- **Modo prueba**: `?unlock=all` desbloquea los 24 días y muestra un banner. Sirve para
  revisar el diseño de las cajitas sin esperar a diciembre.
- **Progreso**: los días abiertos se guardan en `localStorage` (es por navegador, no por cuenta).
- **Deploy**: automático a GitHub Pages en cada push a `main`.
  URL: https://leonel1524.github.io/adviento-calendar/
