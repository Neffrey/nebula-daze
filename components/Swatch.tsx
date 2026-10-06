export default function Swatch({
  hex,
  hex2,
  className = "size-8",
}: {
  hex: string;
  hex2?: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`block shrink-0 border border-foreground/20 ${className}`}
      style={{
        background:
          hex2 === undefined ? hex : `linear-gradient(to bottom right, ${hex} 50%, ${hex2} 50%)`,
      }}
    />
  );
}
