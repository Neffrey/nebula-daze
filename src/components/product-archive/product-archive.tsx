"use client";

// LIBS
import { useState } from "react";

// UTILS
import useProductStore from "../stores/product-store";
import ProductCard from "./product-card";

// COMPONENTS
import { Button } from "~/components/ui/button";

const ProductArchive = () => {
  const products = useProductStore((state) => state.productsList);

  const allTags = products
    ? Array.from(new Set(products.data.flatMap((product) => product.tags)))
    : [];

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const filteredProducts = products?.data?.filter((product) => {
    const matchesSearch = product?.title
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some((tag) => product?.tags?.includes(tag));
    return matchesSearch && matchesTags;
  });

  // Handlers
  const handleTagClick = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };
  const handleLogData = () => {
    console.log("products: ", products);
  };

  return (
    // <div className="p-3">
    //   <h2>Product Test</h2>
    //   <Button onClick={() => handleLogData()}>Log Data</Button>
    //   <div className="p-3">
    //     <h3>Current Page: {products.current_page ?? "Still Loading"}</h3>
    //     <h3>Products ArrLength: {products.data?.length ?? "Still Loading"}</h3>
    //   </div>
    // </div>
    <>
      <div>
        <Button onClick={() => console.log("products: ", filteredProducts)}>
          Log Filtered Products
        </Button>
      </div>
      <div className="grid max-w-[60%] grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {filteredProducts?.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  );
};

export default ProductArchive;
