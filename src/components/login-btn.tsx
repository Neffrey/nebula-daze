"use client";

// LIBS
import { signIn } from "next-auth/react";

// COMPONENTS
import { Button } from "~/components/ui/button";

// COMP
const LoginBtn = () => {
  return (
    <Button variant={"ghost"} onClick={() => signIn("google")}>
      Login or Signup
    </Button>
  );
};
export default LoginBtn;
