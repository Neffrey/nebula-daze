"use client";

import type { ReactNode } from "react";

export type ToggleOption<T extends string> = {
  value: T;
  label: string;
  swatch?: ReactNode;
};

export default function ToggleGroup<T extends string>({
  label,
  options,
  selected,
  onChange,
  empty,
}: {
  label: string;
  options: readonly ToggleOption<T>[];
  selected: readonly T[];
  onChange: (selected: T[]) => void;
  empty?: string;
}) {
  return (
    <fieldset>
      <legend className="text-[11px] tracking-[0.16em] uppercase">{label}</legend>
      {options.length === 0 ? (
        empty !== undefined ? <p className="mt-2 text-sm text-muted">{empty}</p> : null
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {options.map((option) => {
            const on = selected.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  onChange(
                    on
                      ? selected.filter((value) => value !== option.value)
                      : [...selected, option.value],
                  )
                }
                className={`flex items-center gap-2 border px-3 py-2 text-sm ${
                  on ? "border-foreground" : "border-foreground/20 text-muted"
                }`}
              >
                {option.swatch}
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
