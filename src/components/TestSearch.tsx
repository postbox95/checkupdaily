import { useNavigate } from "@tanstack/react-router";
import { Clock, Plus, Search, Utensils } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { MedicalTest } from "@/data/seed";
import { useCatalog } from "@/lib/catalog";
import { redundancyWarning, searchTests } from "@/lib/search";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";

const categoryLabel: Record<string, string> = {
  PATHOLOGY: "Pathology",
  RADIOLOGY: "Radiology",
  CARDIOLOGY: "Cardiology",
  ENDOSCOPY: "Endoscopy",
  OTHER: "Other",
};

export function TestSearch({ autoFocus = false }: { autoFocus?: boolean }) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { lang, cart, addToCart } = useAppStore();
  const { tests } = useCatalog();

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 60);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const results = useMemo(() => searchTests(tests, debounced), [tests, debounced]);

  const quickAdd = (test: MedicalTest) => {
    if (cart.includes(test.id)) {
      toast.info(`${test.canonicalName} is already in your prescription cart.`);
      return;
    }
    addToCart(test.id);
    const codes = [...cart, test.id]
      .map((id) => tests.find((x: MedicalTest) => x.id === id)?.code)
      .filter(Boolean) as string[];
    const warn = redundancyWarning(tests, codes);
    if (warn) toast.warning(warn);
    else toast.success(`${test.canonicalName} added to prescription cart.`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      navigate({ to: "/test/$code", params: { code: results[active].code } });
      setOpen(false);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={boxRef} className="relative w-full text-foreground">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-[var(--shadow-card)] focus-within:ring-2 focus-within:ring-ring/60">
        <Search className="size-5 shrink-0 text-primary" aria-hidden />
        <input
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls="test-search-listbox"
          aria-autocomplete="list"
          aria-label="Search medical tests"
          placeholder={t("searchPlaceholder", lang)}
          className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
        />
      </div>

      {open && results.length > 0 && (
        <ul
          id="test-search-listbox"
          role="listbox"
          className="absolute z-50 mt-2 max-h-[22rem] w-full overflow-auto rounded-2xl border border-border bg-popover p-1.5 shadow-[var(--shadow-float)]"
        >
          {results.map((test, i) => (
            <li key={test.id} role="option" aria-selected={i === active}>
              <div
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                  i === active ? "bg-accent" : ""
                }`}
                onMouseEnter={() => setActive(i)}
              >
                <button
                  className="min-w-0 flex-1 text-left"
                  onClick={() => {
                    navigate({ to: "/test/$code", params: { code: test.code } });
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">{test.canonicalName}</span>
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      {categoryLabel[test.category]}
                    </Badge>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span data-lang="bn">{test.banglaName}</span>
                    {test.fastingRequired && (
                      <span className="inline-flex items-center gap-1 text-warning-foreground">
                        <Utensils className="size-3" aria-hidden />
                        Fasting {test.fastingHours} hrs
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3" aria-hidden />
                      Report in {test.reportDeliveryHrs} hrs
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => quickAdd(test)}
                  aria-label={`Quick add ${test.canonicalName} to prescription cart`}
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform hover:scale-105"
                >
                  <Plus className="size-4" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
