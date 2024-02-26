"use client";

// LIBS
import { type ReactNode } from "react";
import { useSession } from "next-auth/react";

// TYPES
import { type UserRole } from "~/server/db/schema";

type ProtectedContentProps = {
  children: ReactNode;
  fallback?: ReactNode;
  authedRoles?: UserRole[] | undefined;
};

const ProtectedContent = ({
  children,
  fallback,
  authedRoles,
}: ProtectedContentProps) => {
  const { data: session } = useSession();

  const checkRoles = () => {
    if (!authedRoles) return true;
    if (session?.user?.role) {
      return authedRoles.includes(session.user.role);
    }
    return false;
  };
  const hasRole = checkRoles();

  if (fallback) {
    return hasRole ? children : fallback;
  }
  return hasRole ? children : <> </>;
};

export default ProtectedContent;
