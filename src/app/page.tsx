import { Facebook, Instagram, ShoppingCart, Twitter } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

import { HydrateClient } from "~/trpc/server";

export default async function Home() {
  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <header className="flex h-14 items-center px-4 lg:px-6">
          <Link className="flex items-center justify-center" href="#">
            <ShoppingCart className="h-6 w-6" />
            <span className="sr-only">Acme Store</span>
          </Link>
          <nav className="ml-auto flex gap-4 sm:gap-6">
            <Link
              className="text-sm font-medium underline-offset-4 hover:underline"
              href="#"
            >
              Home
            </Link>
            <Link
              className="text-sm font-medium underline-offset-4 hover:underline"
              href="#"
            >
              Shop
            </Link>
            <Link
              className="text-sm font-medium underline-offset-4 hover:underline"
              href="#"
            >
              About
            </Link>
            <Link
              className="text-sm font-medium underline-offset-4 hover:underline"
              href="#"
            >
              Contact
            </Link>
          </nav>
        </header>
        <main className="flex-1">
          <section className="w-full bg-black text-white">
            <div className="container mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="flex flex-col justify-center p-8 lg:p-12">
                  <h1 className="mb-4 text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                    Welcome to Acme Store
                  </h1>
                  <p className="mb-6 max-w-[600px] text-gray-300 md:text-xl">
                    {`Discover our latest collection of high-quality merchandise.
                    From trendy apparel to unique accessories, we've got you
                    covered.`}
                  </p>
                  <Button size="lg" className="w-full sm:w-auto">
                    Shop Now
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="group relative overflow-hidden">
                      <Image
                        src={`/starry-parallax.jpg?height=400&width=400`}
                        alt={`Featured Product ${item}`}
                        width={400}
                        height={400}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 transition-opacity group-hover:opacity-100" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button variant="secondary" size="sm">
                          View Product
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
          <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                    Stay Updated
                  </h2>
                  <p className="mx-auto max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Subscribe to our newsletter for exclusive deals and new
                    product announcements.
                  </p>
                </div>
                <div className="w-full max-w-sm space-y-2">
                  <form className="flex space-x-2">
                    <Input
                      className="max-w-lg flex-1"
                      placeholder="Enter your email"
                      type="email"
                    />
                    <Button type="submit">Subscribe</Button>
                  </form>
                </div>
              </div>
            </div>
          </section>
        </main>
        <footer className="flex w-full shrink-0 flex-col items-center gap-2 border-t px-4 py-6 sm:flex-row md:px-6">
          <p className="text-xs text-gray-500">
            © 2023 Acme Store. All rights reserved.
          </p>
          <nav className="flex gap-4 sm:ml-auto sm:gap-6">
            <Link
              className="text-xs underline-offset-4 hover:underline"
              href="#"
            >
              Terms of Service
            </Link>
            <Link
              className="text-xs underline-offset-4 hover:underline"
              href="#"
            >
              Privacy
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link href="#" className="text-gray-500 hover:text-gray-900">
              <Facebook className="h-5 w-5" />
              <span className="sr-only">Facebook</span>
            </Link>
            <Link href="#" className="text-gray-500 hover:text-gray-900">
              <Twitter className="h-5 w-5" />
              <span className="sr-only">Twitter</span>
            </Link>
            <Link href="#" className="text-gray-500 hover:text-gray-900">
              <Instagram className="h-5 w-5" />
              <span className="sr-only">Instagram</span>
            </Link>
          </div>
        </footer>
      </main>
    </HydrateClient>
  );
}
