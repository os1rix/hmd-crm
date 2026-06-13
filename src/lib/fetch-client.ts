export async function fetchList<T>(url: string): Promise<T[]> {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function fetchJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data && typeof data === "object" && "error" in data) return fallback;
    return (data as T) ?? fallback;
  } catch {
    return fallback;
  }
}
