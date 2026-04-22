const SYNC_FILE_NAME = 'li-calendar-data.json';

export interface SyncData {
  version: number;
  lastModified: string;
  data: {
    weatherEnabled: boolean;
    weatherApiKey: string;
    defaultCity: unknown;
    additionalCities: unknown[];
    todos: unknown[];
    schedules: unknown[];
    birthdays: unknown[];
    todoVisible: boolean;
    scheduleVisible: boolean;
    birthdayVisible: boolean;
  };
}

function getHeaders(username: string, password: string): Record<string, string> {
  const credentials = btoa(`${username}:${password}`);
  return {
    Authorization: `Basic ${credentials}`,
    'Content-Type': 'application/json',
  };
}

export async function testWebDAVConnection(
  url: string,
  username: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const testUrl = url.endsWith('/') ? `${url}${SYNC_FILE_NAME}` : `${url}/${SYNC_FILE_NAME}`;
    const response = await fetch(testUrl, {
      method: 'HEAD',
      headers: getHeaders(username, password),
    });
    if (response.ok || response.status === 404) {
      return { success: true };
    }
    return { success: false, error: `HTTP ${response.status}` };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function uploadToWebDAV(
  url: string,
  username: string,
  password: string,
  data: SyncData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const fileUrl = url.endsWith('/') ? `${url}${SYNC_FILE_NAME}` : `${url}/${SYNC_FILE_NAME}`;
    const body = JSON.stringify(data, null, 2);

    const response = await fetch(fileUrl, {
      method: 'PUT',
      headers: getHeaders(username, password),
      body,
    });

    if (response.ok || response.status === 201) {
      return { success: true };
    }

    return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function downloadFromWebDAV(
  url: string,
  username: string,
  password: string,
): Promise<{ success: boolean; data?: SyncData; error?: string }> {
  try {
    const fileUrl = url.endsWith('/') ? `${url}${SYNC_FILE_NAME}` : `${url}/${SYNC_FILE_NAME}`;
    const response = await fetch(fileUrl, {
      method: 'GET',
      headers: getHeaders(username, password),
    });

    if (response.status === 404) {
      return { success: true, data: undefined };
    }

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const text = await response.text();
    try {
      const data = JSON.parse(text) as SyncData;
      return { success: true, data };
    } catch {
      return { success: false, error: '数据格式无效' };
    }
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
