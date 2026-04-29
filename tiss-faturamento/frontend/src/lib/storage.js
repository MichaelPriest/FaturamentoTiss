const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json'
};

export async function getStorageItem(key, fallback = []) {
  if (!hasSupabase) {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/app_storage?storage_key=eq.${encodeURIComponent(key)}&select=storage_value`, {
    headers
  });

  if (!response.ok) {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  }

  const data = await response.json();
  if (!data.length) return fallback;
  return data[0].storage_value ?? fallback;
}

export async function setStorageItem(key, value) {
  localStorage.setItem(key, JSON.stringify(value));

  if (!hasSupabase) return;

  await fetch(`${SUPABASE_URL}/rest/v1/app_storage`, {
    method: 'POST',
    headers: {
      ...headers,
      Prefer: 'resolution=merge-duplicates'
    },
    body: JSON.stringify({ storage_key: key, storage_value: value })
  });
}

export function isSupabaseEnabled() {
  return hasSupabase;
}
