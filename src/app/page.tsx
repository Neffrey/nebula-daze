// LIBS
import Image from "next/image";

// UTILS
import { getServerAuthSession } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";

// COMPONENTS
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import ParallaxHero from "./_components/parallax-hero";

export default async function Home() {
  const session = await getServerAuthSession();
  return (
    <HydrateClient>
      <section className="w-full bg-black text-white">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5">
            <div className="relative flex w-full flex-col flex-wrap items-center justify-center overflow-hidden lg:col-span-3">
              <ParallaxHero className="z-0" />
              <div className="z-10 flex h-full w-full flex-col items-center justify-center gap-5">
                <h1 className="w-full text-center text-5xl font-extrabold tracking-wider text-foreground sm:text-[5rem]">
                  Nebula Daze
                </h1>
                <div className="w-full text-center text-xl tracking-wider text-foreground">
                  Otherworldy merch with psychadelic vibes
                </div>
                <Link href="/shop">
                  <Button>
                    <h2 className="font-4xl">Shop Now</h2>
                  </Button>
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1 lg:col-span-2">
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
                Subscribe to our newsletter for exclusive deals and new product
                announcements.
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
    </HydrateClient>
  );
}
