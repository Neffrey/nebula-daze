// LIBRARIES
import Link from "next/link";

// COMPONENTS
import NavMenu from "~/app/_components/nav-menu";
import StickyScrollBar from "~/components/sticky-scroll-bar";
import NeffreyLogo from "~/components/svgs/NeffreyLogo";

// COMP
const Header = () => {
  return (
    <StickyScrollBar>
      <Link
        // Logo & Name Container
        className="flex items-center justify-start gap-6"
        href="/"
      >
        <div
          // Logo Container
          className="h-12 w-12 cursor-pointer fill-secondary-foreground"
        >
          <NeffreyLogo />
        </div>
      </Link>
      <NavMenu />
    </StickyScrollBar>
  );
};

export default Header;
