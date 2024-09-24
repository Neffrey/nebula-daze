// LIBS
import { type RefObject, useEffect, useState } from "react";

const useElementDimensions = (ref: RefObject<HTMLDivElement>) => {
  const [elementDimensions, setElementDimensions] = useState({
    elementWidth: ref?.current?.clientWidth ? ref.current.clientWidth : 0,
    elementHeight: ref?.current?.clientHeight ? ref.current.clientHeight : 0,
  });

  useEffect(() => {
    const handleEleResize = () => {
      if (ref.current) {
        setElementDimensions({
          elementWidth: ref.current.clientWidth,
          elementHeight: ref.current.clientHeight,
        });
      }
    };
    handleEleResize();
    window.addEventListener("resize", handleEleResize);
    return () => window.removeEventListener("resize", handleEleResize);
  }, [ref]);

  return elementDimensions;
};

export default useElementDimensions;
