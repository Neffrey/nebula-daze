// LIBS

// COMPONENTS
import ParallaxHero from "./_home-and-layout-components/parallax-hero";

// COMP
const Home = () => {
  return (
    <>
      <div
        // HERO ROW
        className="relative flex min-h-[80vh] w-full flex-wrap items-center justify-around gap-12 md:justify-center"
      >
        <ParallaxHero className="z-0" />
        <div className="z-10 flex w-full flex-col justify-around gap-5 md:w-1/2 lg:w-1/3">
          <h1 className="w-full text-center text-5xl font-extrabold tracking-wider text-foreground sm:text-[5rem]">
            Nebula Daze
          </h1>
          <h2 className="w-full text-center text-xl tracking-wider text-foreground">
            Otherworldy merch with psychadelic vibes
          </h2>
        </div>
      </div>
      <div className="min-h-[500vh]" />
    </>
  );
};

export default Home;
