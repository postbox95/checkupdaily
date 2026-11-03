import { Link } from "@tanstack/react-router";
import { Phone, Stethoscope } from "lucide-react";
import { useCatalog } from "@/lib/catalog";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";

export function SiteFooter() {
  const lang = useAppStore((s) => s.lang);
  const { chains, settings, tests } = useCatalog();
  const popularTests = tests.filter((x) => x.isPopular).slice(0, 6);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-border/70 bg-muted/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link to="/" className="flex items-center gap-2" aria-label={t("brand", lang)}>
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Stethoscope className="size-5" aria-hidden />
            </span>
            <span className="text-base font-bold tracking-tight">
              {settings.siteName || t("brand", lang)}
            </span>
          </Link>
          <p className="mt-3 text-xs/relaxed text-muted-foreground">
            {settings.tagline || t("heroSub", lang)}
          </p>
          {settings.supportPhone && (
            <a
              href={`tel:${settings.supportPhone}`}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary"
            >
              <Phone className="size-3.5" aria-hidden /> {settings.supportPhone}
            </a>
          )}
        </div>

        <nav aria-label="Explore">
          <h2 className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
            Explore
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link to="/" className="text-muted-foreground transition-colors hover:text-foreground">
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/labs"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Test Labs
              </Link>
            </li>
            <li>
              <Link
                to="/compare"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Compare prices
              </Link>
            </li>
            <li>
              <Link
                to="/about"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                About us
              </Link>
            </li>

          </ul>
        </nav>

        <nav aria-label="Lab chains">
          <h2 className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
            Lab chains
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {chains.slice(0, 6).map((c) => (
              <li key={c.id}>
                <Link
                  to="/chain/$slug"
                  params={{ slug: c.slug }}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Popular tests">
          <h2 className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
            Popular tests
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {popularTests.map((test) => (
              <li key={test.id}>
                <Link
                  to="/tests/$slug"
                  params={{ slug: test.code }}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {test.canonicalName}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {settings.siteName || "MyTestReport"}. Prices are collected from published lab
            rate cards — always confirm with the lab before your visit.
          </p>
          <p>Made for Dhaka patients 🇧🇩</p>
        </div>
      </div>
    </footer>
  );
}
