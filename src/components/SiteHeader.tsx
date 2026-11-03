import { Link, useRouterState } from "@tanstack/react-router";
import { MapPin, Stethoscope } from "lucide-react";
import { useState } from "react";
import { TestSearch } from "@/components/TestSearch";
import { LabsMenu } from "@/components/LabsMenu";
import { useCatalog } from "@/lib/catalog";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

export function SiteHeader() {
  const { lang, setLang, thana, setThana } = useAppStore();
  const [open, setOpen] = useState(false);
  const { thanas, settings } = useCatalog();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const showSearch = pathname !== "/";

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link to="/" className="flex items-center gap-2" aria-label={t("brand", lang)}>
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Stethoscope className="size-5" aria-hidden />
          </span>
          <span className="hidden text-base font-bold tracking-tight sm:block">
            {settings.siteName || t("brand", lang)}
          </span>
        </Link>

        <nav className="ml-auto flex items-center gap-2" aria-label="Main">
          <LabsMenu />

          <Link
            to="/about"
            className={`hidden rounded-lg px-2.5 py-1.5 text-sm font-semibold transition-colors sm:inline-flex ${
              pathname === "/about"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            About
          </Link>


          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5" aria-label={t("location", lang)}>
                <MapPin className="size-4 text-primary" aria-hidden />
                <span className="max-w-28 truncate text-xs font-semibold sm:text-sm">
                  Dhaka · {thana}
                </span>
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Select your area in Dhaka</DrawerTitle>
              </DrawerHeader>
              <div className="grid max-h-[60vh] grid-cols-2 gap-2 overflow-y-auto px-4 pb-8 sm:grid-cols-3">
                {[...thanas]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(({ name: area }) => (
                  <button
                    key={area}
                    onClick={() => {
                      setThana(area);
                      setOpen(false);
                    }}
                    aria-pressed={thana === area}
                    className={`rounded-xl border px-3 py-3 text-left text-sm font-medium transition-colors ${
                      thana === area
                        ? "border-primary bg-accent text-accent-foreground"
                        : "border-border bg-card hover:bg-muted"
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </DrawerContent>
          </Drawer>

          <div
            className="flex items-center rounded-lg border border-border bg-card p-0.5"
            role="group"
            aria-label="Language"
          >
            {(["en", "bn"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={`w-11 rounded-md px-2 py-1 text-xs font-bold transition-colors ${
                  lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {l === "en" ? "EN" : "বাং"}
              </button>
            ))}
          </div>
        </nav>
      </div>

      {showSearch && (
        <div className="border-t border-border/60 bg-background/70 px-4 pb-2.5 pt-2">
          <div className="mx-auto max-w-3xl">
            <TestSearch compact />
          </div>
        </div>
      )}
    </header>
  );
}
