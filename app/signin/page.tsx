"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignIn() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <Link href="/" className="font-display text-center text-3xl tracking-[0.42em]">
        MAREL
      </Link>
      <h1 className="mt-8 text-center text-[11px] tracking-[0.22em] uppercase">
        {flow === "signIn" ? "Sign in" : "Create an account"}
      </h1>
      <form
        className="mt-8 flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          setLoading(true);
          setError(null);
          const formData = new FormData(event.currentTarget);
          formData.set("flow", flow);
          void signIn("password", formData)
            .then(() => {
              router.push("/");
            })
            .catch((signInError: unknown) => {
              setError(
                signInError instanceof Error
                  ? signInError.message
                  : "Unable to sign in",
              );
              setLoading(false);
            });
        }}
      >
        <label className="text-[11px] tracking-[0.16em] uppercase">
          Email
          <input
            className="mt-2 w-full border border-[#141210]/20 bg-transparent px-3 py-3 text-sm outline-none"
            type="email"
            name="email"
            required
          />
        </label>
        <label className="text-[11px] tracking-[0.16em] uppercase">
          Password
          <input
            className="mt-2 w-full border border-[#141210]/20 bg-transparent px-3 py-3 text-sm outline-none"
            type="password"
            name="password"
            minLength={8}
            required
          />
        </label>
        <button
          className="mt-2 bg-[#141210] py-3 text-[11px] tracking-[0.22em] text-[#f4f1eb] uppercase disabled:opacity-50"
          type="submit"
          disabled={loading}
        >
          {loading ? "Please wait" : flow === "signIn" ? "Sign in" : "Sign up"}
        </button>
        <button
          type="button"
          className="text-sm text-[#6f675e] underline underline-offset-4"
          onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
        >
          {flow === "signIn"
            ? "Need an account? Create one"
            : "Already registered? Sign in"}
        </button>
        {error && <p className="text-sm text-rose-800">{error}</p>}
      </form>
    </div>
  );
}
