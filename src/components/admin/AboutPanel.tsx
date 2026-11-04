import { useRef, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ImagePlus, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  aboutContentQuery,
  useSaveAbout,
  useUploadAboutImage,
  type AboutContent,
  type AboutItem,
} from "@/lib/about";

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 4,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} />
    </div>
  );
}

function ItemsEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: AboutItem[];
  onChange: (items: AboutItem[]) => void;
}) {
  const update = (i: number, patch: Partial<AboutItem>) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {items.map((it, i) => (
        <div key={i} className="grid gap-2 rounded-xl border border-border/60 p-3 sm:grid-cols-[1fr_2fr_auto]">
          <Input
            value={it.title}
            onChange={(e) => update(i, { title: e.target.value })}
            placeholder="Title"
          />
          <Input
            value={it.body}
            onChange={(e) => update(i, { body: e.target.value })}
            placeholder="Description"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            aria-label="Remove item"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...items, { title: "", body: "" }])}
      >
        <Plus className="size-4" aria-hidden /> Add item
      </Button>
    </div>
  );
}

export function AboutPanel() {
  const { data: about } = useSuspenseQuery(aboutContentQuery);
  const [draft, setDraft] = useState<AboutContent>(about);
  const save = useSaveAbout();
  const upload = useUploadAboutImage();
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof AboutContent>(key: K, value: AboutContent[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Everything on the public <a href="/about" className="underline" target="_blank" rel="noreferrer">About Us page</a> is editable here. Leave a field empty to hide that block.
      </p>

      {/* Founder image */}
      <div className="surface-card space-y-3 p-4">
        <h3 className="text-sm font-bold">Founder image</h3>
        <div className="flex flex-wrap items-center gap-4">
          {draft.founderImageUrl ? (
            <img
              src={draft.founderImageUrl}
              alt="Founder preview"
              className="size-24 rounded-xl border border-border object-contain"
            />
          ) : null}
          <div className="space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const res = await upload.mutateAsync(file);
                set("founderImageUrl", res.url);
                if (fileRef.current) fileRef.current.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={upload.isPending}
              onClick={() => fileRef.current?.click()}
            >
              <ImagePlus className="size-4" aria-hidden />
              {upload.isPending ? "Uploading…" : "Upload new image"}
            </Button>
            <Input
              value={draft.founderImageUrl}
              onChange={(e) => set("founderImageUrl", e.target.value)}
              placeholder="Or paste an image URL"
            />
          </div>
        </div>
        <TextField
          label="Image alt text"
          value={draft.founderImageAlt}
          onChange={(v) => set("founderImageAlt", v)}
        />
      </div>

      {/* Hero */}
      <div className="surface-card grid gap-3 p-4 sm:grid-cols-2">
        <h3 className="text-sm font-bold sm:col-span-2">Top of the page</h3>
        <TextField label="Badge label" value={draft.badgeLabel} onChange={(v) => set("badgeLabel", v)} />
        <TextField label="Main heading" value={draft.heading} onChange={(v) => set("heading", v)} />
        <TextArea
          label="Intro paragraph"
          value={draft.intro}
          onChange={(v) => set("intro", v)}
          rows={3}
        />
        <TextField label="Founder name" value={draft.founderName} onChange={(v) => set("founderName", v)} />
        <TextField
          label="Founder title line"
          value={draft.founderTitle}
          onChange={(v) => set("founderTitle", v)}
        />
      </div>

      {/* Story */}
      <div className="surface-card space-y-3 p-4">
        <h3 className="text-sm font-bold">Founder story</h3>
        <TextField label="Story heading" value={draft.storyHeading} onChange={(v) => set("storyHeading", v)} />
        <TextArea
          label="Story paragraphs"
          hint="Separate paragraphs with a blank line. Wrap words in **double asterisks** to make them bold."
          value={draft.story.join("\n\n")}
          onChange={(v) => set("story", v.split(/\n\s*\n/).filter((p) => p.trim()))}
          rows={10}
        />
        <TextArea label="Quote" value={draft.quote} onChange={(v) => set("quote", v)} rows={3} />
        <TextField label="Quote attribution" value={draft.quoteBy} onChange={(v) => set("quoteBy", v)} />
      </div>

      {/* Lists */}
      <div className="surface-card space-y-4 p-4">
        <h3 className="text-sm font-bold">Content lists</h3>
        <TextField label="What we do — heading" value={draft.whatHeading} onChange={(v) => set("whatHeading", v)} />
        <TextArea
          label="What we do — intro"
          value={draft.whatIntro}
          onChange={(v) => set("whatIntro", v)}
          rows={2}
        />
        <ItemsEditor label="What we do — items" items={draft.whatItems} onChange={(v) => set("whatItems", v)} />
        <TextField
          label="Promise section — heading"
          value={draft.pledgeHeading}
          onChange={(v) => set("pledgeHeading", v)}
        />
        <ItemsEditor
          label="Promise section — items"
          items={draft.pledgeItems}
          onChange={(v) => set("pledgeItems", v)}
        />
      </div>

      {/* CTA */}
      <div className="surface-card grid gap-3 p-4 sm:grid-cols-2">
        <h3 className="text-sm font-bold sm:col-span-2">Bottom contact section</h3>
        <TextField label="Heading" value={draft.ctaHeading} onChange={(v) => set("ctaHeading", v)} />
        <TextField
          label="Contact email"
          value={draft.ctaEmail}
          onChange={(v) => set("ctaEmail", v)}
        />
        <TextArea label="Body text" value={draft.ctaBody} onChange={(v) => set("ctaBody", v)} rows={3} />
      </div>

      <Button
        type="button"
        variant="success"
        disabled={save.isPending}
        onClick={() => save.mutate(draft)}
      >
        <Save className="size-4" aria-hidden />
        {save.isPending ? "Saving…" : "Save About page"}
      </Button>
    </div>
  );
}
