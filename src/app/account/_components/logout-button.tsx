"use client";

// LIBS
import { signOut } from "next-auth/react";

// COMPONENTS
import { Button } from "~/components/ui/button";

const LogoutButton = () => {
  return (
    <div
      // LOGOUT
      className="flex w-full items-center justify-center gap-6 align-middle"
    >
      <Button className="px-10 py-6 text-xl" onClick={() => signOut()}>
        Log Out
      </Button>
    </div>
  );
};

export default LogoutButton;
