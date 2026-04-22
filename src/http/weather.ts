import type { WeatherCity } from '../sync/type/configTypes.ts';

export interface WeatherNow {
  temp: string;
  feelsLike: string;
  humidity: string;
  text: string;
  windDir: string;
  windScale: string;
  icon: string;
}

export interface WeatherAirQuality {
  aqi: string;
  category: string;
}

export interface WeatherInfo {
  city: WeatherCity;
  now: WeatherNow | null;
  airQuality: WeatherAirQuality | null;
  updateTime: string;
}

const HEWEATHER_API_BASE = 'https://devapi.qweather.com/v7';
const GEOLOCATION_API_BASE = 'https://geoapi.qweather.com/v2';

async function httpGet<T>(url: string, params: Record<string, string>): Promise<T> {
  const urlObj = new URL(url);
  Object.entries(params).forEach(([key, value]) => {
    urlObj.searchParams.append(key, value);
  });
  const response = await fetch(urlObj.toString(), {
    headers: {
      Accept: 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export async function searchCities(keyword: string, apiKey: string): Promise<WeatherCity[]> {
  if (!keyword || !apiKey) return [];
  try {
    const data = await httpGet<{
      location: Array<{ id: string; name: string; adm2: string; country: string }>;
    }>(`${GEOLOCATION_API_BASE}/city/lookup`, { location: keyword, key: apiKey, range: 'world' });
    return data.location.map((item) => ({
      id: item.id,
      name: item.name,
      cityCode: item.id,
    }));
  } catch {
    return [];
  }
}

export async function fetchWeatherNow(
  cityCode: string,
  apiKey: string,
): Promise<WeatherNow | null> {
  if (!cityCode || !apiKey) return null;
  try {
    const data = await httpGet<{ now: WeatherNow }>(`${HEWEATHER_API_BASE}/weather/now`, {
      location: cityCode,
      key: apiKey,
    });
    return data.now;
  } catch {
    return null;
  }
}

export async function fetchAirQuality(
  cityCode: string,
  apiKey: string,
): Promise<WeatherAirQuality | null> {
  if (!cityCode || !apiKey) return null;
  try {
    const data = await httpGet<{ now: WeatherAirQuality }>(`${HEWEATHER_API_BASE}/air/now`, {
      location: cityCode,
      key: apiKey,
    });
    return data.now;
  } catch {
    return null;
  }
}

export async function fetchWeatherInfo(city: WeatherCity, apiKey: string): Promise<WeatherInfo> {
  const [now, airQuality] = await Promise.all([
    fetchWeatherNow(city.cityCode, apiKey),
    fetchAirQuality(city.cityCode, apiKey),
  ]);
  return {
    city,
    now,
    airQuality,
    updateTime: now ? new Date().toLocaleString() : '',
  };
}
