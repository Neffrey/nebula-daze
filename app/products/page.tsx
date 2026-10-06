import { Suspense } from "react";
import ProductBrowser from "@/components/ProductBrowser";
import SiteHeader from "@/components/SiteHeader";

export default function ProductsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-[70vh] w-full max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
        <Suspense fallback={<p className="text-sm text-muted">Loading</p>}>
          <ProductBrowser />
        </Suspense>
      </main>
    </>
  );
}
