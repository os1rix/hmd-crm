type ApiErrorBody = {
  error?: string;
  details?: Record<string, string[] | undefined>;
};

export async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = (await res.json().catch(() => ({}))) as ApiErrorBody & T;

  if (!res.ok) {
    const detail = data.details
      ? Object.values(data.details).flat().filter(Boolean).join(", ")
      : "";
    throw new Error(detail || data.error || "Something went wrong");
  }

  return data;
}
