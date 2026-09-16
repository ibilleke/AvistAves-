# Tareas — Plan de construcción progresivo

Este documento organiza el desarrollo en fases pequeñas y testeables.
Cada fase debe dejar la app corriendo en Expo Go y con algo concreto para
verificar antes de pasar a la siguiente. Basado en `docs/BRIEF.md` y
`docs/STACK.md`, que siguen el enunciado oficial del examen.

**Entrega: jueves 17 de septiembre 2026, 23:59.** Priorizar en este orden
si falta tiempo: RF-01 a RF-06 funcionando de punta a punta > informe >
optimización de API > pulido visual.

## Fase 0 — Setup del proyecto y repositorio

- [x] Crear proyecto con Expo (SDK 54) + TypeScript usando pnpm.
- [x] Configurar Expo Router (estructura `app/`).
- [x] Instalar y configurar NativeWind (Tailwind).
- [ ] `git init`, primer commit, crear repositorio **público** en GitHub y
      hacer push.
- [x] Crear `README.md` con: qué es la app, cómo correrla (pnpm install,
      pnpm start), stack usado.
- [x] Configurar ESLint/Prettier básicos (opcional pero recomendado).

**Cómo probarlo:** `pnpm start`, abrir en Expo Go y ver una pantalla en
blanco/placeholder con al menos una clase de NativeWind aplicada. El repo
es visible públicamente en GitHub.

## Fase 1 — Navegación base (3 pantallas, RF-06)

- [x] Crear layout raíz (`app/_layout.tsx`).
- [x] Crear `app/index.tsx` (Listado, vacío por ahora) como pantalla
      principal.
- [x] Crear `app/new-record.tsx` (Registro, vacío por ahora).
- [x] Crear `app/record/[id].tsx` (Detalle, vacío por ahora).
- [x] Botón en el listado para ir a "Nuevo avistamiento".

**Cómo probarlo:** Navegar Listado → Registro → volver, y confirmar que
existe una ruta de Listado → Detalle (aunque sea con un id mock), sin
quedar atrapado en ninguna vista (botón atrás siempre funciona).

## Fase 2 — Modelo de datos y persistencia local (RF-05)

- [x] Definir el tipo `BirdSighting` (`src/features/sightings/types.ts`)
      tal como está en `docs/STACK.md` (incluye `count`, `observedAt`,
      `weather` opcional).
- [x] Implementar wrapper de AsyncStorage (`src/lib/storage.ts`).
- [x] Implementar `sightings.repository.ts` (`getAll`, `create`,
      `getById`). (Sin seed hardcodeado: se probó directamente con el
      formulario real de la Fase 3, más rápido que una pantalla de
      prueba descartable.)

**Cómo probarlo:** Desde una pantalla de prueba, llamar `create()` con un
registro de ejemplo y `getAll()` para listarlo por consola. Cerrar y
reabrir la app: el dato debe persistir.

## Fase 3 — Formulario de registro sin cámara/ubicación/clima (RF-01 parcial)

- [x] Formulario con: nombre del ave (texto libre), cantidad de ejemplares
      (numérico, mínimo 1), fecha/hora (prellenada con la actual,
      editable), notas opcionales.
- [x] Validación: sin nombre de ave o cantidad inválida, mostrar mensaje
      claro (foto/ubicación se validan en la Fase 6 cuando existan).
- [x] Al guardar, crear un `BirdSighting` con foto/ubicación "mock"
      (placeholders) vía `sightings.repository.create()`.
- [x] Al guardar con éxito, confirmar y volver al listado.

**Cómo probarlo:** Crear un registro desde el formulario y verificar que
aparece luego en un listado simple (aunque sea texto plano).

## Fase 4 — Listado real (RF-03)

- [x] Pantalla Listado (`app/index.tsx`): todos los `BirdSighting`,
      ordenados del más reciente al más antiguo.
- [x] Cada card: miniatura de foto, nombre del ave, fecha, temperatura (o
      indicador "sin clima").
- [x] Un filtro o un ordenamiento a elección (por fecha, por nombre del
      ave o por cantidad).
- [x] Estado vacío diseñado (mensaje + botón a "Nuevo avistamiento").
- [x] Botón/acceso directo al formulario de registro.

**Cómo probarlo:** Vaciar el storage y confirmar el estado vacío. Crear
varios registros y confirmar orden, filtro/orden elegido, y que el estado
vacío desaparece.

## Fase 5 — Detalle de un avistamiento (RF-04 parcial)

- [x] Ruta dinámica `app/record/[id].tsx`.
- [x] Mostrar todos los campos del registro (foto grande, nombre, cantidad,
      fecha/hora, notas).
- [x] Navegación desde las cards del Listado al Detalle, y vuelta atrás
      sin quedar atrapado.

**Cómo probarlo:** Tocar una card y verificar que se muestra el detalle
correcto según el `id`.

## Fase 6 — Integración de cámara (expo-camera, RF-01)

- [x] Solicitar permiso de cámara con explicación de para qué se usa.
- [x] Pantalla/flujo para tomar foto desde "Nuevo avistamiento" (sin
      opción de elegir de galería).
- [x] Guardar la URI de la foto en el `BirdSighting` (reemplaza el
      placeholder de la Fase 3).
- [x] Validar: sin foto no se guarda el registro (mensaje claro).
- [x] Mostrar la foto real en el detalle y en las cards (thumbnail).
- [x] Manejar el caso de permiso denegado sin romper la app.

**Cómo probarlo:** Tomar una foto real al crear un registro y verla
reflejada en el listado y en el detalle. Denegar el permiso y confirmar
que la app sigue usable con un mensaje claro.

## Fase 7 — Integración de ubicación (expo-location, RF-01 + RF-04)

- [x] Solicitar permiso de ubicación con explicación de para qué se usa.
- [x] Obtener lat/long automáticamente al abrir el formulario (o con botón
      dedicado), reemplazando el placeholder.
- [x] Validar: sin ubicación no se guarda el registro (mensaje claro).
- [x] En el Detalle, convertir lat/long a dirección legible con
      `reverseGeocodeAsync` (obligatorio — mostrar solo coordenadas no
      cumple RF-04). Si falla, mostrar un indicador claro.
- [x] Manejar el caso de permiso denegado sin romper la app.

**Cómo probarlo:** Crear un registro en distintos lugares (o simulando
ubicación en el emulador) y confirmar que las coordenadas y la dirección
legible en el detalle corresponden. Denegar el permiso y confirmar
comportamiento correcto.

## Fase 8 — Integración de clima (Open-Meteo, RF-02)

- [x] Cliente HTTP a Open-Meteo (`weather/openMeteo.client.ts`) usando el
      parámetro `current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`.
- [x] Al crear un registro, usar lat/long obtenidas para consultar clima
      actual y guardarlo (reemplaza el placeholder de clima).
- [x] Mapear `weather_code` a descripción + ícono legible
      (`weather.mapper.ts`).
- [x] Guardar y mostrar mínimo temperatura + condición + humedad relativa
      (tercer dato elegido).
- [x] Manejar el caso de fallo de red: el registro se guarda igual, sin
      clima, sin bloquear el flujo.
- [x] Mostrar en el Listado el indicador de "sin clima" cuando corresponda,
      y en el Detalle el clima de forma legible (nunca el código crudo).

**Cómo probarlo:** Crear un registro con conexión a internet y verificar
que el clima mostrado coincide razonablemente con el clima real del
lugar/momento. Probar también sin internet (modo avión) y confirmar que
el registro se guarda igual, sin clima, sin que la app se congele.

## Fase 9 — Optimización de la API

- [x] Implementar timeout (`AbortController`, ~5s) en la llamada a
      Open-Meteo con fallback silencioso a "sin clima".
- [x] Implementar caché por ubicación redondeada (memoria o AsyncStorage
      con TTL corto) para evitar consultas repetidas desde el mismo lugar.
- [x] (Si alcanza el tiempo) Revisar que el `FlatList` del listado use
      `keyExtractor` y miniaturas de tamaño fijo.
- [x] Anotar en un borrador (para el informe) qué medidas se implementaron
      y con qué archivo/línea de código se respaldan. (`docs/OPTIMIZACION.md`)

**Cómo probarlo:** Cortar la red a mitad de una consulta y confirmar que
el timeout actúa; repetir una consulta desde la misma ubicación y
confirmar (con logs) que se usa la caché en vez de golpear la API de
nuevo.

## Fase 10 — Pulido UI, estados y permisos

- [x] Estados de carga (loading) visibles durante cámara, GPS y consulta de
      clima — nunca una pantalla congelada.
- [x] Mensajes claros si se deniegan permisos de cámara/ubicación, con
      opción de reintentar.
- [x] Revisión general de estilos con NativeWind: contraste alto, botones
      grandes operables con una mano (diseño para terreno).

**Cómo probarlo:** Denegar permisos manualmente y verificar los mensajes;
confirmar que ninguna pantalla queda "congelada" sin feedback durante una
operación asíncrona.

## Fase 11 — Informe (34 puntos, no se programa, se escribe)

- [ ] Sección de arquitectura: cómo funciona Expo/React Native por dentro,
      qué rol cumple Expo (bridge/JSI, Expo Go, managed workflow),
      terminología correcta.
- [ ] Sección de 3 patrones de diseño presentes en el framework, cada uno
      con referencia concreta a archivo/línea del código propio (ej.
      Repository en `sightings.repository.ts`, Provider/Context si se usa,
      Hook personalizado como patrón, etc.). Sin ejemplos de código propio
      no hay puntaje completo.
- [ ] Sección de comparación con otros dos frameworks — **uno debe ser
      Ionic + Capacitor** (el no elegido) — con fortalezas y debilidades
      reales de cada uno (React Native, Ionic+Capacitor, y un tercero, ej.
      Flutter), no solo un listado de ventajas.
- [ ] Declaración de uso de IA: qué se usó y para qué.
- [ ] Demo grabada (video ≤3 min) o capturas/link, mostrando: registrar un
      avistamiento real con cámara y GPS en vivo, ver el listado, ver el
      detalle con clima y ubicación legible.
- [ ] Publicar el informe (Markdown en el repo, PDF, o video) y enlazarlo
      desde el `README.md`.

**Cómo probarlo:** Releer el informe como si fuera el docente: ¿cada
patrón de diseño apunta a una línea real del código? ¿la comparación tiene
fortalezas *y* debilidades de cada framework, no solo del elegido?

## Fase 12 — QA final

- [ ] Probar el flujo completo end-to-end en un dispositivo real vía
      Expo Go: crear un avistamiento con foto/ubicación/clima real, verlo
      en el Listado, abrir el Detalle.
- [ ] Revisar persistencia tras cerrar/reabrir la app (incluidas fotos).
- [ ] Revisar rendimiento del listado con varios registros (10-20+).
- [ ] Confirmar que el repo en GitHub es público y el README está
      actualizado con el link al informe/demo.

**Cómo probarlo:** Checklist manual del flujo completo, sin errores en
consola.

## Notas

- Cada fase debe commitearse por separado para poder revertir fácilmente
  si algo falla. Si la entrega es grupal, todos los integrantes deben
  aparecer en el historial de commits.
- No avanzar a integrar una API/hardware nuevo (cámara, ubicación, clima)
  hasta que el flujo con datos mock funcione end-to-end.
- No agregar usuarios, perfiles, feed comunitario ni backend: está fuera
  de alcance según el enunciado.
