/** Extract JSON array or object from raw LLM text (handles markdown fences). */
export function parseAiJson<T = unknown>(text: string): T | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const tryParse = (raw: string): T | null => {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  };

  const direct = tryParse(trimmed);
  if (direct !== null) return direct;

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    const parsed = tryParse(fenced[1].trim());
    if (parsed !== null) return parsed;
  }

  const arrayStart = trimmed.indexOf("[");
  const arrayEnd = trimmed.lastIndexOf("]");
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    const parsed = tryParse(trimmed.slice(arrayStart, arrayEnd + 1));
    if (parsed !== null) return parsed;
  }

  const objectStart = trimmed.indexOf("{");
  const objectEnd = trimmed.lastIndexOf("}");
  if (objectStart >= 0 && objectEnd > objectStart) {
    const parsed = tryParse(trimmed.slice(objectStart, objectEnd + 1));
    if (parsed !== null) return parsed;
  }

  return null;
}
