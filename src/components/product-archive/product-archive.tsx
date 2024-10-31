"use client";

// LIBS
import { useState } from "react";

// UTILS
import useProductStore from "../stores/product-store";
import ProductCard from "./product-card";

// COMPONENTS
import { Button } from "~/components/ui/button";

const ProductArchive = () => {
  const products = useProductStore((state) => state.data);

  const allTags = Array.from(
    new Set(products.flatMap((product) => product.tags)),
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const filteredProducts = products?.filter((product) => {
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {filteredProducts?.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  );
};

export default ProductArchive;

// 'use client'

// import { useState } from "react"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { Star, ShoppingCart, Search } from "lucide-react"
// import Image from "next/image"

// export default function HighSellingProducts() {
//   const products = [
//     { id: 1, name: "Wireless Earbuds", price: 79.99, rating: 4.5, image: "/placeholder.svg?height=200&width=200", tags: ["electronics", "audio"] },
//     { id: 2, name: "Smart Watch", price: 199.99, rating: 4.7, image: "/placeholder.svg?height=200&width=200", tags: ["electronics", "wearable"] },
//     { id: 3, name: "Portable Charger", price: 49.99, rating: 4.3, image: "/placeholder.svg?height=200&width=200", tags: ["electronics", "accessories"] },
//     { id: 4, name: "Noise-Canceling Headphones", price: 249.99, rating: 4.8, image: "/placeholder.svg?height=200&width=200", tags: ["electronics", "audio"] },
//     { id: 5, name: "Fitness Tracker", price: 89.99, rating: 4.6, image: "/placeholder.svg?height=200&width=200", tags: ["electronics", "wearable"] },
//     { id: 6, name: "Bluetooth Speaker", price: 69.99, rating: 4.4, image: "/placeholder.svg?height=200&width=200", tags: ["electronics", "audio"] },
//   ]

//   const allTags = Array.from(new Set(products.flatMap(product => product.tags)))

//   const [searchTerm, setSearchTerm] = useState("")
//   const [selectedTags, setSelectedTags] = useState<string[]>([])

//   const filteredProducts = products.filter(product => {
//     const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
//     const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => product.tags.includes(tag))
//     return matchesSearch && matchesTags
//   })

//   const handleTagClick = (tag: string) => {
//     setSelectedTags(prev =>
//       prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
//     )
//   }

//   return (
//     <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
//         <h2 className="text-3xl font-bold">High-Selling Products</h2>
//         <Button variant="outline">View All</Button>
//       </div>

//       <div className="mb-8">
//         <div className="relative">
//           <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
//           <Input
//             type="text"
//             placeholder="Search products..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="pl-10"
//           />
//         </div>
//       </div>

//       <div className="mb-8">
//         <h3 className="text-xl font-semibold mb-4">Filter by Category:</h3>
//         <div className="flex flex-wrap gap-2">
//           {allTags.map(tag => (
//             <Button
//               key={tag}
//               variant={selectedTags.includes(tag) ? "default" : "outline"}
//               onClick={() => handleTagClick(tag)}
//               className="capitalize"
//             >
//               {tag}
//             </Button>
//           ))}
//         </div>
//       </div>

//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
//         {filteredProducts.map((product) => (
//           <Card key={product.id} className="flex flex-col justify-between">
//             <CardHeader className="p-4">
//               <Image
//                 src={product.image}
//                 alt={product.name}
//                 width={200}
//                 height={200}
//                 className="w-full h-40 sm:h-48 object-cover rounded-md"
//               />
//             </CardHeader>
//             <CardContent className="p-4">
//               <CardTitle className="text-lg mb-2">{product.name}</CardTitle>
//               <p className="text-xl sm:text-2xl font-bold mb-2">${product.price.toFixed(2)}</p>
//               <div className="flex items-center">
//                 {[...Array(5)].map((_, i) => (
//                   <Star
//                     key={i}
//                     className={`w-4 h-4 sm:w-5 sm:h-5 ${
//                       i < Math.floor(product.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
//                     }`}
//                   />
//                 ))}
//                 <span className="ml-2 text-sm text-gray-600">{product.rating.toFixed(1)}</span>
//               </div>
//             </CardContent>
//             <CardFooter className="p-4">
//               <Button className="w-full">
//                 <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
//               </Button>
//             </CardFooter>
//           </Card>
//         ))}
//       </div>
//     </div>
//   )
// }
