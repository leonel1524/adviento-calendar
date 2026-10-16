# Pendientes

Estado del proyecto y cosas por hacer. Lo de arriba es lo más importante.

## 1. Contenido de los días (lo que falta para que el regalo esté completo)

- [ ] Escribir el contenido de los **días 4 a 19** en `src/data/days.ts` (las 16 ideas de la nota de Keep).
- [ ] Decidir qué va en los **días 20 a 24** (falta definirlos).
- [ ] Revisar los días 1 a 3 ya escritos y sus bloques de contenido.

## 2. Ofuscar el contenido: moverlo a un servicio externo

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

## 3. Detalles menores

- [ ] Decidir qué hacer con `src/assets/sleigh2.png` (imagen de trineo descartada, hoy sin uso).
- [ ] Borrar `src/assets/astro.svg` y `src/assets/background.svg` si no se usan.
- [ ] Verificar cómo se ve todo en un celular real (el diseño es responsive, pero no se probó en dispositivo).
- [ ] (Opcional) Dominio propio en GitHub Pages.
- [ ] (Opcional) Volver el repo **privado** otra vez. Ojo: con GitHub Pages en plan free no se
      puede, así que habría que pasar a Netlify/Vercel, que sí permiten repo privado.

## Notas de comportamiento actual

- **Desbloqueo**: cada día se abre a las **9:00 a.m. hora de Venezuela** (VET, UTC-4) del día
  que le corresponde en diciembre de 2026. Se calcula como un instante UTC fijo
  (`src/lib/gating.ts`), así que es igual sin importar desde qué país se visite.
- **Modo prueba**: `?unlock=all` desbloquea los 24 días y muestra un banner. Sirve para
  revisar el diseño de las cajitas sin esperar a diciembre.
- **Progreso**: los días abiertos se guardan en `localStorage` (es por navegador, no por cuenta).
- **Deploy**: automático a GitHub Pages en cada push a `main`.
  URL: https://leonel1524.github.io/adviento-calendar/
