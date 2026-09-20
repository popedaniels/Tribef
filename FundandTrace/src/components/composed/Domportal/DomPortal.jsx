import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

const DomPortal = ({ children }) => {
  // Render nothing on the server and during the first client pass so the
  // hydrated HTML matches the server output; mount the portal afterwards.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === "undefined") return null;
  return createPortal(children, document.querySelector("#__next"));
};

export default DomPortal;
