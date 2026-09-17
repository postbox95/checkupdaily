import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CheckCircle2, CircleAlert, Plus, Search, Trash2 } from "lucide-react";
import type { DiagnosticCenter, LabChain, MedicalTest } from "@/data/seed";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  globalOf,
  seoBundleQueryOptions,
  seoRecordsQueryOptions,
  seoRedirectsQueryOptions,
  useDeleteRedirect,
  useDeleteSeoRecord,
  useSaveRedirect,
  useSaveSeoRecord,
} from "@/lib/seo.query";
import type {
  GlobalSeo,
  SeoEntityType,
  SeoFaq,
  SeoFields,
  SeoLang,
  SeoRecord,
} from "@/lib/seo.types";

interface SeoPanelProps {
  tests: MedicalTest[];
  chains: LabChain[];
  centers: DiagnosticCenter[];
  categories: readonly string[];
}

const pageOptions = [
  { key: "home", label: "Homepage" },
  { key: "compare", label: "Prescription comparison" },
];

const inputClass = "mt-1";

export function SeoPanel(props: SeoPanelProps) {
  return (
    <div className="mt-4">
      <Tabs defaultValue="global">
        <TabsList className="flex-wrap">
          <TabsTrigger value="global">Global SEO</TabsTrigger>
          <TabsTrigger value="content">Page & content SEO</TabsTrigger>
          <TabsTrigger value="redirects">Redirects</TabsTrigger>
        </TabsList>
        <TabsContent value="global"><GlobalEditor /></TabsContent>
        <TabsContent value="content"><EntityEditor {...props} /></TabsContent>
        <TabsContent value="redirects"><RedirectManager /></TabsContent>
      </Tabs>
    </div>
  );
}

function GlobalEditor() {
  const { data: bundle } = useSuspenseQuery(seoBundleQueryOptions);
  const [form, setForm] = useState<GlobalSeo>(() => globalOf(bundle));
  const save = useSaveSeoRecord();
  const set = <K extends keyof GlobalSeo>(key: K, value: GlobalSeo[K]) =>
    setForm((old) => ({ ...old, [key]: value }));
  const field = (key: keyof GlobalSeo, label: string, textarea = false) => (
    <div key={key} className={textarea ? "sm:col-span-2" : ""}>
      <Label htmlFor={`global-${key}`}>{label}</Label>
      {textarea ? (
        <Textarea id={`global-${key}`} className={inputClass} value={String(form[key])} onChange={(e) => setForm((old) => ({ ...old, [key]: e.target.value }))} />
      ) : (
        <Input id={`global-${key}`} className={inputClass} value={String(form[key])} onChange={(e) => setForm((old) => ({ ...old, [key]: e.target.value }))} />
      )}
    </div>
  );

  return (
    <div className="mt-4 space-y-4">
      <div className="surface-card grid gap-4 p-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <h2 className="text-base font-bold">Search identity and defaults</h2>
          <p className="mt-1 text-xs text-muted-foreground">Used whenever a page has no specific override.</p>
        </div>
        {field("siteName", "Site name")}
        {field("siteUrl", "Public site URL")}
        {field("defaultTitle", "Default title")}
        {field("defaultCanonical", "Default canonical URL")}
        {field("defaultDescription", "Default meta description", true)}
        {field("ogTitle", "Default social title")}
        {field("ogImage", "Default social image URL")}
        {field("ogDescription", "Default social description", true)}
        {field("faviconUrl", "Favicon URL")}
        <div>
          <Label htmlFor="global-card">Twitter card</Label>
          <select id="global-card" className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.twitterCard} onChange={(e) => set("twitterCard", e.target.value)}>
            <option value="summary_large_image">Large image</option>
            <option value="summary">Summary</option>
          </select>
        </div>
        <ToggleRow label="Allow search indexing" checked={form.robotsIndex} onChange={(v) => set("robotsIndex", v)} />
        <ToggleRow label="Allow crawlers to follow links" checked={form.robotsFollow} onChange={(v) => set("robotsFollow", v)} />
      </div>

      <div className="surface-card grid gap-4 p-5 sm:grid-cols-2">
        <div className="sm:col-span-2"><h2 className="text-base font-bold">Organization and language</h2></div>
        {field("orgEmail", "Organization email")}
        {field("orgPhone", "Organization phone")}
        {field("orgLogo", "Organization logo URL")}
        {field("orgAddress", "Organization address")}
        {field("socialProfiles", "Social profile URLs — one per line", true)}
        <div>
          <Label htmlFor="global-lang">Default language</Label>
          <select id="global-lang" className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.defaultLang} onChange={(e) => set("defaultLang", e.target.value as SeoLang)}>
            <option value="en">English</option><option value="bn">Bangla</option>
          </select>
        </div>
        {field("supportedLanguages", "Supported languages")}
      </div>

      <SeoPreview title={form.defaultTitle} description={form.defaultDescription} url={form.siteUrl} />
      <HealthCheck title={form.defaultTitle} description={form.defaultDescription} canonical={form.siteUrl} />
      <Button disabled={save.isPending} onClick={() => save.mutate({ entityType: "global", entityKey: "", lang: form.defaultLang, data: form })}>
        Save global SEO
      </Button>
    </div>
  );
}

function EntityEditor({ tests, chains, centers, categories }: SeoPanelProps) {
  const { data: records } = useSuspenseQuery(seoRecordsQueryOptions);
  const [type, setType] = useState<SeoEntityType>("test");
  const options = useMemo(() => {
    if (type === "page") return pageOptions;
    if (type === "test") return tests.map((x) => ({ key: x.code, label: x.canonicalName }));
    if (type === "chain") return chains.map((x) => ({ key: x.slug, label: x.name }));
    if (type === "center") return centers.map((x) => ({ key: x.slug, label: `${x.name} — ${x.branchName || x.thana}` }));
    if (type === "category") return categories.map((x) => ({ key: x.toLowerCase(), label: x }));
    return [];
  }, [type, tests, chains, centers, categories]);
  const [key, setKey] = useState("");
  const [lang, setLang] = useState<SeoLang>("en");
  const selectedKey = options.some((o) => o.key === key) ? key : (options[0]?.key ?? "");
  const record = records.find((r) => r.entityType === type && r.entityKey === selectedKey && r.lang === lang);

  return (
    <div className="mt-4 space-y-4">
      <div className="surface-card grid gap-3 p-4 sm:grid-cols-3">
        <div><Label>Content type</Label><select className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={type} onChange={(e) => { setType(e.target.value as SeoEntityType); setKey(""); }}><option value="page">Page</option><option value="test">Test</option><option value="chain">Lab chain</option><option value="center">Branch</option><option value="category">Category</option></select></div>
        <div><Label>Item</Label><select className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={selectedKey} onChange={(e) => setKey(e.target.value)}>{options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}</select></div>
        <div><Label>Language</Label><select className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={lang} onChange={(e) => setLang(e.target.value as SeoLang)}><option value="en">English</option><option value="bn">Bangla</option></select></div>
      </div>
      {selectedKey ? <SeoRecordEditor key={`${type}:${selectedKey}:${lang}:${record?.updatedAt ?? "new"}`} type={type} entityKey={selectedKey} lang={lang} record={record} /> : <p className="text-sm text-muted-foreground">No items are available for this content type.</p>}
    </div>
  );
}

function SeoRecordEditor({ type, entityKey, lang, record }: { type: SeoEntityType; entityKey: string; lang: SeoLang; record?: SeoRecord }) {
  const [form, setForm] = useState<SeoFields>(() => ({ robotsIndex: true, robotsFollow: true, includeInSitemap: true, twitterCard: "summary_large_image", faqs: [], ...(record?.data ?? {}) }));
  const save = useSaveSeoRecord();
  const del = useDeleteSeoRecord();
  const set = <K extends keyof SeoFields>(key: K, value: SeoFields[K]) => setForm((old) => ({ ...old, [key]: value }));
  const field = (key: keyof SeoFields, label: string, textarea = false) => (
    <div key={key} className={textarea ? "sm:col-span-2" : ""}><Label htmlFor={`seo-${key}`}>{label}</Label>{textarea ? <Textarea id={`seo-${key}`} rows={4} className={inputClass} value={String(form[key] ?? "")} onChange={(e) => set(key, e.target.value as never)} /> : <Input id={`seo-${key}`} className={inputClass} value={String(form[key] ?? "")} onChange={(e) => set(key, e.target.value as never)} />}</div>
  );
  const faqs = form.faqs ?? [];
  const updateFaq = (index: number, patch: Partial<SeoFaq>) => set("faqs", faqs.map((f, i) => i === index ? { ...f, ...patch } : f));
  const canonical = form.canonicalUrl || defaultPath(type, form.slug || entityKey);

  return (
    <div className="space-y-4">
      <div className="surface-card grid gap-4 p-5 sm:grid-cols-2">
        <div className="flex items-center justify-between gap-3 sm:col-span-2"><div><h2 className="text-base font-bold">Search appearance</h2><p className="text-xs text-muted-foreground">Empty fields use the automatic catalogue fallback.</p></div>{record && <Badge variant="secondary">Override saved</Badge>}</div>
        {field("title", "SEO title")}{field("slug", "Custom URL slug")}{field("metaDescription", "Meta description", true)}{field("canonicalUrl", "Canonical URL")}{field("primaryKeyword", "Primary keyword")}{field("secondaryKeywords", "Secondary keywords")}
        <ToggleRow label="Index this page" checked={form.robotsIndex !== false} onChange={(v) => set("robotsIndex", v)} />
        <ToggleRow label="Follow links" checked={form.robotsFollow !== false} onChange={(v) => set("robotsFollow", v)} />
        <ToggleRow label="Include in sitemap" checked={form.includeInSitemap !== false} onChange={(v) => set("includeInSitemap", v)} />
      </div>
      <div className="surface-card grid gap-4 p-5 sm:grid-cols-2"><div className="sm:col-span-2"><h2 className="text-base font-bold">Social sharing</h2></div>{field("ogTitle", "Open Graph title")}{field("ogImage", "Open Graph image URL")}{field("ogDescription", "Open Graph description", true)}{field("twitterTitle", "Twitter title")}{field("twitterImage", "Twitter image URL")}{field("twitterDescription", "Twitter description", true)}</div>
      <div className="surface-card grid gap-4 p-5 sm:grid-cols-2"><div className="sm:col-span-2"><h2 className="text-base font-bold">Editorial content</h2><p className="text-xs text-muted-foreground">Shown only on templates that support the selected field.</p></div>{field("intro", "Introduction", true)}{field("about", "About", true)}{field("howItWorks", "How it works", true)}{field("preparation", "Preparation", true)}{field("whyPricesDiffer", "Why prices differ", true)}</div>
      <div className="surface-card space-y-3 p-5"><div className="flex items-center justify-between"><div><h2 className="text-base font-bold">Frequently asked questions</h2><p className="text-xs text-muted-foreground">Valid question-and-answer pairs also produce structured data.</p></div><Button size="sm" variant="outline" onClick={() => set("faqs", [...faqs, { q: "", a: "" }])}><Plus className="size-4" aria-hidden /> Add FAQ</Button></div>{faqs.map((faq, i) => <div key={i} className="grid gap-2 border-t border-border pt-3 sm:grid-cols-[1fr_1.5fr_auto]"><Input aria-label={`FAQ ${i + 1} question`} placeholder="Question" value={faq.q} onChange={(e) => updateFaq(i, { q: e.target.value })} /><Textarea aria-label={`FAQ ${i + 1} answer`} placeholder="Answer" value={faq.a} onChange={(e) => updateFaq(i, { a: e.target.value })} /><Button size="icon" variant="ghost" aria-label={`Remove FAQ ${i + 1}`} onClick={() => set("faqs", faqs.filter((_, n) => n !== i))}><Trash2 className="size-4" /></Button></div>)}{!faqs.length && <p className="text-sm text-muted-foreground">No FAQs added.</p>}</div>
      <SeoPreview title={form.title || "Automatic page title"} description={form.metaDescription || "Automatic description from catalogue data."} url={canonical} />
      <HealthCheck title={form.title ?? ""} description={form.metaDescription ?? ""} canonical={canonical} allowFallback />
      <div className="flex gap-2"><Button disabled={save.isPending} onClick={() => save.mutate({ entityType: type, entityKey, lang, data: form })}>Save SEO override</Button>{record && <Button variant="outline" disabled={del.isPending} onClick={() => del.mutate(record.id)}>Remove override</Button>}</div>
    </div>
  );
}

function RedirectManager() {
  const { data: rows } = useSuspenseQuery(seoRedirectsQueryOptions);
  const save = useSaveRedirect();
  const del = useDeleteRedirect();
  const [fromPath, setFromPath] = useState("");
  const [toPath, setToPath] = useState("");
  const [statusCode, setStatusCode] = useState(301);
  return <div className="mt-4 space-y-4"><div className="surface-card grid gap-3 p-4 sm:grid-cols-[1fr_1fr_120px_auto]"><div><Label htmlFor="redirect-from">Old path</Label><Input id="redirect-from" className="mt-1" placeholder="/old-page" value={fromPath} onChange={(e) => setFromPath(e.target.value)} /></div><div><Label htmlFor="redirect-to">Destination</Label><Input id="redirect-to" className="mt-1" placeholder="/new-page" value={toPath} onChange={(e) => setToPath(e.target.value)} /></div><div><Label htmlFor="redirect-code">Type</Label><select id="redirect-code" className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={statusCode} onChange={(e) => setStatusCode(Number(e.target.value))}><option value={301}>301 permanent</option><option value={302}>302 temporary</option></select></div><Button className="self-end" disabled={!fromPath.trim() || !toPath.trim() || save.isPending} onClick={() => save.mutate({ fromPath, toPath, statusCode, isActive: true }, { onSuccess: () => { setFromPath(""); setToPath(""); } })}>Add redirect</Button></div><div className="surface-card divide-y divide-border">{rows.map((row) => <div key={row.id} className="flex flex-wrap items-center gap-3 p-3 text-sm"><Badge variant={row.isActive ? "default" : "secondary"}>{row.statusCode}</Badge><span className="min-w-0 flex-1 break-all">{row.fromPath} <span className="text-muted-foreground">→</span> {row.toPath}</span><Button size="sm" variant="outline" onClick={() => save.mutate({ id: row.id, fromPath: row.fromPath, toPath: row.toPath, statusCode: row.statusCode, isActive: !row.isActive })}>{row.isActive ? "Disable" : "Enable"}</Button><Button size="icon" variant="ghost" aria-label={`Delete redirect ${row.fromPath}`} onClick={() => del.mutate(row.id)}><Trash2 className="size-4" /></Button></div>)}{!rows.length && <p className="p-4 text-sm text-muted-foreground">No redirects configured.</p>}</div></div>;
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex items-center gap-3 rounded-md border border-border p-3 text-sm font-medium"><Switch checked={checked} onCheckedChange={onChange} /><span>{label}</span></label>;
}

function SeoPreview({ title, description, url }: { title: string; description: string; url: string }) {
  return <section className="surface-card p-5" aria-label="Search preview"><div className="mb-3 flex items-center gap-2 text-sm font-bold"><Search className="size-4" /> Google preview</div><div className="max-w-2xl font-sans"><p className="truncate text-xs text-muted-foreground">{url || "https://med-compare-bd.lovable.app"}</p><p className="mt-1 text-xl text-primary">{title || "Page title"}</p><p className="mt-1 text-sm text-muted-foreground">{description || "Page description"}</p></div></section>;
}

function HealthCheck({ title, description, canonical, allowFallback = false }: { title: string; description: string; canonical: string; allowFallback?: boolean }) {
  const checks = [{ ok: allowFallback || (title.length >= 30 && title.length <= 60), text: allowFallback && !title ? "Title uses automatic fallback" : `Title length: ${title.length}/60` }, { ok: allowFallback || (description.length >= 120 && description.length <= 160), text: allowFallback && !description ? "Description uses automatic fallback" : `Description length: ${description.length}/160` }, { ok: /^https:\/\//.test(canonical) || canonical.startsWith("/"), text: "Canonical URL is valid" }];
  return <section className="surface-card p-5"><h2 className="text-sm font-bold">SEO health check</h2><ul className="mt-3 grid gap-2 sm:grid-cols-3">{checks.map((c) => <li key={c.text} className="flex items-center gap-2 text-xs">{c.ok ? <CheckCircle2 className="size-4 text-success" /> : <CircleAlert className="size-4 text-warning" />} {c.text}</li>)}</ul></section>;
}

function defaultPath(type: SeoEntityType, key: string) {
  if (type === "page") return key === "home" ? "/" : `/${key}`;
  if (type === "test") return `/tests/${key}`;
  if (type === "chain") return `/chain/${key}`;
  if (type === "center") return `/lab/${key}`;
  if (type === "category") return `/category/${key}`;
  return "/";
}