const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json'
};

const toJson = (value) => JSON.stringify(value);
const fromJson = (value, fallback) => {
  if (value === null || value === undefined) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

async function fetchFromSupabase(key, fallback = null) {
  if (!hasSupabase) return fallback;

  const response = await fetch(`${SUPABASE_URL}/rest/v1/app_storage?storage_key=eq.${encodeURIComponent(key)}&select=storage_value`, { headers });
  if (!response.ok) return fallback;

  const data = await response.json();
  return data[0]?.storage_value ?? fallback;
}

async function pushToSupabase(key, value) {
  if (!hasSupabase) return;

  await fetch(`${SUPABASE_URL}/rest/v1/app_storage`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ storage_key: key, storage_value: value })
  });
}

export async function getStorageItem(key, fallback = []) {
  const remote = await fetchFromSupabase(key, null);
  if (remote !== null) {
    localStorage.setItem(key, toJson(remote));
    return remote;
  }
  return fromJson(localStorage.getItem(key), fallback);
}

export async function setStorageItem(key, value) {
  localStorage.setItem(key, toJson(value));
  await pushToSupabase(key, value);
}

export function setupSupabaseStorageBridge() {
  if (!hasSupabase) return;

  const originalSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = (key, value) => {
    originalSetItem(key, value);
    pushToSupabase(key, fromJson(value, value)).catch(() => null);
  };

  const originalGetItem = localStorage.getItem.bind(localStorage);
  localStorage.getItem = (key) => {
    fetchFromSupabase(key, null)
      .then((value) => {
        if (value !== null) originalSetItem(key, toJson(value));
      })
      .catch(() => null);

    return originalGetItem(key);
  };
}

export function isSupabaseEnabled() {
  return hasSupabase;
}
