"use client";

// LIBRARIES
import { create } from "zustand";

// UTILS
import { type Product, type ProductsResponseData } from "~/server/db/schema";

// COMPONENTS

export type GroupProductsData = {
  current_page?: number;
  data?: {
    id?: string;
    title?: string;
    description?: string;
    tags?: string[];
  }[];
};

export type GroupProductsResponse = {
  status?: "resolved_model" | "resolved_error";
  values?: GroupProductsData;
};

export interface StoreTypes {
  currentPage: number;
  setCurrentPage: (setCurrentPage: number) => void;
  data: Product[];
  setData: (data: Product[]) => void;
}

const useProductStore = create<StoreTypes>((set) => ({
  currentPage: 1,
  setCurrentPage: (currentPage) => set(() => ({ currentPage })),

  data: [],
  setData: (data) => set(() => ({ data })),
}));

export default useProductStore;

export const ProductStoreProvider = ({
  children,
  products,
}: {
  children: React.ReactNode;
  products: ProductsResponseData;
}) => {
  const setCurrentPage = useProductStore((state) => state.setCurrentPage);
  const setData = useProductStore((state) => state.setData);

  setCurrentPage(products?.current_page ?? 1);
  setData(products?.data ?? []);

  return <>{children}</>;
};
