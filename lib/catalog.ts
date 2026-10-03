export type Product = {
  name: string;
  price: number;
  category: string;
  image: string;
};

export const categories = [
  "New",
  "Tailoring",
  "Evening",
  "Knitwear",
  "Accessories",
] as const;

export const products: Product[] = [
  {
    name: "Double-breasted wool coat",
    price: 1280,
    category: "Tailoring",
    image:
      "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Silk column dress",
    price: 640,
    category: "Evening",
    image:
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Cashmere crew",
    price: 420,
    category: "Knitwear",
    image:
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Leather shoulder bag",
    price: 890,
    category: "Accessories",
    image:
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Pleated trouser",
    price: 380,
    category: "Tailoring",
    image:
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Satin blouse",
    price: 310,
    category: "Evening",
    image:
      "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Sculpted heel",
    price: 540,
    category: "Accessories",
    image:
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Tailored blazer",
    price: 760,
    category: "Tailoring",
    image:
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1200&q=80",
  },
];

export function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents);
}
