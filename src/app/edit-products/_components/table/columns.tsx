"use client";

// LIBS
import { type ColumnDef } from "@tanstack/react-table";

// UTILS
import { type Product } from "~/server/db/schema";

// COMPONENTS

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    accessorKey: "tags",
    header: "Tags",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
];
