import { useEffect, useState } from "react";
import { TestSearch } from "@/components/TestSearch";

/** Compact search bar that slides in under the header once the hero scrolls away. */
export function StickySearch() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 360);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden={!show}
      className={`fixed inset-x-0 top-16 z-30 border-b border-border/70 bg-background/90 px-4 py-2.5 backdrop-blur-md transition-all duration-200 ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-3 opacity-0"
      }`}
    >
      <div className="mx-auto max-w-2xl">
        <TestSearch />
      </div>
    </div>
  );
}
