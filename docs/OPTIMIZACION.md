# Optimización del consumo de la API

Requisito (`docs/BRIEF.md`, sección de optimización): implementar **al
menos 2 medidas** para reducir/controlar el consumo de la API de clima
(Open-Meteo) y documentarlas con referencia al código.

Este proyecto implementa **tres** medidas: dos sobre la llamada a la API
y una sobre el renderizado del listado.

## 1. Timeout con fallback silencioso

**Dónde:** [`src/features/weather/openMeteo.client.ts:12`](../src/features/weather/openMeteo.client.ts#L12)
y [`:38-39`](../src/features/weather/openMeteo.client.ts#L38-L39).

```ts
const REQUEST_TIMEOUT_MS = 5000;
...
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
```

La petición a Open-Meteo se corta a los ~5 segundos usando
`AbortController`. Si la red está caída, el dispositivo está en modo
avión, o la API tarda demasiado, el `catch` de
[`openMeteo.client.ts:66-69`](../src/features/weather/openMeteo.client.ts#L66-L69)
captura el abort (o cualquier otro fallo de red) y devuelve `undefined` en
vez de propagar el error:

```ts
} catch {
  // Timeout (AbortController) o sin red: se guarda el avistamiento sin
  // clima en vez de bloquear el flujo o reintentar indefinidamente.
  return undefined;
}
```

**Por qué:** sin esto, una API lenta o caída dejaría el formulario de
registro colgado esperando una respuesta que nunca llega. Con el timeout,
el avistamiento se guarda igual (sin clima) y la app nunca queda
bloqueada ni en blanco. Cubierto por el test *"returns undefined instead
of throwing when there is no network"* en
[`openMeteo.client.test.ts:66-72`](../src/features/weather/openMeteo.client.test.ts#L66-L72).

**Cómo probarlo manualmente:** activar modo avión antes de registrar un
avistamiento y confirmar que el registro se guarda sin clima, sin demoras
largas ni pantallas congeladas.

## 2. Caché por ubicación redondeada

**Dónde:** [`openMeteo.client.ts:13, 22-26`](../src/features/weather/openMeteo.client.ts#L13)
y [`:32-36, 49, 64`](../src/features/weather/openMeteo.client.ts#L32-L36).

```ts
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, CacheEntry>();

function cacheKey(latitude: number, longitude: number): string {
  return `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
}
```

Las coordenadas se redondean a 2 decimales (~1.1 km de radio) para formar
la clave de caché. Si ya existe una respuesta reciente (TTL de 5 minutos)
para esa zona, se devuelve directamente sin llamar a la red:

```ts
const cached = cache.get(key);
if (cached && cached.expiresAt > Date.now()) {
  return cached.value;
}
```

**Por qué:** el usuario puede reintentar el guardado varias veces desde el
mismo lugar (por ejemplo, si corrige otro campo del formulario y vuelve a
enviar). Sin caché, cada intento dispararía una llamada nueva a
Open-Meteo aunque la ubicación y el clima no hayan cambiado. Cubierto por
los tests *"caches the result per rounded location and does not
re-fetch"* y *"does not use the cache for a meaningfully different
location"* en
[`openMeteo.client.test.ts:74-96`](../src/features/weather/openMeteo.client.test.ts#L74-L96).

**Cómo probarlo manualmente:** registrar dos avistamientos seguidos desde
la misma ubicación (sin moverse) y confirmar, con un log temporal en
`fetchCurrentWeather`, que el segundo no vuelve a golpear la API.

## 3. Renderizado eficiente del listado

**Dónde:** [`app/index.tsx:97-104`](../app/index.tsx#L97-L104) y
[`src/components/SightingCard.tsx:28-31`](../src/components/SightingCard.tsx#L28-L31).

```tsx
<FlatList
  data={visible}
  keyExtractor={(item) => item.id}
  contentContainerClassName="gap-3 pb-24"
  renderItem={({ item }) => (
    <SightingCard sighting={item} onPress={() => router.push(`/record/${item.id}`)} />
  )}
/>
```

El listado usa `FlatList` (que solo monta las filas visibles en pantalla,
a diferencia de un `.map()` dentro de un `ScrollView`) con `keyExtractor`
basado en el `id` real del avistamiento, evitando el re-render y
recálculo de claves por índice. Las miniaturas en `SightingCard` tienen
tamaño fijo (`h-16 w-16`, 64×64), por lo que el layout de cada fila no
cambia cuando la foto termina de decodificarse, evitando saltos y
re-cálculos de layout durante el scroll.

**Por qué:** no reduce llamadas a la API de clima directamente, pero es la
medida de optimización de rendimiento (evitar trabajo innecesario de
render) equivalente al resto de las medidas, y mantiene el listado fluido
a medida que crece el número de avistamientos guardados.

**Cómo probarlo manualmente:** registrar ~20 avistamientos y hacer scroll
en el listado, verificando que se mantiene fluido y sin saltos de layout
al cargar las fotos.
