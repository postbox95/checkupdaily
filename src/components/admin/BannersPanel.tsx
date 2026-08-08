import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { ExternalLink, Trash2, Upload } from "lucide-react";
import { adminAdsQuery, useDeleteAd, useSaveAd, useUploadAdImage } from "@/lib/ads";
import { AD_PLACEMENTS, adIsLive, placementLabel, type AdBanner } from "@/lib/ads.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface Draft {
  id: string | null;
  placement: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  altText: string;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  sortOrder: number;
}

const toLocal = (iso: string | null) =>
  iso ? new Date(iso).toISOString().slice(0, 16) : "";

const emptyDraft = (): Draft => ({
  id: null,
  placement: AD_PLACEMENTS[0].value,
  title: "",
  imageUrl: "",
  linkUrl: "",
  altText: "",
  startsAt: "",
  expiresAt: "",
  isActive: true,
  sortOrder: 0,
});

const fromAd = (a: AdBanner): Draft => ({
  id: a.id,
  placement: a.placement,
  title: a.title,
  imageUrl: a.imageUrl,
  linkUrl: a.linkUrl,
  altText: a.altText,
  startsAt: toLocal(a.startsAt),
  expiresAt: toLocal(a.expiresAt),
  isActive: a.isActive,
  sortOrder: a.sortOrder,
});

export function BannersPanel() {
  const { data: ads = [], isLoading } = useQuery(adminAdsQuery);
  const [draft, setDraft] = useState<Draft | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const save = useSaveAd(() => setDraft(null));
  const remove = useDeleteAd();
  const upload = useUploadAdImage();

  const grouped = useMemo(() => {
    return AD_PLACEMENTS.map((p) => ({
      ...p,
      items: ads.filter((a) => a.placement === p.value),
    })).filter((g) => g.items.length > 0);
  }, [ads]);

  const set = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  const submit = () => {
    if (!draft) return;
    save.mutate({
      id: draft.id,
      values: {
        placement: draft.placement,
        title: draft.title.trim(),
        imageUrl: draft.imageUrl,
        linkUrl: draft.linkUrl.trim(),
        altText: draft.altText.trim(),
        startsAt: draft.startsAt ? new Date(draft.startsAt).toISOString() : null,
        expiresAt: draft.expiresAt ? new Date(draft.expiresAt).toISOString() : null,
        isActive: draft.isActive,
        sortOrder: draft.sortOrder,
      },
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h2 className="text-lg font-bold tracking-tight">Ad banners</h2>
          <p className="text-xs text-muted-foreground">
            Upload a banner image, choose where it appears, add an optional destination link and an
            expiry date. Expired or unpublished banners disappear from the site automatically.
          </p>
        </div>
        <Button size="sm" onClick={() => setDraft(emptyDraft())}>
          New banner
        </Button>
      </div>

      {draft && (
        <div className="surface-card space-y-4 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Placement</Label>
              <select
                value={draft.placement}
                onChange={(e) => set({ placement: e.target.value })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {AD_PLACEMENTS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Internal title</Label>
              <Input
                value={draft.title}
                onChange={(e) => set({ title: e.target.value })}
                placeholder="e.g. Popular Diagnostic — Ramadan offer"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Destination URL (optional)</Label>
              <Input
                value={draft.linkUrl}
                onChange={(e) => set({ linkUrl: e.target.value })}
                placeholder="https://example.com/offer"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Image alt text</Label>
              <Input
                value={draft.altText}
                onChange={(e) => set({ altText: e.target.value })}
                placeholder="Describe the banner for screen readers"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Starts at (optional)</Label>
              <Input
                type="datetime-local"
                value={draft.startsAt}
                onChange={(e) => set({ startsAt: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Expires at (optional)</Label>
              <Input
                type="datetime-local"
                value={draft.expiresAt}
                onChange={(e) => set({ expiresAt: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Sort order</Label>
              <Input
                type="number"
                value={draft.sortOrder}
                onChange={(e) => set({ sortOrder: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch
                checked={draft.isActive}
                onCheckedChange={(v) => set({ isActive: v })}
                id="ad-active"
              />
              <Label htmlFor="ad-active">Published</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Banner image</Label>
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const res = await upload.mutateAsync(file);
                  set({ imageUrl: res.url });
                  if (fileRef.current) fileRef.current.value = "";
                }}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={upload.isPending}
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="mr-1.5 size-4" aria-hidden />
                {upload.isPending ? "Uploading…" : draft.imageUrl ? "Replace image" : "Upload image"}
              </Button>
              {draft.imageUrl && (
                <img
                  src={draft.imageUrl}
                  alt="Banner preview"
                  className="h-16 rounded-md border border-border object-contain"
                />
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={submit} disabled={save.isPending || !draft.imageUrl}>
              Save banner
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDraft(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Loading banners…</p>}
      {!isLoading && ads.length === 0 && (
        <p className="surface-card p-6 text-sm text-muted-foreground">
          No ad banners yet. Create one to start showing ads on the site.
        </p>
      )}

      {grouped.map((group) => (
        <div key={group.value} className="space-y-2">
          <h3 className="text-sm font-bold">{group.label}</h3>
          <ul className="space-y-2">
            {group.items.map((ad) => (
              <li key={ad.id} className="surface-card flex flex-wrap items-center gap-3 p-3">
                <img
                  src={ad.imageUrl}
                  alt={ad.altText || ad.title}
                  className="h-12 w-24 rounded-md border border-border object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold">
                      {ad.title || "Untitled banner"}
                    </span>
                    {adIsLive(ad) ? (
                      <Badge className="bg-success/20 text-accent-foreground">Live</Badge>
                    ) : (
                      <Badge variant="secondary">
                        {!ad.isActive
                          ? "Unpublished"
                          : ad.expiresAt && new Date(ad.expiresAt) <= new Date()
                            ? "Expired"
                            : "Scheduled"}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {placementLabel(ad.placement)}
                    {ad.expiresAt && ` · expires ${new Date(ad.expiresAt).toLocaleString()}`}
                  </p>
                </div>
                {ad.linkUrl && (
                  <a
                    href={ad.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Open destination link"
                  >
                    <ExternalLink className="size-4" aria-hidden />
                  </a>
                )}
                <Button size="sm" variant="outline" onClick={() => setDraft(fromAd(ad))}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label="Delete banner"
                  onClick={() => {
                    if (confirm("Delete this banner?")) remove.mutate(ad.id);
                  }}
                >
                  <Trash2 className="size-4 text-destructive" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
