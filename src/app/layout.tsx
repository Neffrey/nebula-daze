import "~/styles/globals.css";

// LIBS
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { type Metadata } from "next";
import { extractRouterConfig } from "uploadthing/server";

// UTILS
import { ourFileRouter } from "~/app/api/uploadthing/core";
import { getServerAuthSession } from "~/server/auth";
import { TRPCReactProvider } from "~/trpc/react";

// COMPONENTS
import HtmlWrapper from "~/components/html-wrapper";
import LightDarkProvider from "~/components/providers/light-dark-provider";

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
    <HtmlWrapper session={session}>
      <body>
        <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
        <TRPCReactProvider>
          <LightDarkProvider session={session}>{children}</LightDarkProvider>
        </TRPCReactProvider>
      </body>
    </HtmlWrapper>
  );
};

export default RootLayout;
