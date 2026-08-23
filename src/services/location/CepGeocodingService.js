const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 6000;
const cache = new Map();
const pendingRequests = new Map();

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

async function requestCoordinates(cep) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const data = await response.json();
    const latitude = Number(data?.location?.coordinates?.latitude);
    const longitude = Number(data?.location?.coordinates?.longitude);
    return validCoordinates(latitude, longitude) ? { latitude, longitude } : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function coordinatesByCep(value) {
  const cep = normalizeCep(value);
  if (!cep) return null;

  const cached = cache.get(cep);
  if (cached && cached.expiresAt > Date.now()) return cached.coordinates;
  if (pendingRequests.has(cep)) return pendingRequests.get(cep);

  const request = requestCoordinates(cep)
    .then((coordinates) => {
      cache.set(cep, { coordinates, expiresAt: Date.now() + CACHE_TTL_MS });
      return coordinates;
    })
    .finally(() => pendingRequests.delete(cep));
  pendingRequests.set(cep, request);
  return request;
}

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
