import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Suspense, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { claimAdmin } from "@/lib/catalog.functions";
import {
  accessQuery,
  staffQuery,
  useAdminCatalog,
  useAdminInvalidate,
  useBulkAdjust,
  useDeleteRecord,
  useSaveRecord,
  useSaveSettings,
  useSetUserRole,
  useUpsertPrice,
} from "@/lib/admin";
import { TEST_CATEGORIES, type DiagnosticCenter, type MedicalTest, type Thana } from "@/data/seed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Content Manager — Niramoy Prices Admin" },
      { name: "description", content: "Manage tests, labs, prices, areas and site settings." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Content Manager — Niramoy Prices Admin" },
      { property: "og:description", content: "Admin CMS for the Niramoy Prices catalogue." },
    ],
  }),
  component: () => (
    <Suspense fallback={<p className="p-10 text-sm text-muted-foreground">Loading admin…</p>}>
      <AdminGate />
    </Suspense>
  ),
});

function AdminGate() {
  const { data: access } = useSuspenseQuery(accessQuery);
  const invalidate = useAdminInvalidate();
  if (!access.isAdmin) {
    return (
      <main className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-xl font-extrabold">No admin access</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account has no admin role yet. If this is a brand new site, you can claim the first
          admin account.
        </p>
        <Button
          className="mt-5"
          onClick={async () => {
            try {
              await claimAdmin();
              toast.success("You are now an administrator.");
              invalidate();
            } catch (e) {
              toast.error((e as Error).message);
            }
          }}
        >
          Claim first admin
        </Button>
      </main>
    );
  }
  return <AdminShell />;
}

function AdminShell() {
  const navigate = useNavigate();
  const catalog = useAdminCatalog();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 pb-24">
      <header className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Content Manager</h1>
          <p className="text-sm text-muted-foreground">
            {catalog.tests.length} tests · {catalog.centers.length} labs · {catalog.prices.length}{" "}
            price rows · {catalog.thanas.length} areas
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/">View site</Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth", replace: true });
            }}
          >
            Sign out
          </Button>
        </div>
      </header>

      <Tabs defaultValue="tests" className="mt-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="labs">Labs</TabsTrigger>
          <TabsTrigger value="prices">Price matrix</TabsTrigger>
          <TabsTrigger value="areas">Areas</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="tests">
          <TestsPanel tests={catalog.tests} />
        </TabsContent>
        <TabsContent value="labs">
          <LabsPanel centers={catalog.centers} thanas={catalog.thanas} />
        </TabsContent>
        <TabsContent value="prices">
          <PricesPanel catalog={catalog} />
        </TabsContent>
        <TabsContent value="areas">
          <AreasPanel thanas={catalog.thanas} />
        </TabsContent>
        <TabsContent value="settings">
          <SettingsPanel settings={{ ...catalog.settings }} />
        </TabsContent>
        <TabsContent value="users">
          <UsersPanel />
        </TabsContent>
      </Tabs>
    </main>
  );
}

/* --------------------------------- tests --------------------------------- */

const emptyTest = {
  code: "",
  canonical_name: "",
  bangla_name: "",
  category: "PATHOLOGY",
  synonyms: "",
  description: "",
  preparation_note: "",
  fasting_required: false,
  fasting_hours: "",
  report_delivery_hrs: 24,
  is_popular: false,
  is_active: true,
  sort_order: 0,
};

function TestsPanel({ tests }: { tests: MedicalTest[] }) {
  const [editing, setEditing] = useState<MedicalTest | null>(null);
  const [creating, setCreating] = useState(false);
  const save = useSaveRecord(() => {
    setEditing(null);
    setCreating(false);
  });
  const del = useDeleteRecord();

  const form = editing
    ? {
        code: editing.code,
        canonical_name: editing.canonicalName,
        bangla_name: editing.banglaName,
        category: editing.category,
        synonyms: editing.synonyms.join(", "),
        description: editing.description,
        preparation_note: editing.preparationNote,
        fasting_required: editing.fastingRequired,
        fasting_hours: editing.fastingHours ?? "",
        report_delivery_hrs: editing.reportDeliveryHrs,
        is_popular: editing.isPopular,
        is_active: editing.isActive,
        sort_order: editing.sortOrder,
      }
    : emptyTest;

  return (
    <div className="mt-4 space-y-4">
      <Button size="sm" onClick={() => { setCreating(true); setEditing(null); }}>
        + New test
      </Button>

      {(creating || editing) && (
        <RecordForm
          key={editing?.id ?? "new"}
          initial={form}
          fields={[
            { name: "code", label: "Code (TEST-XXX)" },
            { name: "canonical_name", label: "English name" },
            { name: "bangla_name", label: "Bangla name" },
            { name: "category", label: "Category", options: TEST_CATEGORIES },
            { name: "synonyms", label: "Search synonyms (comma separated)", textarea: true },
            { name: "description", label: "Description", textarea: true },
            { name: "preparation_note", label: "Preparation note", textarea: true },
            { name: "fasting_required", label: "Fasting required", type: "boolean" },
            { name: "fasting_hours", label: "Fasting hours", type: "number" },
            { name: "report_delivery_hrs", label: "Report delivery (hrs)", type: "number" },
            { name: "is_popular", label: "Show on homepage", type: "boolean" },
            { name: "is_active", label: "Published", type: "boolean" },
            { name: "sort_order", label: "Sort order", type: "number" },
          ]}
          onCancel={() => { setCreating(false); setEditing(null); }}
          onSave={(values) =>
            save.mutate({
              table: "medical_tests",
              id: editing?.id,
              values: {
                ...values,
                synonyms: String(values.synonyms ?? "")
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
                fasting_hours: values.fasting_hours === "" ? null : Number(values.fasting_hours),
              },
            })
          }
        />
      )}

      <div className="surface-card divide-y divide-border">
        {tests.map((t) => (
          <div key={t.id} className="flex flex-wrap items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {t.canonicalName} {!t.isActive && <span className="text-xs text-destructive">(hidden)</span>}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {t.code} · {t.category} · {t.banglaName}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => { setEditing(t); setCreating(false); }}>
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => confirm(`Delete ${t.canonicalName}?`) && del.mutate({ table: "medical_tests", id: t.id })}
            >
              Delete
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------- labs ---------------------------------- */

function LabsPanel({ centers, thanas }: { centers: DiagnosticCenter[]; thanas: Thana[] }) {
  const [editing, setEditing] = useState<DiagnosticCenter | null>(null);
  const [creating, setCreating] = useState(false);
  const save = useSaveRecord(() => { setEditing(null); setCreating(false); });
  const del = useDeleteRecord();

  const initial = editing
    ? {
        slug: editing.slug,
        name: editing.name,
        branch_name: editing.branchName,
        thana: editing.thana,
        city: editing.city,
        address: editing.address,
        latitude: editing.latitude,
        longitude: editing.longitude,
        contact_phone: editing.contactPhone,
        sample_collection_fee: editing.sampleCollectionFee,
        home_sample_available: editing.homeSampleAvailable,
        is_active: editing.isActive,
        sort_order: editing.sortOrder,
      }
    : {
        slug: "",
        name: "",
        branch_name: "",
        thana: thanas[0]?.name ?? "",
        city: "Dhaka",
        address: "",
        latitude: 23.75,
        longitude: 90.39,
        contact_phone: "",
        sample_collection_fee: 100,
        home_sample_available: true,
        is_active: true,
        sort_order: 0,
      };

  return (
    <div className="mt-4 space-y-4">
      <Button size="sm" onClick={() => { setCreating(true); setEditing(null); }}>+ New lab branch</Button>

      {(creating || editing) && (
        <RecordForm
          key={editing?.id ?? "new"}
          initial={initial}
          fields={[
            { name: "name", label: "Chain name" },
            { name: "branch_name", label: "Branch name" },
            { name: "slug", label: "Slug (unique)" },
            { name: "thana", label: "Area / thana", options: thanas.map((t) => t.name) },
            { name: "city", label: "City" },
            { name: "address", label: "Address", textarea: true },
            { name: "latitude", label: "Latitude", type: "number" },
            { name: "longitude", label: "Longitude", type: "number" },
            { name: "contact_phone", label: "Contact phone" },
            { name: "sample_collection_fee", label: "Needle/tube/registration fee", type: "number" },
            { name: "home_sample_available", label: "Home collection", type: "boolean" },
            { name: "is_active", label: "Published", type: "boolean" },
            { name: "sort_order", label: "Sort order", type: "number" },
          ]}
          onCancel={() => { setCreating(false); setEditing(null); }}
          onSave={(values) => save.mutate({ table: "diagnostic_centers", id: editing?.id, values })}
        />
      )}

      <div className="surface-card divide-y divide-border">
        {centers.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {c.name} — {c.branchName} {!c.isActive && <span className="text-xs text-destructive">(hidden)</span>}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {c.thana} · fee ৳{c.sampleCollectionFee} · {c.contactPhone}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => { setEditing(c); setCreating(false); }}>Edit</Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => confirm(`Delete ${c.branchName}?`) && del.mutate({ table: "diagnostic_centers", id: c.id })}
            >
              Delete
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------- prices ---------------------------------- */

function PricesPanel({ catalog }: { catalog: ReturnType<typeof useAdminCatalog> }) {
  const [centerId, setCenterId] = useState(catalog.centers[0]?.id ?? "");
  const [percent, setPercent] = useState(0);
  const upsert = useUpsertPrice();
  const bulk = useBulkAdjust();

  const center = catalog.centerById(centerId);

  return (
    <div className="mt-4 space-y-4">
      <div className="surface-card flex flex-wrap items-end gap-3 p-4">
        <div>
          <Label>Lab branch</Label>
          <select
            className="mt-1 h-9 rounded-md border border-border bg-background px-2 text-sm"
            value={centerId}
            onChange={(e) => setCenterId(e.target.value)}
          >
            {catalog.centers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.branchName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Bulk adjust all prices (%)</Label>
          <Input
            type="number"
            className="mt-1 w-32"
            value={percent}
            onChange={(e) => setPercent(Number(e.target.value))}
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => bulk.mutate({ centerId, percent })}
          disabled={!percent}
        >
          Apply to {center?.branchName}
        </Button>
      </div>

      <div className="surface-card divide-y divide-border">
        {catalog.tests.map((t) => {
          const row = catalog.prices.find(
            (p) => p.medicalTestId === t.id && p.diagnosticCenterId === centerId,
          );
          return (
            <PriceRow
              key={t.id + centerId}
              testName={t.canonicalName}
              price={row?.price ?? 0}
              discounted={row?.discountedPrice ?? null}
              notes={row?.notes ?? ""}
              available={row?.isAvailable ?? false}
              onSave={(v) =>
                upsert.mutate({
                  medicalTestId: t.id,
                  diagnosticCenterId: centerId,
                  price: v.price,
                  discountedPrice: v.discounted,
                  notes: v.notes || null,
                  isAvailable: v.available,
                })
              }
            />
          );
        })}
      </div>
    </div>
  );
}

function PriceRow({
  testName,
  price,
  discounted,
  notes,
  available,
  onSave,
}: {
  testName: string;
  price: number;
  discounted: number | null;
  notes: string;
  available: boolean;
  onSave: (v: { price: number; discounted: number | null; notes: string; available: boolean }) => void;
}) {
  const [p, setP] = useState(price);
  const [d, setD] = useState(discounted ?? ("" as number | ""));
  const [n, setN] = useState(notes);
  const [a, setA] = useState(available);

  return (
    <div className="flex flex-wrap items-center gap-2 p-3">
      <span className="min-w-48 flex-1 text-sm font-medium">{testName}</span>
      <Input className="w-24" type="number" value={p} onChange={(e) => setP(Number(e.target.value))} aria-label="Price" />
      <Input
        className="w-24"
        type="number"
        placeholder="disc."
        value={d}
        onChange={(e) => setD(e.target.value === "" ? "" : Number(e.target.value))}
        aria-label="Discounted price"
      />
      <Input className="w-44" placeholder="notes" value={n} onChange={(e) => setN(e.target.value)} aria-label="Notes" />
      <label className="flex items-center gap-2 text-xs">
        <Switch checked={a} onCheckedChange={setA} /> Offered
      </label>
      <Button size="sm" onClick={() => onSave({ price: p, discounted: d === "" ? null : Number(d), notes: n, available: a })}>
        Save
      </Button>
    </div>
  );
}

/* --------------------------------- areas ---------------------------------- */

function AreasPanel({ thanas }: { thanas: Thana[] }) {
  const save = useSaveRecord();
  const del = useDeleteRecord();
  const [name, setName] = useState("");
  const [lat, setLat] = useState(23.75);
  const [lng, setLng] = useState(90.39);

  return (
    <div className="mt-4 space-y-4">
      <div className="surface-card flex flex-wrap items-end gap-3 p-4">
        <div>
          <Label>Area name</Label>
          <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>Latitude</Label>
          <Input className="mt-1 w-32" type="number" value={lat} onChange={(e) => setLat(Number(e.target.value))} />
        </div>
        <div>
          <Label>Longitude</Label>
          <Input className="mt-1 w-32" type="number" value={lng} onChange={(e) => setLng(Number(e.target.value))} />
        </div>
        <Button
          size="sm"
          disabled={!name}
          onClick={() => {
            save.mutate({ table: "thanas", values: { name, latitude: lat, longitude: lng, is_active: true } });
            setName("");
          }}
        >
          Add area
        </Button>
      </div>
      <div className="surface-card divide-y divide-border">
        {thanas.map((t) => (
          <div key={t.id} className="flex items-center gap-3 p-3">
            <span className="flex-1 text-sm font-medium">{t.name}</span>
            <span className="text-xs text-muted-foreground">
              {t.latitude.toFixed(4)}, {t.longitude.toFixed(4)}
            </span>
            <Button size="sm" variant="ghost" onClick={() => del.mutate({ table: "thanas", id: t.id })}>
              Delete
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------- settings -------------------------------- */

function SettingsPanel({ settings }: { settings: Record<string, unknown> }) {
  const save = useSaveSettings();
  const [form, setForm] = useState<Record<string, unknown>>(settings);
  const field = (name: string, label: string, textarea = false) => (
    <div key={name}>
      <Label htmlFor={name}>{label}</Label>
      {textarea ? (
        <Textarea
          id={name}
          className="mt-1"
          value={String(form[name] ?? "")}
          onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        />
      ) : (
        <Input
          id={name}
          className="mt-1"
          value={String(form[name] ?? "")}
          onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        />
      )}
    </div>
  );

  return (
    <div className="surface-card mt-4 space-y-3 p-4">
      {field("siteName", "Site name")}
      {field("tagline", "Tagline")}
      {field("heroTitleEn", "Hero title (English)")}
      {field("heroTitleBn", "Hero title (Bangla)")}
      {field("heroSubEn", "Hero subtitle (English)", true)}
      {field("heroSubBn", "Hero subtitle (Bangla)", true)}
      {field("defaultThana", "Default area")}
      {field("currencySymbol", "Currency symbol")}
      {field("supportPhone", "Support phone")}
      {field("metaDescription", "SEO meta description", true)}
      <Button onClick={() => save.mutate(form)}>Save settings</Button>
    </div>
  );
}

/* --------------------------------- users ---------------------------------- */

function UsersPanel() {
  const { data: staff } = useSuspenseQuery(staffQuery);
  const setRole = useSetUserRole();

  return (
    <div className="surface-card mt-4 divide-y divide-border">
      {staff.map((u) => (
        <div key={u.id} className="flex flex-wrap items-center gap-3 p-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{u.email ?? u.id}</p>
            <p className="text-xs text-muted-foreground">{u.roles.join(", ") || "no roles"}</p>
          </div>
          {(["admin", "editor"] as const).map((role) => (
            <Button
              key={role}
              size="sm"
              variant={u.roles.includes(role) ? "default" : "outline"}
              onClick={() => setRole.mutate({ userId: u.id, role, grant: !u.roles.includes(role) })}
            >
              {u.roles.includes(role) ? `Remove ${role}` : `Make ${role}`}
            </Button>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ generic form ------------------------------ */

interface FieldDef {
  name: string;
  label: string;
  type?: "text" | "number" | "boolean";
  textarea?: boolean;
  options?: readonly string[];
}

function RecordForm({
  initial,
  fields,
  onSave,
  onCancel,
}: {
  initial: Record<string, unknown>;
  fields: FieldDef[];
  onSave: (values: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<Record<string, unknown>>(initial);
  const set = (k: string, v: unknown) => setValues((s) => ({ ...s, [k]: v }));

  return (
    <div className="surface-card grid gap-3 p-4 sm:grid-cols-2">
      {fields.map((f) => (
        <div key={f.name} className={f.textarea ? "sm:col-span-2" : ""}>
          <Label htmlFor={f.name}>{f.label}</Label>
          {f.type === "boolean" ? (
            <div className="mt-2">
              <Switch checked={Boolean(values[f.name])} onCheckedChange={(v) => set(f.name, v)} />
            </div>
          ) : f.options ? (
            <select
              id={f.name}
              className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
              value={String(values[f.name] ?? "")}
              onChange={(e) => set(f.name, e.target.value)}
            >
              {f.options.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : f.textarea ? (
            <Textarea
              id={f.name}
              className="mt-1"
              value={String(values[f.name] ?? "")}
              onChange={(e) => set(f.name, e.target.value)}
            />
          ) : (
            <Input
              id={f.name}
              className="mt-1"
              type={f.type === "number" ? "number" : "text"}
              value={String(values[f.name] ?? "")}
              onChange={(e) => set(f.name, f.type === "number" ? Number(e.target.value) : e.target.value)}
            />
          )}
        </div>
      ))}
      <div className="flex gap-2 sm:col-span-2">
        <Button onClick={() => onSave(values)}>Save</Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
