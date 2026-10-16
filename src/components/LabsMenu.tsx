import { Link } from "@tanstack/react-router";
import { ChevronDown, FlaskConical, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useCatalog } from "@/lib/catalog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** Navbar dropdown listing lab chains with a quick search; scrolls after the first 5. */
export function LabsMenu() {
  const { chains, centers } = useCatalog();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return chains
      .map((c) => ({ chain: c, count: centers.filter((b) => b.labChainId === c.id).length }))
      .filter(({ chain }) => !term || chain.name.toLowerCase().includes(term))
      .sort((a, b) => b.count - a.count || a.chain.name.localeCompare(b.chain.name));
  }, [chains, centers, q]);

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQ(""); }}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <span className="hidden sm:inline">Test Labs</span>
          <FlaskConical className="size-4 sm:hidden" aria-label="Test Labs" />
          <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border p-2">
          <div className="flex items-center gap-2 rounded-md border border-input bg-background px-2">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search labs…"
              aria-label="Search labs"
              className="h-9 w-full min-w-0 bg-transparent text-sm outline-none"
            />
          </div>
        </div>
        {/* ~5 rows visible, rest scroll */}
        <ul className="max-h-[17rem] overflow-y-auto p-1">
          {list.map(({ chain, count }) => (
            <li key={chain.id}>
              <Link
                to="/chain/$slug"
                params={{ slug: chain.slug }}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted"
              >
                <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-card">
                  {chain.logoUrl ? (
                    <img src={chain.logoUrl} alt="" className="size-full object-contain" />
                  ) : (
                    <span className="text-xs font-bold text-primary">{chain.name.slice(0, 2)}</span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{chain.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {count} {count === 1 ? "branch" : "branches"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
          {list.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">No labs match.</li>
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
