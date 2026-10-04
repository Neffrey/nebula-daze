"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { safeNextPath, siteUrlForHostname } from "@/lib/siteUrl";

export default function SignIn() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <Link href="/" className="font-display text-center text-3xl tracking-[0.42em]">
        NAREL
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
              router.push(pathAfterSignIn());
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
          disabled={loading || googleLoading}
        >
          {loading ? "Please wait" : flow === "signIn" ? "Sign in" : "Sign up"}
        </button>
      </form>
      <div className="mt-6 flex items-center gap-3 text-[#6f675e]">
        <span className="h-px flex-1 bg-[#141210]/15" />
        <span className="text-[11px] tracking-[0.16em] uppercase">or</span>
        <span className="h-px flex-1 bg-[#141210]/15" />
      </div>
      <button
        className="mt-6 flex items-center justify-center gap-3 border border-[#141210]/20 py-3 text-[11px] tracking-[0.22em] uppercase disabled:opacity-50"
        type="button"
        disabled={loading || googleLoading}
        onClick={() => {
          setGoogleLoading(true);
          setError(null);
          void signIn("google", {
            redirectTo: `${siteUrlForHostname(window.location.hostname)}${pathAfterSignIn()}`,
          }).catch((signInError: unknown) => {
            setError(
              signInError instanceof Error
                ? signInError.message
                : "Unable to continue with Google",
            );
            setGoogleLoading(false);
          });
        }}
      >
        <GoogleMark />
        {googleLoading ? "Please wait" : "Continue with Google"}
      </button>
      <button
        type="button"
        className="mt-4 text-sm text-[#6f675e] underline underline-offset-4"
        onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
      >
        {flow === "signIn"
          ? "Need an account? Create one"
          : "Already registered? Sign in"}
      </button>
      {error && <p className="mt-4 text-sm text-rose-800">{error}</p>}
    </div>
  );
}

function pathAfterSignIn() {
  return safeNextPath(new URLSearchParams(window.location.search).get("next"));
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 18 18" className="size-4">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
