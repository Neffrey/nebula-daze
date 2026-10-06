"use client";

import { useMutation, useQuery } from "convex/react";
import { FormEvent, useState } from "react";
import Select from "@/components/Select";
import { api } from "@/convex/_generated/api";

type OptionDraft<TId extends string> = {
  name: string;
  hex: string;
  hex2: string | null;
  parentId: TId | "";
};

type OptionRow<TId extends string> = {
  _id: TId;
  name: string;
  hex?: string;
  hex2?: string;
  parentId?: TId;
};

const fieldClass =
  "mt-2 block w-full border border-foreground/20 bg-transparent px-3 py-2 text-sm tracking-normal normal-case";
const buttonClass =
  "border border-foreground/20 px-3 py-2 text-[10px] tracking-[0.12em] uppercase disabled:opacity-40";

export function CategoryManager() {
  const rows = useQuery(api.categories.manageList);
  const create = useMutation(api.categories.create);
  const update = useMutation(api.categories.update);
  const remove = useMutation(api.categories.remove);

  return (
    <OptionManager
      noun="category"
      plural="categories"
      withParent
      rows={rows}
      onCreate={async ({ name, parentId }) => {
        await create({ name, parentId: parentId === "" ? undefined : parentId });
      }}
      onUpdate={async (categoryId, { name, parentId }) => {
        await update({ categoryId, name, parentId: parentId === "" ? undefined : parentId });
      }}
      onDelete={async (categoryId) => {
        await remove({ categoryId });
      }}
    />
  );
}

export function ColorManager() {
  const rows = useQuery(api.colors.manageList);
  const create = useMutation(api.colors.create);
  const update = useMutation(api.colors.update);

  return (
    <OptionManager
      noun="color"
      plural="colors"
      withHex
      rows={rows}
      onCreate={async ({ name, hex, hex2 }) => {
        await create({ name, hex, hex2: hex2 ?? undefined });
      }}
      onUpdate={async (colorId, { name, hex, hex2 }) => {
        await update({ colorId, name, hex, hex2: hex2 ?? undefined });
      }}
    />
  );
}

export function SizeManager() {
  const rows = useQuery(api.sizes.manageList);
  const create = useMutation(api.sizes.create);
  const update = useMutation(api.sizes.update);

  return (
    <OptionManager
      noun="size"
      plural="sizes"
      rows={rows}
      onCreate={async ({ name }) => {
        await create({ name });
      }}
      onUpdate={async (sizeId, { name }) => {
        await update({ sizeId, name });
      }}
    />
  );
}

function OptionManager<TId extends string>({
  noun,
  plural,
  withHex = false,
  withParent = false,
  rows,
  onCreate,
  onUpdate,
  onDelete,
}: {
  noun: string;
  plural: string;
  withHex?: boolean;
  withParent?: boolean;
  rows: OptionRow<TId>[] | undefined;
  onCreate: (draft: OptionDraft<TId>) => Promise<void>;
  onUpdate: (id: TId, draft: OptionDraft<TId>) => Promise<void>;
  onDelete?: (id: TId) => Promise<void>;
}) {
  const [editingId, setEditingId] = useState<TId | null>(null);

  if (rows === undefined) {
    return <p className="mt-8 text-sm text-muted">Loading</p>;
  }

  const names = new Map(rows.map((row) => [row._id, row.name]));
  const ordered = withParent ? treeOrder(rows) : rows.map((row) => ({ row, depth: 0 }));

  return (
    <div className="mt-10">
      <h2 className="text-[11px] tracking-[0.16em] uppercase">Add a {noun}</h2>
      <OptionForm
        idPrefix={`new-${noun}`}
        initial={{ name: "", hex: "#000000", hex2: null, parentId: "" }}
        withHex={withHex}
        parents={withParent ? rows : undefined}
        submitLabel={`Add ${noun}`}
        resetOnSubmit
        onSubmit={onCreate}
      />
      <h2 className="mt-12 text-[11px] tracking-[0.16em] uppercase">Current {plural}</h2>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No {plural} yet.</p>
      ) : (
        <ul className="mt-6 divide-y divide-foreground/10 border-t border-foreground/10">
          {ordered.map(({ row, depth }) => (
            <li key={row._id} className="py-6" style={{ paddingLeft: `${depth * 1.5}rem` }}>
              {editingId === row._id ? (
                <OptionForm
                  idPrefix={`edit-${row._id}`}
                  initial={{
                    name: row.name,
                    hex: row.hex ?? "#000000",
                    hex2: row.hex2 ?? null,
                    parentId: row.parentId ?? "",
                  }}
                  withHex={withHex}
                  parents={withParent ? withoutBranch(rows, row._id) : undefined}
                  submitLabel={`Save ${noun}`}
                  onCancel={() => setEditingId(null)}
                  onSubmit={async (draft) => {
                    await onUpdate(row._id, draft);
                    setEditingId(null);
                  }}
                />
              ) : (
                <OptionItem
                  row={row}
                  parentName={row.parentId === undefined ? undefined : names.get(row.parentId)}
                  onEdit={() => setEditingId(row._id)}
                  onDelete={onDelete === undefined ? undefined : () => onDelete(row._id)}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OptionItem<TId extends string>({
  row,
  parentName,
  onEdit,
  onDelete,
}: {
  row: OptionRow<TId>;
  parentName: string | undefined;
  onEdit: () => void;
  onDelete?: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function confirmDelete() {
    if (onDelete === undefined || deleting) {
      return;
    }
    setDeleting(true);
    setError(null);
    onDelete()
      .catch((deleteError: unknown) => {
        setError(deleteError instanceof Error ? deleteError.message : "Unable to delete");
        setConfirming(false);
      })
      .finally(() => {
        setDeleting(false);
      });
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        {row.hex !== undefined ? <Swatch hex={row.hex} hex2={row.hex2} /> : null}
        <div className="min-w-0 flex-1">
          <p className="font-display text-2xl leading-tight">{row.name}</p>
          {row.hex !== undefined ? (
            <p className="mt-1 text-sm text-muted">
              {row.hex2 === undefined ? row.hex : `${row.hex} / ${row.hex2}`}
            </p>
          ) : null}
          {parentName !== undefined ? <p className="mt-1 text-sm text-muted">In {parentName}</p> : null}
        </div>
        {confirming ? (
          <>
            <button type="button" disabled={deleting} onClick={confirmDelete} className={buttonClass}>
              {deleting ? "Deleting" : "Confirm delete"}
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={() => setConfirming(false)}
              className="text-[10px] tracking-[0.12em] uppercase underline underline-offset-4 disabled:opacity-40"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={onEdit} className={buttonClass}>
              Edit
            </button>
            {onDelete !== undefined ? (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setConfirming(true);
                }}
                className={buttonClass}
              >
                Delete
              </button>
            ) : null}
          </>
        )}
      </div>
      {error !== null ? <p className="mt-3 text-sm">{error}</p> : null}
    </div>
  );
}

function OptionForm<TId extends string>({
  idPrefix,
  initial,
  withHex,
  parents,
  submitLabel,
  resetOnSubmit = false,
  onCancel,
  onSubmit,
}: {
  idPrefix: string;
  initial: OptionDraft<TId>;
  withHex: boolean;
  parents?: OptionRow<TId>[];
  submitLabel: string;
  resetOnSubmit?: boolean;
  onCancel?: () => void;
  onSubmit: (draft: OptionDraft<TId>) => Promise<void>;
}) {
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) {
      return;
    }
    setSaving(true);
    setError(null);
    onSubmit(draft)
      .then(() => {
        if (resetOnSubmit) {
          setDraft(initial);
        }
      })
      .catch((submitError: unknown) => {
        setError(submitError instanceof Error ? submitError.message : "Unable to save");
      })
      .finally(() => {
        setSaving(false);
      });
  }

  return (
    <form onSubmit={submit} className="mt-6 grid gap-4">
      <label className="text-[11px] tracking-[0.16em] uppercase" htmlFor={`${idPrefix}-name`}>
        Name
        <input
          id={`${idPrefix}-name`}
          value={draft.name}
          onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
          className={fieldClass}
        />
      </label>
      {parents !== undefined ? (
        <div>
          <label className="text-[11px] tracking-[0.16em] uppercase" htmlFor={`${idPrefix}-parent`}>
            Parent category
          </label>
          <Select<TId | "none">
            id={`${idPrefix}-parent`}
            className="mt-2"
            compact
            value={draft.parentId === "" ? "none" : draft.parentId}
            options={[
              { value: "none", label: "None" },
              ...parents.map((parent) => ({ value: parent._id, label: parent.name })),
            ]}
            onChange={(choice) =>
              setDraft((current) => ({ ...current, parentId: choice === "none" ? "" : choice }))
            }
          />
        </div>
      ) : null}
      {withHex ? (
        <>
          <HexField
            id={`${idPrefix}-hex`}
            label="Color"
            value={draft.hex}
            onChange={(hex) => setDraft((current) => ({ ...current, hex }))}
          />
          {draft.hex2 === null ? (
            <div>
              <button
                type="button"
                onClick={() => setDraft((current) => ({ ...current, hex2: "#ffffff" }))}
                className={buttonClass}
              >
                Add second color
              </button>
            </div>
          ) : (
            <div>
              <HexField
                id={`${idPrefix}-hex2`}
                label="Second color"
                value={draft.hex2}
                onChange={(hex2) => setDraft((current) => ({ ...current, hex2 }))}
              />
              <button
                type="button"
                onClick={() => setDraft((current) => ({ ...current, hex2: null }))}
                className="mt-3 text-[10px] tracking-[0.12em] uppercase underline underline-offset-4"
              >
                Remove second color
              </button>
            </div>
          )}
          <div className="flex items-center gap-3 text-[11px] tracking-[0.16em] uppercase">
            Preview
            <Swatch hex={draft.hex} hex2={draft.hex2 ?? undefined} />
          </div>
        </>
      ) : null}
      {error !== null ? <p className="text-sm">{error}</p> : null}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="border border-foreground/20 px-6 py-3 text-[11px] tracking-[0.18em] uppercase disabled:opacity-40"
        >
          {saving ? "Saving" : submitLabel}
        </button>
        {onCancel !== undefined ? (
          <button
            type="button"
            onClick={onCancel}
            className="text-[11px] tracking-[0.16em] uppercase underline underline-offset-4"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

function Swatch({ hex, hex2 }: { hex: string; hex2?: string }) {
  return (
    <span
      aria-hidden="true"
      className="size-8 shrink-0 border border-foreground/20"
      style={{
        background:
          hex2 === undefined ? hex : `linear-gradient(to bottom right, ${hex} 50%, ${hex2} 50%)`,
      }}
    />
  );
}

function HexField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-[11px] tracking-[0.16em] uppercase" htmlFor={id}>
      {label}
      <span className="mt-2 flex items-center gap-3">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-14 shrink-0 cursor-pointer border border-foreground/20 bg-transparent"
        />
        <input
          aria-label={`${label} hex value`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="block w-full border border-foreground/20 bg-transparent px-3 py-2 text-sm tracking-normal normal-case"
        />
      </span>
    </label>
  );
}

function treeOrder<TId extends string>(rows: OptionRow<TId>[]) {
  const ids = new Set(rows.map((row) => row._id));
  const children = new Map<TId | undefined, OptionRow<TId>[]>();
  for (const row of rows) {
    const parent = row.parentId !== undefined && ids.has(row.parentId) ? row.parentId : undefined;
    children.set(parent, [...(children.get(parent) ?? []), row]);
  }
  const ordered: { row: OptionRow<TId>; depth: number }[] = [];
  const visit = (parent: TId | undefined, depth: number) => {
    for (const row of children.get(parent) ?? []) {
      ordered.push({ row, depth });
      visit(row._id, depth + 1);
    }
  };
  visit(undefined, 0);
  return ordered;
}

function withoutBranch<TId extends string>(rows: OptionRow<TId>[], rootId: TId) {
  const excluded = new Set<TId>([rootId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const row of rows) {
      if (row.parentId !== undefined && excluded.has(row.parentId) && !excluded.has(row._id)) {
        excluded.add(row._id);
        grew = true;
      }
    }
  }
  return rows.filter((row) => !excluded.has(row._id));
}
