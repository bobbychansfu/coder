"use client";

import { useEffect } from "react";

export default function ScrollbarHider() {
  useEffect(() => {
    document.documentElement.classList.add("scrollbar-hidden");
    document.body.classList.add("scrollbar-hidden");

    return () => {
      document.documentElement.classList.remove("scrollbar-hidden");
      document.body.classList.remove("scrollbar-hidden");
    };
  }, []);

  return null;
}
