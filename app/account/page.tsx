"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import { api } from "@/convex/_generated/api";

export default function AccountPage() {
  const viewer = useQuery(api.users.viewer);
  const { signOut } = useAuthActions();
  const router = useRouter();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col px-6 py-16">
        <p className="text-[11px] tracking-[0.22em] uppercase">Account</p>
        {viewer === undefined ? (
          <p className="mt-8 text-sm text-[#6f675e]">Loading</p>
        ) : viewer === null ? (
          <SignedOut />
        ) : (
          <SignedIn
            viewer={viewer}
            onSignOut={() => {
              void signOut().then(() => {
                router.push("/");
              });
            }}
          />
        )}
      </main>
    </>
  );
}

function SignedOut() {
  return (
    <div className="mt-8">
      <h1 className="font-display text-5xl leading-none">Sign in to Narel</h1>
      <p className="mt-4 max-w-md text-sm leading-6 text-[#6f675e]">
        Your orders and client details live here once you are signed in.
      </p>
      <Link
        href="/signin?next=/account"
        className="mt-8 inline-block bg-[#141210] px-6 py-3 text-[11px] tracking-[0.22em] text-[#f4f1eb] uppercase"
      >
        Sign in
      </Link>
    </div>
  );
}

function SignedIn({
  viewer,
  onSignOut,
}: {
  viewer: { name: string | null; email: string | null; image: string | null };
  onSignOut: () => void;
}) {
  return (
    <>
      <div className="mt-8 flex items-center gap-5">
        {viewer.image ? (
          // Google profile photos come from a host that changes per account.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={viewer.image}
            alt=""
            className="size-16 object-cover"
          />
        ) : null}
        <div>
          <h1 className="font-display text-5xl leading-none">
            {viewer.name ?? "Your account"}
          </h1>
          {viewer.email ? (
            <p className="mt-3 text-sm text-[#6f675e]">{viewer.email}</p>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        className="mt-8 w-fit border border-[#141210]/20 px-6 py-3 text-[11px] tracking-[0.22em] uppercase"
        onClick={onSignOut}
      >
        Sign out
      </button>
      <section className="mt-16 border-t border-[#141210]/10 pt-10">
        <h2 className="text-[11px] tracking-[0.22em] uppercase">Orders</h2>
        <p className="font-display mt-6 text-4xl">No orders yet.</p>
        <Link
          href="/"
          className="mt-6 inline-block text-[11px] tracking-[0.18em] uppercase underline underline-offset-4"
        >
          Continue shopping
        </Link>
      </section>
    </>
  );
}
