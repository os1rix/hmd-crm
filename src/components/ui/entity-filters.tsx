"use client";

export type FilterField = {
  key: string;
  label: string;
  type: "select" | "date";
  options?: Array<{ value: string; label: string }>;
};

export type FilterValues = Record<string, string>;

export function EntityFilters({
  fields,
  values,
  onChange,
  onClear,
}: {
  fields: FilterField[];
  values: FilterValues;
  onChange: (key: string, value: string) => void;
  onClear: () => void;
}) {
  const hasActive = Object.values(values).some((v) => v);

  return (
    <div className="mb-4 flex flex-wrap items-end gap-3 border border-border bg-surface p-3">
      {fields.map((field) => (
        <div key={field.key} className="min-w-[140px]">
          <label
            htmlFor={`filter-${field.key}`}
            className="mb-1 block text-[11px] uppercase tracking-wide text-section"
          >
            {field.label}
          </label>
          {field.type === "select" ? (
            <select
              id={`filter-${field.key}`}
              value={values[field.key] ?? ""}
              onChange={(e) => onChange(field.key, e.target.value)}
              className="w-full border border-border bg-background px-2 py-1.5 text-sm"
            >
              <option value="">All</option>
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              id={`filter-${field.key}`}
              type="date"
              value={values[field.key] ?? ""}
              onChange={(e) => onChange(field.key, e.target.value)}
              className="w-full border border-border bg-background px-2 py-1.5 text-sm"
            />
          )}
        </div>
      ))}
      {hasActive && (
        <button
          type="button"
          onClick={onClear}
          className="border border-border px-3 py-1.5 text-xs text-muted hover:text-foreground"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
