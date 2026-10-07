export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-foreground/10 px-4 py-14 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2">
        <div>
          <p className="font-display text-base whitespace-nowrap tracking-[0.2em] sm:text-lg sm:tracking-[0.24em]">NEBULA DAZE</p>
        </div>
        <div className="text-sm leading-8">
          <p className="text-[12px] tracking-[0.18em] uppercase">Visit</p>
          <p>Shipping</p>
          <p>Returns</p>
          <p>Stores</p>
        </div>
      </div>
    </footer>
  );
}
