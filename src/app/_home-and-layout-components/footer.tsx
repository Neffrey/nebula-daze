// LIBRARIES
import Link from "next/link";

// COMPONENTS
import { Button } from "~/components/ui/button";

const Footer = () => {
  return (
    <div
      // Row Container
      className="flex w-full items-center justify-center border-t-4 border-solid border-secondary-foreground bg-gradient-to-r from-secondary to-muted px-5 py-6 shadow-xl"
    >
      <h3 className="text-center text-lg font-semibold lowercase tracking-widest text-secondary-foreground">
        Made with love by
      </h3>
      <Link
        href="https://neffrey.com"
        target="_blank"
        rel="noopener noreferrer"
        passHref
      >
        <Button
          variant="link"
          className="text-lg tracking-widest text-secondary-foreground"
        >
          neffrey
        </Button>
      </Link>
    </div>
  );
};

export default Footer;
