const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 3000;
const FAILURE_CACHE_TTL_MS = 30 * 1000;

function normalizeCep(value) {
  const cep = String(value ?? '').replace(/\D/g, '');
  return cep.length === 8 ? cep : null;
}

function validCoordinates(latitude, longitude) {
  return Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= -90
    && latitude <= 90
    && longitude >= -180
    && longitude <= 180;
}

export function coordinatesFromResponse(data) {
  const rawLatitude = data?.location?.coordinates?.latitude;
  const rawLongitude = data?.location?.coordinates?.longitude;
  if ([rawLatitude, rawLongitude].some((value) => value === null || value === undefined || String(value).trim() === '')) return null;
  const latitude = Number(rawLatitude);
  const longitude = Number(rawLongitude);
  return validCoordinates(latitude, longitude) ? { latitude, longitude } : null;
}

async function requestCoordinates(cep, fetcher) {
  const providers = [
    { url: `https://brasilapi.com.br/api/cep/v2/${cep}`, parse: coordinatesFromResponse },
    { url: `https://cep.awesomeapi.com.br/json/${cep}`, parse: data => coordinatesFromResponse({ location: { coordinates: { latitude: data?.lat, longitude: data?.lng } } }) },
  ];
  for (const provider of providers) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetcher(provider.url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      if (!response.ok) continue;
      const data = await response.json();
      if (data?.cep && normalizeCep(data.cep) !== cep) continue;
      const coordinates = provider.parse(data);
      if (coordinates) return coordinates;
    } catch {
      // Try the next provider on timeouts, network errors or malformed responses.
    } finally {
      clearTimeout(timeout);
    }
  }
  return null;
}

export function createCepGeocoder({ fetcher = fetch, now = Date.now } = {}) {
  const cache = new Map();
  const pendingRequests = new Map();
  return async function geocode(value) {
    const cep = normalizeCep(value);
    if (!cep) return null;

    const cached = cache.get(cep);
    if (cached && cached.expiresAt > now()) return cached.coordinates;
    if (pendingRequests.has(cep)) return pendingRequests.get(cep);

    const request = requestCoordinates(cep, fetcher)
      .then((coordinates) => {
        cache.set(cep, { coordinates, expiresAt: now() + (coordinates ? CACHE_TTL_MS : FAILURE_CACHE_TTL_MS) });
        return coordinates;
      })
      .finally(() => pendingRequests.delete(cep));
    pendingRequests.set(cep, request);
    return request;
  };
}

export const coordinatesByCep = createCepGeocoder();

export function calculateDistanceKm(origin, destination) {
  const earthRadiusKm = 6371.0088;
  const toRadians = (degrees) => degrees * Math.PI / 180;
  const latitudeDelta = toRadians(destination.latitude - origin.latitude);
  const longitudeDelta = toRadians(destination.longitude - origin.longitude);
  const originLatitude = toRadians(origin.latitude);
  const destinationLatitude = toRadians(destination.latitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(originLatitude) * Math.cos(destinationLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}
