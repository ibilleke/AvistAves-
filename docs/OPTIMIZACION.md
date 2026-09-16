# Borrador — Optimización del consumo de la API (Fase 9)

Insumo para la sección de optimización del informe (Fase 11). Medidas
implementadas en `src/features/weather/openMeteo.client.ts`:

## 1. Timeout con `AbortController` + fallback silencioso

- **Dónde:** `openMeteo.client.ts:38-39` (se crea el `AbortController` y se
  programa `controller.abort()` a los 5000 ms) y `:47` (se pasa
  `signal: controller.signal` a `fetch`).
- **Qué evita:** que una consulta colgada bloquee el guardado del
  avistamiento. Si expira el timeout o falla la red, el `catch` de la
  línea 66-69 devuelve `undefined` y el registro se guarda igual, sin
  clima (ver `app/new-record.tsx`, que nunca bloquea `handleSave` por el
  estado del clima).

## 2. Caché en memoria por ubicación redondeada

- **Dónde:** `openMeteo.client.ts:15-26` (tipo `CacheEntry`, `Map` de
  caché, función `cacheKey` que redondea lat/long a 2 decimales) y
  `:32-36` (lectura de caché antes de golpear la red) + `:49` y `:64`
  (escritura de caché tras la respuesta).
- **TTL:** 5 minutos (`CACHE_TTL_MS`, línea 13).
- **Qué evita:** reconsultar Open-Meteo si el usuario reintenta el
  guardado (por ejemplo tras corregir un error de validación) estando en
  la misma ubicación aproximada (~1.1 km, por el redondeo a 2 decimales).

## 3. Renderizado eficiente del listado (opcional, también implementado)

- **Dónde:** `app/index.tsx` — `FlatList` con `keyExtractor={(item) =>
  item.id}` y miniaturas de tamaño fijo (`h-16 w-16` en
  `src/components/SightingCard.tsx`).

## Cómo se probó

- Cortando la red a mitad de una consulta (modo avión): el timeout actúa
  a los ~5s y el registro se guarda sin clima.
- Repitiendo el guardado desde la misma ubicación dentro de la ventana de
  5 minutos: no se observa una segunda request de red (se sirve desde la
  caché en memoria).
