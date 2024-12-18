"use client";

// LIBS
import { ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

// UTILS
import { type ProductUpdate } from "~/lib/printify-sdk";

// COMPONENTS
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

const ProductCard = ({ product }: { product: ProductUpdate }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

  return (
    <Card key={product.id} className="flex flex-col justify-between">
      <CardHeader className="p-4">
        <Image
          src={product.images[currentImageIndex]?.src ?? ""}
          alt={product.title}
          width={200}
          height={200}
          className="w-4/5 self-center rounded-md object-cover"
        />
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="mb-2 text-lg">{product.title}</CardTitle>
        {product?.variants ? (
          <p className="mb-2 text-xl font-bold sm:text-2xl">
            $
            {product?.variants[0]?.price
              ? Math.floor(product?.variants[0].price / 100)
              : 0}
          </p>
        ) : null}
        {/* Rating Stars */}
        {/* <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${
                    i < Math.floor(product.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                  }`}
                />
              ))}
              <span className="ml-2 text-sm text-gray-600">{product.rating.toFixed(1)}</span>
            </div> */}
      </CardContent>
      <CardFooter className="p-4">
        <Button className="w-full">
          <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
