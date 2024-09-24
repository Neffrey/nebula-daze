"use client";

// LIBRARIES
import { type ReactNode, useEffect, useState } from "react";

// PROPS
interface OnRenderProps {
  children: ReactNode;
  fallback?: ReactNode | undefined;
}

// COMPONENT
const UseOnRender = ({ children, fallback }: OnRenderProps) => {
  // State
  const [rendered, setRendered] = useState(false);

  // Helpers
  const render = () => {
    setRendered(true);
  };

  // Effect
  useEffect(() => {
    render();
  }, []);

  return <>{rendered ? children : fallback ? fallback : null}</>;
};
export default UseOnRender;
