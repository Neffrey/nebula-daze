// LIBS
import { type AwaitedReactNode, type ReactNode } from "react";
import { getServerAuthSession } from "~/server/auth";

// TYPES
import { type UserRole } from "~/server/db/schema";
import NotLoggedIn from "./not-logged-in";

type ProtectedContentProps = {
  children: ReactNode;
  fallback?: ReactNode;
  authedRoles?: UserRole[] | undefined;
};

const ProtectedContent = async ({
  children,
  fallback = <NotLoggedIn />,
  authedRoles,
}: ProtectedContentProps) => {
  const session = await getServerAuthSession();

  const checkRoles = () => {
    if (!authedRoles) return true;
    if (session?.user?.role) {
      return authedRoles.includes(session.user.role);
    }
    return false;
  };

  return checkRoles()
    ? (children as AwaitedReactNode)
    : (fallback as AwaitedReactNode);
};

export default ProtectedContent;
