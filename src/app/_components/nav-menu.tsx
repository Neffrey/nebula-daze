// LIBS
import Link from "next/link";

// COMPONENTS
import { Button } from "~/components/ui/button";

// TYPES
import { type UserRole } from "~/server/db/schema";

type NavItems = {
  title: string;
  href: string;
  authedRoles?: UserRole[] | undefined;
}[];

// Nav items
const navItems: NavItems = [
  { title: "Home", href: "/" },
  {
    title: "Account",
    href: "/account",
    authedRoles: ["ADMIN", "RESTRICTED", "USER"],
  },
];

const NavMenu = () => {
  return (
    <div
      // Nav Menu
      className="flex items-center justify-start gap-6"
    >
      {navItems.map((item) => {
        return (
          <Link href={item.href} tabIndex={-1} key={item.title}>
            <Button
              variant={"ghost"}
              className="font-display uppercase tracking-widest text-primary-foreground"
            >
              {item.title}
            </Button>
          </Link>
        );
      })}
    </div>
  );
};
export default NavMenu;
