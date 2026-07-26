import { Link } from "@tanstack/react-router";
import { ShoppingBag, Trash2, TriangleAlert, Utensils } from "lucide-react";
import { useState } from "react";
import { testById } from "@/data/seed";
import { redundancyWarning } from "@/lib/search";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

export function CartBar() {
  const { cart, lang, removeFromCart, clearCart } = useAppStore();
  const [open, setOpen] = useState(false);
  if (cart.length === 0) return null;

  const items = cart.map((id) => testById(id)!).filter(Boolean);
  const fasting = items.filter((i) => i.fastingRequired);
  const warning = redundancyWarning(items.map((i) => i.code));

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 p-3 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:p-0">
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-3 rounded-2xl bg-primary px-5 py-3.5 text-primary-foreground shadow-[var(--shadow-float)] transition-transform hover:scale-[1.02] sm:w-auto"
          aria-label={`${t("cart", lang)}, ${cart.length} tests`}
        >
          <ShoppingBag className="size-5" aria-hidden />
          <span className="text-sm font-semibold">
            {t("cart", lang)} ({cart.length})
          </span>
          <span className="ml-auto text-sm font-bold opacity-90">View savings →</span>
        </button>
      </div>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {t("cart", lang)} · {items.length} tests
            </DrawerTitle>
          </DrawerHeader>
          <div className="space-y-2 px-4">
            {items.map((test) => (
              <div
                key={test.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{test.canonicalName}</p>
                  <p className="truncate text-xs text-muted-foreground" data-lang="bn">
                    {test.banglaName}
                  </p>
                </div>
                <button
                  onClick={() => removeFromCart(test.id)}
                  aria-label={`Remove ${test.canonicalName}`}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            ))}

            {fasting.length > 0 && (
              <p className="flex gap-2 rounded-xl bg-warning/15 px-3 py-2.5 text-xs font-medium text-warning-foreground">
                <Utensils className="mt-0.5 size-4 shrink-0" aria-hidden />
                Includes fasting tests ({fasting.map((f) => f.canonicalName).join(", ")}). Plan an
                early morning visit on an empty stomach.
              </p>
            )}
            {warning && (
              <p className="flex gap-2 rounded-xl bg-accent px-3 py-2.5 text-xs font-medium text-accent-foreground">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                {warning}
              </p>
            )}
          </div>
          <div className="flex gap-2 p-4 pb-8">
            <Button variant="outline" onClick={clearCart}>
              Clear
            </Button>
            <Button asChild className="flex-1">
              <Link to="/compare" onClick={() => setOpen(false)}>
                {t("compare", lang)}
              </Link>
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
