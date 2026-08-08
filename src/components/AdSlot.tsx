import { useAds } from "@/lib/ads";
import type { AdBanner } from "@/lib/ads.types";

function Banner({ ad }: { ad: AdBanner }) {
  const img = (
    <img
      src={ad.imageUrl}
      alt={ad.altText || ad.title || "Advertisement"}
      loading="lazy"
      className="h-auto w-full rounded-xl border border-border object-cover"
    />
  );
  return (
    <div className="relative">
      <span className="absolute right-2 top-2 rounded-md bg-background/85 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Ad
      </span>
      {ad.linkUrl ? (
        <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer sponsored" className="block">
          {img}
        </a>
      ) : (
        img
      )}
    </div>
  );
}

/** Renders every live banner an admin has assigned to this slot. */
export function AdSlot({ placement, className = "" }: { placement: string; className?: string }) {
  const ads = useAds(placement);
  if (!ads.length) return null;
  return (
    <div className={`grid gap-3 ${className}`}>
      {ads.map((ad) => (
        <Banner key={ad.id} ad={ad} />
      ))}
    </div>
  );
}
