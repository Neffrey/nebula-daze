import { Roboto, Titillium_Web } from "next/font/google";
import "~/styles/globals.css";

const titilliumWeb = Titillium_Web({
  subsets: ["latin"],
  weight: "700",
  variable: "--font-titillium-web",
  preload: true,
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-roboto",
  preload: true,
});

// LIBS
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { type Metadata } from "next";
import { extractRouterConfig } from "uploadthing/server";

// UTILS
import { ourFileRouter } from "~/app/api/uploadthing/core";
import { getServerAuthSession } from "~/server/auth";
import { TRPCReactProvider } from "~/trpc/react";

// COMPONENTS
import UseOnRender from "~/components/hooks/use-on-render";
import HtmlWrapper from "~/components/html-wrapper";
import LightDarkProvider from "~/components/providers/light-dark-provider";
import SessionProvider from "~/components/providers/session-provider";
import LoadingSpinner from "~/components/ui/loading-spinner";
import { Toaster } from "~/components/ui/toaster";
import DefaultColorTheme from "./_components/default-color-theme";
import Footer from "./_components/footer";
import Header from "./_components/header";

export const metadata: Metadata = {
  title: "Nebula Daze",
  description: "Otherworldy merch with psychadelic vibes",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const RootLayout = async ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  const session = await getServerAuthSession();

  return (
    <SessionProvider>
      <HtmlWrapper session={session} fonts={[roboto, titilliumWeb]}>
        <body className="custom-scrollbar">
          <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
          <TRPCReactProvider>
            <LightDarkProvider>
              <DefaultColorTheme />
              <UseOnRender
                fallback={
                  <div className="absolute flex h-full w-full flex-col items-center justify-center gap-10 bg-cyan-800 text-slate-50">
                    <LoadingSpinner className="h-20 w-20" />
                    <h3 className="text-xl">Loading...</h3>
                  </div>
                }
              >
                <Header />
                <main className="flex min-h-screen w-full flex-col items-center">
                  {children}
                </main>
                <Footer />
                <Toaster />
              </UseOnRender>
            </LightDarkProvider>
          </TRPCReactProvider>
        </body>
      </HtmlWrapper>
    </SessionProvider>
  );
};

export default RootLayout;
