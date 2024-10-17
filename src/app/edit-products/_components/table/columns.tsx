"use client";

// LIBS
import { type ColumnDef } from "@tanstack/react-table";

// UTILS
import { type Product } from "~/server/db/schema";

// COMPONENTS

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "title",
    header: () => {
      return <TableHeader>Title</TableHeader>;
    },
  },
  {
    accessorKey: "tags",
    header: () => {
      return <TableHeader>Tags</TableHeader>;
    },
  },
  {
    accessorKey: "description",
    header: () => {
      return <TableHeader>Description</TableHeader>;
    },
    // cell: ({ row }) => {
    //   return (
    //     <CreateCompletionBtn className="justify-end px-4" task={row.original} />
    //   );
    // },
  },
];

export const TableHeader = ({ children }: { children: React.ReactNode }) => {
  return <div className="flex justify-end px-2">{children}</div>;
};
