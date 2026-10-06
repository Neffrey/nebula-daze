"use client";

import { KeyboardEvent, useEffect, useId, useRef, useState } from "react";

export type SelectOption<T extends string> = {
  value: T;
  label: string;
};

export default function Select<T extends string>({
  id,
  value,
  options,
  onChange,
  placeholder,
  disabled = false,
  compact = false,
  className = "",
}: {
  id: string;
  value: T | "";
  options: readonly SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const listId = useId();
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointerDown(event: PointerEvent) {
      if (root.current !== null && !root.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open && active >= 0) {
      list.current?.children[active]?.scrollIntoView({ block: "nearest" });
    }
  }, [open, active]);

  function show() {
    setActive(Math.max(0, options.findIndex((option) => option.value === value)));
    setOpen(true);
  }

  function choose(index: number) {
    const option = options[index];
    if (option !== undefined) {
      onChange(option.value);
    }
    setOpen(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled || options.length === 0) {
      return;
    }
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        show();
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(options.length - 1, index + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(0, index - 1));
    } else if (event.key === "Home") {
      event.preventDefault();
      setActive(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActive(options.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose(active);
    } else if (event.key === "Escape" || event.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div ref={root} className={`relative ${className}`}>
      <button
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
        className={`flex w-full items-center justify-between gap-3 border border-foreground/20 px-3 text-left ${
          compact ? "bg-transparent py-2" : "bg-background py-3"
        } text-sm tracking-normal normal-case outline-none focus-visible:border-foreground disabled:opacity-50`}
      >
        <span className={`truncate ${selected === undefined ? "text-muted" : ""}`}>
          {selected?.label ?? placeholder ?? ""}
        </span>
        <svg
          viewBox="0 0 16 16"
          aria-hidden="true"
          className={`size-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M3 6l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </button>
      {open ? (
        <ul
          ref={list}
          id={listId}
          role="listbox"
          className="absolute top-full right-0 left-0 z-20 -mt-px max-h-64 overflow-y-auto border border-foreground/20 bg-background py-1"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            return (
              <li
                key={option.value}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={isSelected}
                onPointerEnter={() => setActive(index)}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => choose(index)}
                className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm tracking-normal normal-case ${
                  index === active ? "bg-foreground/5" : ""
                }`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected ? (
                  <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3 shrink-0">
                    <path d="M3 8.5l3.5 3.5L13 4.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
