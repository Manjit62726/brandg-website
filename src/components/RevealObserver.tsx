"use client";

import { useEffect } from "react";

export default function RevealObserver() {
  useEffect(() => {
    const ro = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("vis");
            ro.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" }
    );

    document.querySelectorAll(".rev").forEach((el) => ro.observe(el));
    return () => ro.disconnect();
  }, []);

  return null;
}
