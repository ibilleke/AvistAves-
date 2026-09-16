# Optimización del consumo de la API

Requisito (`docs/BRIEF.md`, sección de optimización): implementar **al
menos 2 medidas** para reducir/controlar el consumo de la API de clima
(Open-Meteo) y documentarlas con referencia al código.

Este proyecto implementa **cuatro** medidas: tres sobre la llamada a la
API y una sobre el renderizado del listado.

## 1. Timeout con fallback silencioso

**Dónde:** [`src/features/weather/openMeteo.client.ts:12`](../src/features/weather/openMeteo.client.ts#L12)
y [`:39-40`](../src/features/weather/openMeteo.client.ts#L39-L40).

```ts
const REQUEST_TIMEOUT_MS = 5000;
...
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
```

La petición a Open-Meteo se corta a los ~5 segundos usando
`AbortController`. Si la API tarda demasiado, `requestOnce` lanza un
`AbortError` que `fetchCurrentWeather` reconoce explícitamente para **no**
reintentar (ver medida 2) y devolver `undefined` de inmediato en vez de
propagar el error o dejar la UI esperando:

```ts
const isTimeout = error instanceof Error && error.name === 'AbortError';
if (isTimeout || isLastAttempt) {
  return undefined;
}
```

**Por qué:** sin esto, una API lenta o caída dejaría el formulario de
registro colgado esperando una respuesta que nunca llega. Con el timeout,
el avistamiento se guarda igual (sin clima) y la app nunca queda
bloqueada ni en blanco. Cubierto por el test *"does not retry after an
abort/timeout"* en
[`openMeteo.client.test.ts`](../src/features/weather/openMeteo.client.test.ts).

**Cómo probarlo manualmente:** activar modo avión antes de registrar un
avistamiento y confirmar que el registro se guarda sin clima, sin demoras
largas ni pantallas congeladas.

## 2. Reintento con backoff ante fallos de red transitorios

**Dónde:** [`openMeteo.client.ts:14-15, 82-99`](../src/features/weather/openMeteo.client.ts#L82-L99).

```ts
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 300;
...
for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
  try {
    return await requestOnce(latitude, longitude, key);
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    const isLastAttempt = attempt === MAX_ATTEMPTS;
    if (isTimeout || isLastAttempt) {
      return undefined;
    }
    await wait(RETRY_DELAY_MS * attempt);
  }
}
```

Un fallo de red puntual (por ejemplo, una petición DNS que falla una sola
vez) dispara **un** reintento tras una espera corta, en vez de rendirse
inmediatamente. Deliberadamente **no** se reintenta cuando el fallo es un
timeout (`AbortError`): si la API ya tardó 5 segundos, duplicar la espera
no vale la pena y se prioriza no bloquear el guardado. Tampoco se
reintenta una respuesta HTTP no-ok (4xx/5xx), ya que eso es una respuesta
válida de la API, no un problema de red transitorio. El resultado fallido
no se cachea, para que un intento posterior (con red ya recuperada)
vuelva a golpear la API en vez de quedar "atrapado" con el fallo por el
TTL de la caché.

**Por qué:** las redes móviles tienen fallos intermitentes de un solo
paquete; sin reintento, cualquier hipo de red deja el avistamiento sin
clima aunque la red esté disponible un instante después. Cubierto por los
tests *"retries once after a transient network failure and uses the
second attempt"* y *"does not retry after an abort/timeout"* en
[`openMeteo.client.test.ts`](../src/features/weather/openMeteo.client.test.ts).

**Cómo probarlo manualmente:** difícil de forzar manualmente (requiere un
fallo de red de un solo intento); se verifica con los tests unitarios
mencionados, que simulan el fallo con un mock de `fetch`.

## 3. Caché por ubicación redondeada

**Dónde:** [`openMeteo.client.ts:13, 24-28`](../src/features/weather/openMeteo.client.ts#L13)
y [`:76-80, 50, 65`](../src/features/weather/openMeteo.client.ts#L76-L80).

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

## 4. Renderizado eficiente del listado

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
