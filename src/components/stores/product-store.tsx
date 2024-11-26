"use client";

// LIBRARIES
import { create } from "zustand";

// UTILS
import { type ListProductsResponse } from "~/lib/printify-sdk";

export interface StoreTypes {
  productsList?: ListProductsResponse;
  setProductsList: (productsList?: ListProductsResponse) => void;
}

const useProductStore = create<StoreTypes>((set) => ({
  productsList: undefined,
  setProductsList: (productsList) => {
    if (!productsList) return;
    set(() => ({ productsList }));
  },
}));

export default useProductStore;

export const ProductStoreProvider = ({
  children,
  products,
}: {
  children: React.ReactNode;
  products?: ListProductsResponse;
}) => {
  const setProductsList = useProductStore((state) => state.setProductsList);

  if (products) {
    setProductsList(products);
  }

  return <>{children}</>;
};
