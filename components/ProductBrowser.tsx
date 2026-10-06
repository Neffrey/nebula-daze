"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import Select from "@/components/Select";
import Swatch from "@/components/Swatch";
import ToggleGroup from "@/components/ToggleGroup";
import { api } from "@/convex/_generated/api";
import { formatPrice } from "@/lib/catalog";

const sorts = [
  { value: "name", label: "Name A–Z" },
  { value: "price-asc", label: "Price low to high" },
  { value: "price-desc", label: "Price high to low" },
] as const;

type Sort = (typeof sorts)[number]["value"];

type CategoryOption = { _id: string; name: string; parentId?: string };

const fieldClass =
  "block w-full border border-foreground/40 bg-transparent px-3 py-2 text-sm tracking-normal normal-case outline-none focus:border-foreground";

export default function ProductBrowser() {
  const products = useQuery(api.products.catalog);
  const categories = useQuery(api.categories.options);
  const colors = useQuery(api.colors.list);
  const sizes = useQuery(api.sizes.list);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const categoryIds = listParam(searchParams.get("category"));
  const colorIds = listParam(searchParams.get("color"));
  const sizeIds = listParam(searchParams.get("size"));
  const min = searchParams.get("min") ?? "";
  const max = searchParams.get("max") ?? "";
  const sortParam = searchParams.get("sort");
  const sort: Sort = sorts.find((option) => option.value === sortParam)?.value ?? "name";

  function update(changes: Record<string, string | string[]>) {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(changes)) {
      const text = Array.isArray(value) ? value.join(",") : value.trim();
      if (text === "") {
        params.delete(key);
      } else {
        params.set(key, text);
      }
    }
    const search = params.toString();
    window.history.replaceState(null, "", search === "" ? pathname : `${pathname}?${search}`);
  }

  function clearAll() {
    setQuery("");
    window.history.replaceState(null, "", pathname);
  }

  const activeCount =
    categoryIds.length + colorIds.length + sizeIds.length + (min !== "" ? 1 : 0) + (max !== "" ? 1 : 0);

  const visible =
    products === undefined || categories === undefined
      ? undefined
      : sortProducts(
          products.filter((product) => {
            const term = query.trim().toLowerCase();
            if (
              term !== "" &&
              !product.name.toLowerCase().includes(term) &&
              !product.category.toLowerCase().includes(term)
            ) {
              return false;
            }
            if (
              categoryIds.length > 0 &&
              !withDescendants(categories, categoryIds).has(product.categoryId)
            ) {
              return false;
            }
            const matchingVariants =
              colorIds.length > 0
                ? product.variants.filter((variant) => colorIds.includes(variant.colorId))
                : product.variants;
            if (colorIds.length > 0 && matchingVariants.length === 0) {
              return false;
            }
            const availableSizes =
              product.variants.length > 0
                ? matchingVariants.flatMap((variant) => variant.sizeIds)
                : product.sizeIds;
            if (sizeIds.length > 0 && !availableSizes.some((id) => sizeIds.includes(id))) {
              return false;
            }
            const low = Number(min);
            const high = Number(max);
            if (min !== "" && !Number.isNaN(low) && product.price < low) {
              return false;
            }
            if (max !== "" && !Number.isNaN(high) && product.price > high) {
              return false;
            }
            return true;
          }),
          sort,
        );

  const colorById = new Map((colors ?? []).map((color) => [color._id as string, color]));

  return (
    <div>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[12px] tracking-[0.22em] uppercase">The collection</p>
          <h1 className="font-display mt-2 text-5xl leading-none sm:text-6xl">Shop all</h1>
        </div>
        <div className="w-full sm:w-56">
          <label className="text-[12px] tracking-[0.16em] uppercase" htmlFor="catalog-sort">
            Sort
          </label>
          <Select<Sort>
            id="catalog-sort"
            className="mt-2"
            compact
            value={sort}
            options={sorts}
            onChange={(value) => update({ sort: value === "name" ? "" : value })}
          />
        </div>
      </div>

      <div className="relative mt-8">
        <input
          type="search"
          value={query}
          aria-label="Search products"
          placeholder="Search"
          className={`${fieldClass} py-3 pr-10 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none`}
          onChange={(event) => {
            setQuery(event.target.value);
            update({ q: event.target.value });
          }}
        />
        <svg
          viewBox="0 0 16 16"
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        >
          <circle cx="7" cy="7" r="4.25" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="M10.2 10.2L13.5 13.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4 lg:hidden">
        <button
          type="button"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen((open) => !open)}
          className="border border-foreground/40 px-4 py-2 text-[12px] tracking-[0.16em] uppercase"
        >
          Filters{activeCount > 0 ? ` (${activeCount})` : ""}
        </button>
        {visible !== undefined ? <ResultCount count={visible.length} /> : null}
      </div>

      <div className="mt-8 grid items-start gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
        <aside className={`${filtersOpen ? "grid" : "hidden"} gap-8 lg:grid`} aria-label="Filters">
          <CategoryFilter
            categories={categories ?? []}
            selected={categoryIds}
            onChange={(ids) => update({ category: ids })}
          />
          {colors !== undefined && colors.length > 0 ? (
            <ToggleGroup<string>
              label="Color"
              options={colors.map((color) => ({
                value: color._id,
                label: color.name,
                swatch: <Swatch hex={color.hex} hex2={color.hex2} className="size-4" />,
              }))}
              selected={colorIds}
              onChange={(ids) => update({ color: ids })}
            />
          ) : null}
          {sizes !== undefined && sizes.length > 0 ? (
            <ToggleGroup<string>
              label="Size"
              options={sizes.map((size) => ({ value: size._id, label: size.name }))}
              selected={sizeIds}
              onChange={(ids) => update({ size: ids })}
            />
          ) : null}
          <fieldset>
            <legend className="text-[12px] tracking-[0.16em] uppercase">Price</legend>
            <div className="mt-2 flex items-center gap-2">
              <input
                inputMode="numeric"
                aria-label="Minimum price"
                placeholder="Min"
                value={min}
                onChange={(event) => update({ min: event.target.value.replace(/\D/g, "") })}
                className={fieldClass}
              />
              <span className="text-muted">–</span>
              <input
                inputMode="numeric"
                aria-label="Maximum price"
                placeholder="Max"
                value={max}
                onChange={(event) => update({ max: event.target.value.replace(/\D/g, "") })}
                className={fieldClass}
              />
            </div>
          </fieldset>
          {activeCount > 0 || query !== "" ? (
            <button
              type="button"
              onClick={clearAll}
              className="justify-self-start text-[12px] tracking-[0.16em] uppercase underline underline-offset-4"
            >
              Clear all
            </button>
          ) : null}
        </aside>

        <section aria-label="Products" className="min-w-0">
          {visible === undefined ? (
            <p className="text-sm text-muted">Loading</p>
          ) : (
            <>
              <div className="hidden lg:block">
                <ResultCount count={visible.length} />
              </div>
              {visible.length === 0 ? (
                <div className="mt-6">
                  <p className="font-display text-3xl">Nothing matches those filters.</p>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="mt-6 text-[12px] tracking-[0.16em] uppercase underline underline-offset-4"
                  >
                    Clear all
                  </button>
                </div>
              ) : (
                <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3">
                  {visible.map((product) => (
                    <li key={product._id} className="min-w-0">
                      <Link href={`/products/${product.slug}`} className="group block">
                        <div className="aspect-[3/4] overflow-hidden bg-surface">
                          {/* Product images may come from any https host. */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={product.image}
                            alt={product.name}
                            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                        </div>
                        <div className="mt-3 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h2 className="font-display text-xl leading-tight">{product.name}</h2>
                            <p className="mt-1 text-[12px] tracking-[0.16em] text-muted uppercase">
                              {product.category}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm">{formatPrice(product.price)}</p>
                        </div>
                        {product.variants.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {product.variants.map(({ colorId }) => {
                              const color = colorById.get(colorId);
                              return color === undefined ? null : (
                                <Swatch key={colorId} hex={color.hex} hex2={color.hex2} className="size-3" />
                              );
                            })}
                          </div>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function ResultCount({ count }: { count: number }) {
  return (
    <p className="text-[12px] tracking-[0.16em] text-muted uppercase">
      {count} {count === 1 ? "piece" : "pieces"}
    </p>
  );
}

function CategoryFilter({
  categories,
  selected,
  onChange,
}: {
  categories: CategoryOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
}) {
  if (categories.length === 0) {
    return null;
  }
  return (
    <fieldset>
      <legend className="text-[12px] tracking-[0.16em] uppercase">Category</legend>
      <ul className="mt-2 grid gap-1">
        {treeOrder(categories).map(({ category, depth }) => {
          const on = selected.includes(category._id);
          return (
            <li key={category._id} style={{ paddingLeft: `${depth}rem` }}>
              <label className="flex cursor-pointer items-center gap-3 py-1 text-sm">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() =>
                    onChange(on ? selected.filter((id) => id !== category._id) : [...selected, category._id])
                  }
                  className="size-4 accent-primary"
                />
                <span className={on ? "" : "text-muted"}>{category.name}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

function listParam(value: string | null) {
  return value === null ? [] : value.split(",").filter((part) => part !== "");
}

function sortProducts<T extends { name: string; price: number }>(products: T[], sort: Sort) {
  const sorted = [...products];
  if (sort === "price-asc") {
    sorted.sort((left, right) => left.price - right.price);
  } else if (sort === "price-desc") {
    sorted.sort((left, right) => right.price - left.price);
  } else {
    sorted.sort((left, right) => left.name.localeCompare(right.name));
  }
  return sorted;
}

function withDescendants(categories: CategoryOption[], roots: string[]) {
  const included = new Set<string>(roots);
  let grew = true;
  while (grew) {
    grew = false;
    for (const category of categories) {
      if (category.parentId !== undefined && included.has(category.parentId) && !included.has(category._id)) {
        included.add(category._id);
        grew = true;
      }
    }
  }
  return included;
}

function treeOrder(categories: CategoryOption[]) {
  const ids = new Set(categories.map((category) => category._id));
  const children = new Map<string | undefined, CategoryOption[]>();
  for (const category of [...categories].sort((left, right) => left.name.localeCompare(right.name))) {
    const parent =
      category.parentId !== undefined && ids.has(category.parentId) ? category.parentId : undefined;
    children.set(parent, [...(children.get(parent) ?? []), category]);
  }
  const ordered: { category: CategoryOption; depth: number }[] = [];
  const visit = (parent: string | undefined, depth: number) => {
    for (const category of children.get(parent) ?? []) {
      ordered.push({ category, depth });
      visit(category._id, depth + 1);
    }
  };
  visit(undefined, 0);
  return ordered;
}
