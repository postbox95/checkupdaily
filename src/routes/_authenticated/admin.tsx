import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Suspense, useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { claimAdmin } from "@/lib/catalog.functions";
import {
  accessQuery,
  staffQuery,
  useAdminCatalog,
  useAdminInvalidate,
  useBulkPriceAction,
  useDeleteRecord,
  usePushChain,
  useResetToChainDefault,
  useSavePrices,
  useSaveRecord,
  useSaveSettings,
  useSetUserRole,
} from "@/lib/admin";
import {
  TEST_CATEGORIES,
  type DiagnosticCenter,
  type DiscountType,
  type LabChain,
  type MedicalTest,
  type Thana,
} from "@/data/seed";
import { DAY_NAMES, branchOpenStatus } from "@/lib/hours";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminReviews, useModerateReview } from "@/lib/reviews";
import { REVIEW_STATUSES, type ReviewStatus } from "@/lib/reviews.types";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Content Manager — Niramoy Prices Admin" },
      { name: "description", content: "Manage chains, tests, labs, prices, areas and settings." },
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
            {catalog.chains.length} chains · {catalog.tests.length} tests · {catalog.centers.length}{" "}
            branches · {catalog.prices.length} overrides · {catalog.thanas.length} areas
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

      <Tabs defaultValue="chains" className="mt-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="chains">Lab chains</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="labs">Branches</TabsTrigger>
          <TabsTrigger value="prices">Price matrix</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="areas">Areas</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="chains">
          <ChainsPanel catalog={catalog} />
        </TabsContent>
        <TabsContent value="tests">
          <TestsPanel tests={catalog.tests} />
        </TabsContent>
        <TabsContent value="labs">
          <LabsPanel catalog={catalog} />
        </TabsContent>
        <TabsContent value="prices">
          <PricesPanel catalog={catalog} />
        </TabsContent>
        <TabsContent value="reviews">
          <ReviewsPanel />
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

type Catalog = ReturnType<typeof useAdminCatalog>;

const toLines = (v: unknown) =>
  String(v ?? "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* --------------------------------- chains --------------------------------- */

function ChainsPanel({ catalog }: { catalog: Catalog }) {
  const [editing, setEditing] = useState<LabChain | null>(null);
  const [creating, setCreating] = useState(false);
  const save = useSaveRecord(() => { setEditing(null); setCreating(false); });
  const del = useDeleteRecord();
  const push = usePushChain();
  const [pushOverwrite, setPushOverwrite] = useState<Record<string, boolean>>({});

  const initial = editing
    ? {
        name: editing.name,
        slug: editing.slug,
        logo_url: editing.logoUrl,
        description: editing.description ?? "",
        pros: (editing.pros ?? []).join("\n"),
        cons: (editing.cons ?? []).join("\n"),
        default_sample_collection_fee: editing.defaultSampleCollectionFee,
        default_home_sample_available: editing.defaultHomeSampleAvailable,
        is_active: editing.isActive,
        sort_order: editing.sortOrder,
      }
    : {
        name: "",
        slug: "",
        logo_url: "",
        description: "",
        pros: "",
        cons: "",
        default_sample_collection_fee: 90,
        default_home_sample_available: true,
        is_active: true,
        sort_order: 0,
      };

  return (
    <div className="mt-4 space-y-4">
      <p className="text-sm text-muted-foreground">
        A chain owns the brand-level defaults: registration/collection fee, home collection, and the
        shared price template used by every branch that has not set its own override.
      </p>
      <Button size="sm" onClick={() => { setCreating(true); setEditing(null); }}>+ New chain</Button>

      {(creating || editing) && (
        <RecordForm
          key={editing?.id ?? "new-chain"}
          initial={initial}
          fields={[
            { name: "name", label: "Chain name" },
            { name: "slug", label: "Slug (unique)" },
            { name: "logo_url", label: "Logo URL" },
            { name: "description", label: "Chain description (public profile)", textarea: true },
            { name: "pros", label: "Pros — one per line", textarea: true },
            { name: "cons", label: "Cons — one per line", textarea: true },
            { name: "default_sample_collection_fee", label: "Default registration/collection fee", type: "number" },
            { name: "default_home_sample_available", label: "Home collection by default", type: "boolean" },
            { name: "is_active", label: "Published", type: "boolean" },
            { name: "sort_order", label: "Sort order", type: "number" },
          ]}
          onCancel={() => { setCreating(false); setEditing(null); }}
          onSave={(values) =>
            save.mutate({
              table: "lab_chains",
              id: editing?.id,
              values: {
                ...values,
                pros: toLines(values.pros),
                cons: toLines(values.cons),
                slug: String(values.slug || "").trim() || slugify(String(values.name || "")),
              },
            })
          }
        />
      )}

      <div className="surface-card divide-y divide-border">
        {catalog.chains.map((ch) => {
          const branches = catalog.branchesOfChain(ch.id);
          const overrides = branches.filter((b) => b.sampleCollectionFeeOverride !== null).length;
          const overwrite = pushOverwrite[ch.id] ?? false;
          return (
            <div key={ch.id} className="space-y-2 p-3">
              <div className="flex flex-wrap items-center gap-3">
                {ch.logoUrl && (
                  <img src={ch.logoUrl} alt={`${ch.name} logo`} className="size-8 rounded object-contain" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {ch.name}{" "}
                    {!ch.isActive && <span className="text-xs text-destructive">(hidden)</span>}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {branches.length} branches · default fee ৳{ch.defaultSampleCollectionFee} ·{" "}
                    {overrides} branch fee override{overrides === 1 ? "" : "s"} ·{" "}
                    {ch.defaultHomeSampleAvailable ? "home collection on" : "no home collection"}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => { setEditing(ch); setCreating(false); }}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => confirm(`Delete chain ${ch.name}? Branches keep their own data.`) && del.mutate({ table: "lab_chains", id: ch.id })}
                >
                  Delete
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/50 p-2 text-xs">
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={overwrite}
                    onCheckedChange={(v) => setPushOverwrite((s) => ({ ...s, [ch.id]: Boolean(v) }))}
                  />
                  Overwrite branches that have their own override
                </label>
                <span className="text-muted-foreground">
                  {overwrite ? "All branches will be reset to chain defaults." : "Only branches still on the default are touched."}
                </span>
                <div className="ml-auto flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => push.mutate({ chainId: ch.id, what: "fee", overwriteOverrides: overwrite })}>
                    Push fee to all branches
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => push.mutate({ chainId: ch.id, what: "prices", overwriteOverrides: overwrite })}>
                    Push price template
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
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
  consumable_fee: 0,
  is_government_rate: false,
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
        consumable_fee: editing.consumableFee,
        is_government_rate: editing.isGovernmentRate,
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
            { name: "consumable_fee", label: "Needle / tube charge for this test (0 for MRI, X-ray…)", type: "number" },
            { name: "is_government_rate", label: "Government rate (never discounted)", type: "boolean" },
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
                {t.code} · {t.category} · needle/tube ৳{t.consumableFee}
                {t.isGovernmentRate ? " · government rate" : ""}
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

function LabsPanel({ catalog }: { catalog: Catalog }) {
  const { centers, thanas, chains } = catalog;
  const [editing, setEditing] = useState<DiagnosticCenter | null>(null);
  const [creating, setCreating] = useState(false);
  const save = useSaveRecord(() => { setEditing(null); setCreating(false); });
  const del = useDeleteRecord();

  const chainOptions = chains.map((c) => ({ value: c.id, label: c.name }));

  const initial = editing
    ? {
        lab_chain_id: editing.labChainId ?? "",
        branch_name: editing.branchName,
        slug: editing.slug,
        thana: editing.thana,
        city: editing.city,
        address: editing.address,
        latitude: editing.latitude,
        longitude: editing.longitude,
        contact_phone: editing.contactPhone,
        fee_mode: editing.sampleCollectionFeeOverride === null ? "inherit" : "override",
        sample_collection_fee_override: editing.sampleCollectionFeeOverride ?? 0,
        home_mode: editing.homeSampleOverride === null ? "inherit" : "override",
        home_sample_override: editing.homeSampleOverride ?? true,
        is_24_hours: editing.is24Hours,
        opens_at: editing.opensAt,
        closes_at: editing.closesAt,
        closed_days: (editing.closedDays ?? []).map((d) => DAY_NAMES[d]).join(", "),
        is_active: editing.isActive,
        sort_order: editing.sortOrder,
      }
    : {
        lab_chain_id: chains[0]?.id ?? "",
        branch_name: "",
        slug: "",
        thana: thanas[0]?.name ?? "",
        city: "Dhaka",
        address: "",
        latitude: 23.75,
        longitude: 90.39,
        contact_phone: "",
        fee_mode: "inherit",
        sample_collection_fee_override: 100,
        home_mode: "inherit",
        home_sample_override: true,
        is_24_hours: false,
        opens_at: "08:00",
        closes_at: "22:00",
        closed_days: "",
        is_active: true,
        sort_order: 0,
      };


  return (
    <div className="mt-4 space-y-4">
      <p className="text-sm text-muted-foreground">
        Branches always own their address, phone, coordinates and area. Fee and home collection
        either inherit the chain default or carry an explicit override.
      </p>
      <Button size="sm" disabled={!chains.length} onClick={() => { setCreating(true); setEditing(null); }}>
        + New branch
      </Button>
      {!chains.length && (
        <p className="text-xs text-destructive">Create a lab chain first — branches belong to a chain.</p>
      )}

      {(creating || editing) && (
        <RecordForm
          key={editing?.id ?? "new"}
          initial={initial}
          fields={[
            { name: "lab_chain_id", label: "Chain", valueOptions: chainOptions },
            { name: "branch_name", label: "Branch name" },
            { name: "slug", label: "Slug (unique)" },
            { name: "thana", label: "Area / thana", options: thanas.map((t) => t.name) },
            { name: "city", label: "City" },
            { name: "address", label: "Address", textarea: true },
            { name: "latitude", label: "Latitude", type: "number" },
            { name: "longitude", label: "Longitude", type: "number" },
            { name: "contact_phone", label: "Contact phone" },
            {
              name: "fee_mode",
              label: "Registration/collection fee",
              valueOptions: [
                { value: "inherit", label: "Use chain default" },
                { value: "override", label: "Override for this branch" },
              ],
            },
            { name: "sample_collection_fee_override", label: "Branch fee (৳)", type: "number" },
            {
              name: "home_mode",
              label: "Home collection",
              valueOptions: [
                { value: "inherit", label: "Use chain default" },
                { value: "override", label: "Override for this branch" },
              ],
            },
            { name: "home_sample_override", label: "Home collection at this branch", type: "boolean" },
            { name: "is_active", label: "Published", type: "boolean" },
            { name: "sort_order", label: "Sort order", type: "number" },
          ]}
          onCancel={() => { setCreating(false); setEditing(null); }}
          onSave={(values) => {
            const chain = chains.find((c) => c.id === values.lab_chain_id);
            const feeOverride =
              values.fee_mode === "override" ? Number(values.sample_collection_fee_override) : null;
            const homeOverride =
              values.home_mode === "override" ? Boolean(values.home_sample_override) : null;
            save.mutate({
              table: "diagnostic_centers",
              id: editing?.id,
              values: {
                lab_chain_id: values.lab_chain_id || null,
                name: chain?.name ?? "",
                branch_name: values.branch_name,
                slug:
                  String(values.slug || "").trim() ||
                  slugify(`${chain?.name ?? ""}-${values.branch_name}`),
                thana: values.thana,
                city: values.city,
                address: values.address,
                latitude: Number(values.latitude),
                longitude: Number(values.longitude),
                contact_phone: values.contact_phone,
                sample_collection_fee_override: feeOverride,
                sample_collection_fee: feeOverride ?? chain?.defaultSampleCollectionFee ?? 0,
                home_sample_override: homeOverride,
                home_sample_available: homeOverride ?? chain?.defaultHomeSampleAvailable ?? true,
                is_active: values.is_active,
                sort_order: Number(values.sort_order),
              },
            });
          }}
        />
      )}

      <div className="surface-card divide-y divide-border">
        {centers.map((c) => {
          const chain = c.labChainId ? catalog.chainById(c.labChainId) : undefined;
          const inheritedFee = c.sampleCollectionFeeOverride === null;
          return (
            <div key={c.id} className="flex flex-wrap items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {chain?.name ?? c.name} — {c.branchName}{" "}
                  {!c.isActive && <span className="text-xs text-destructive">(hidden)</span>}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {c.thana} · fee ৳{catalog.branchFee(c)}{" "}
                  <Badge variant={inheritedFee ? "secondary" : "default"} className="ml-1 align-middle text-[10px]">
                    {inheritedFee ? "inherited" : "custom"}
                  </Badge>{" "}
                  · {c.contactPhone}
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
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------- prices ---------------------------------- */

interface DraftRow {
  price: number;
  discountType: DiscountType;
  discountValue: number;
  notes: string;
  isAvailable: boolean;
  inherited: boolean;
  exists: boolean;
}

function PricesPanel({ catalog }: { catalog: Catalog }) {
  const [scope, setScope] = useState<"chain" | "branch">("chain");
  const [chainId, setChainId] = useState(catalog.chains[0]?.id ?? "");
  const [centerId, setCenterId] = useState(catalog.centers[0]?.id ?? "");
  const targetId = scope === "chain" ? chainId : centerId;

  const savePrices = useSavePrices();
  const bulk = useBulkPriceAction();
  const reset = useResetToChainDefault();

  const [selected, setSelected] = useState<string[]>([]);
  const [percent, setPercent] = useState(0);
  const [bulkDiscType, setBulkDiscType] = useState<DiscountType>("percent");
  const [bulkDiscValue, setBulkDiscValue] = useState(0);

  const baseRows = useMemo(() => {
    const map: Record<string, DraftRow> = {};
    for (const t of catalog.tests) {
      if (scope === "chain") {
        const row = catalog.chainPrices.find(
          (p) => p.medicalTestId === t.id && p.labChainId === chainId,
        );
        map[t.id] = {
          price: row?.price ?? 0,
          discountType: row?.discountType ?? "none",
          discountValue: row?.discountValue ?? 0,
          notes: row?.notes ?? "",
          isAvailable: row?.isAvailable ?? false,
          inherited: false,
          exists: Boolean(row),
        };
      } else {
        const resolved = catalog.resolvePrice(t.id, centerId);
        map[t.id] = {
          price: resolved?.price ?? 0,
          discountType: resolved?.discountType ?? "none",
          discountValue: resolved?.discountValue ?? 0,
          notes: resolved?.notes ?? "",
          isAvailable: resolved?.isAvailable ?? false,
          inherited: resolved?.inherited ?? true,
          exists: Boolean(resolved),
        };
      }
    }
    return map;
  }, [catalog, scope, chainId, centerId]);

  const [draft, setDraft] = useState<Record<string, DraftRow>>({});
  const key = `${scope}:${targetId}`;
  const [loadedKey, setLoadedKey] = useState(key);
  if (loadedKey !== key) {
    setLoadedKey(key);
    setDraft({});
    setSelected([]);
  }

  const rowOf = (testId: string) => draft[testId] ?? baseRows[testId];
  const setRow = (testId: string, patch: Partial<DraftRow>) =>
    setDraft((d) => ({ ...d, [testId]: { ...rowOf(testId), ...patch } }));

  const dirtyIds = Object.keys(draft);
  const allSelected = selected.length === catalog.tests.length && selected.length > 0;

  const saveAll = () => {
    const rows = dirtyIds.map((id) => ({
      medicalTestId: id,
      price: rowOf(id).price,
      discountType: rowOf(id).discountType,
      discountValue: rowOf(id).discountValue,
      notes: rowOf(id).notes || null,
      isAvailable: rowOf(id).isAvailable,
    }));
    if (!rows.length) return toast.info("No changes to save.");
    savePrices.mutate(
      { scope, targetId, rows },
      { onSuccess: () => setDraft({}) },
    );
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="surface-card flex flex-wrap items-end gap-3 p-4">
        <div>
          <Label>Edit level</Label>
          <select
            className="mt-1 h-9 rounded-md border border-border bg-background px-2 text-sm"
            value={scope}
            onChange={(e) => setScope(e.target.value as "chain" | "branch")}
          >
            <option value="chain">Chain template</option>
            <option value="branch">Single branch (override)</option>
          </select>
        </div>
        {scope === "chain" ? (
          <div>
            <Label>Chain</Label>
            <select
              className="mt-1 h-9 rounded-md border border-border bg-background px-2 text-sm"
              value={chainId}
              onChange={(e) => setChainId(e.target.value)}
            >
              {catalog.chains.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <Label>Lab branch</Label>
            <select
              className="mt-1 h-9 rounded-md border border-border bg-background px-2 text-sm"
              value={centerId}
              onChange={(e) => setCenterId(e.target.value)}
            >
              {catalog.centers.map((c) => (
                <option key={c.id} value={c.id}>
                  {(catalog.chainById(c.labChainId ?? "")?.name ?? c.name)} — {c.branchName}
                </option>
              ))}
            </select>
          </div>
        )}
        <Button size="sm" onClick={saveAll} disabled={!dirtyIds.length}>
          Save all changes{dirtyIds.length ? ` (${dirtyIds.length})` : ""}
        </Button>
        {Boolean(dirtyIds.length) && (
          <Button size="sm" variant="ghost" onClick={() => setDraft({})}>Discard</Button>
        )}
      </div>

      <div className="surface-card space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label className="flex items-center gap-2 font-semibold">
            <Checkbox
              checked={allSelected}
              onCheckedChange={(v) => setSelected(v ? catalog.tests.map((t) => t.id) : [])}
            />
            {selected.length} selected
          </label>
          <span className="text-xs text-muted-foreground">Bulk actions apply to selected tests</span>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <Label className="text-xs">Adjust price %</Label>
            <Input type="number" className="mt-1 w-24" value={percent} onChange={(e) => setPercent(Number(e.target.value))} />
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={!selected.length || !percent}
            onClick={() => bulk.mutate({ scope, targetId, testIds: selected, action: "adjust", percent })}
          >
            Apply adjustment
          </Button>
          <div>
            <Label className="text-xs">Discount</Label>
            <div className="mt-1 flex gap-2">
              <select
                className="h-9 rounded-md border border-border bg-background px-2 text-sm"
                value={bulkDiscType}
                onChange={(e) => setBulkDiscType(e.target.value as DiscountType)}
              >
                <option value="none">No discount</option>
                <option value="amount">৳ amount</option>
                <option value="percent">% percent</option>
              </select>
              <Input type="number" className="w-24" value={bulkDiscValue} onChange={(e) => setBulkDiscValue(Number(e.target.value))} />
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={!selected.length}
            onClick={() =>
              bulk.mutate({ scope, targetId, testIds: selected, action: "discount", discountType: bulkDiscType, discountValue: bulkDiscValue })
            }
          >
            Set discount
          </Button>
          <Button size="sm" variant="outline" disabled={!selected.length} onClick={() => bulk.mutate({ scope, targetId, testIds: selected, action: "availability", isAvailable: true })}>
            Mark offered
          </Button>
          <Button size="sm" variant="outline" disabled={!selected.length} onClick={() => bulk.mutate({ scope, targetId, testIds: selected, action: "availability", isAvailable: false })}>
            Mark not offered
          </Button>
          {scope === "branch" && (
            <Button size="sm" variant="outline" disabled={!selected.length} onClick={() => reset.mutate({ centerId, testIds: selected })}>
              Reset to chain default
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            disabled={!selected.length}
            onClick={() => confirm(`Delete ${selected.length} price rows?`) && bulk.mutate({ scope, targetId, testIds: selected, action: "delete" })}
          >
            Delete rows
          </Button>
        </div>
      </div>

      <div className="surface-card divide-y divide-border">
        {catalog.tests.map((t) => {
          const r = rowOf(t.id);
          const dirty = Boolean(draft[t.id]);
          const final = r.discountType === "percent"
            ? Math.max(0, Math.round(r.price - (r.price * r.discountValue) / 100))
            : r.discountType === "amount"
              ? Math.max(0, Math.round(r.price - r.discountValue))
              : r.price;
          return (
            <div key={t.id} className="flex flex-wrap items-center gap-2 p-3">
              <Checkbox
                checked={selected.includes(t.id)}
                onCheckedChange={(v) =>
                  setSelected((s) => (v ? [...s, t.id] : s.filter((x) => x !== t.id)))
                }
                aria-label={`Select ${t.canonicalName}`}
              />
              <span className="min-w-44 flex-1 text-sm font-medium">
                {t.canonicalName}
                {t.isGovernmentRate && (
                  <Badge variant="secondary" className="ml-2 text-[10px]">govt rate</Badge>
                )}
                {scope === "branch" && (
                  <Badge variant={r.inherited ? "secondary" : "default"} className="ml-2 text-[10px]">
                    {r.inherited ? "inherited" : "custom"}
                  </Badge>
                )}
                {dirty && <span className="ml-2 text-[10px] font-bold text-warning-foreground">unsaved</span>}
              </span>
              <Input
                className="w-24"
                type="number"
                value={r.price}
                onChange={(e) => setRow(t.id, { price: Number(e.target.value) })}
                aria-label="Price"
              />
              <select
                className="h-9 rounded-md border border-border bg-background px-2 text-sm disabled:opacity-50"
                value={r.discountType}
                disabled={t.isGovernmentRate}
                onChange={(e) => setRow(t.id, { discountType: e.target.value as DiscountType })}
                aria-label="Discount type"
              >
                <option value="none">no disc.</option>
                <option value="amount">৳</option>
                <option value="percent">%</option>
              </select>
              <Input
                className="w-20"
                type="number"
                value={r.discountValue}
                disabled={t.isGovernmentRate || r.discountType === "none"}
                onChange={(e) => setRow(t.id, { discountValue: Number(e.target.value) })}
                aria-label="Discount value"
              />
              <span className="w-20 text-xs font-semibold">
                = ৳{t.isGovernmentRate ? r.price : final}
              </span>
              <Input
                className="w-36"
                placeholder="notes"
                value={r.notes}
                onChange={(e) => setRow(t.id, { notes: e.target.value })}
                aria-label="Notes"
              />
              <label className="flex items-center gap-2 text-xs">
                <Switch checked={r.isAvailable} onCheckedChange={(v) => setRow(t.id, { isAvailable: v })} /> Offered
              </label>
              {scope === "branch" && !r.inherited && (
                <Button size="sm" variant="ghost" onClick={() => reset.mutate({ centerId, testIds: [t.id] })}>
                  Reset
                </Button>
              )}
            </div>
          );
        })}
      </div>
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
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: "", latitude: 0, longitude: 0 });

  const startEdit = (t: Thana) => {
    setEditId(t.id);
    setDraft({ name: t.name, latitude: t.latitude, longitude: t.longitude });
  };

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
        {thanas.map((t) =>
          editId === t.id ? (
            <div key={t.id} className="flex flex-wrap items-end gap-3 p-3">
              <div>
                <Label className="text-xs">Area name</Label>
                <Input
                  className="mt-1"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Latitude</Label>
                <Input
                  className="mt-1 w-32"
                  type="number"
                  value={draft.latitude}
                  onChange={(e) => setDraft({ ...draft, latitude: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label className="text-xs">Longitude</Label>
                <Input
                  className="mt-1 w-32"
                  type="number"
                  value={draft.longitude}
                  onChange={(e) => setDraft({ ...draft, longitude: Number(e.target.value) })}
                />
              </div>
              <Button
                size="sm"
                disabled={!draft.name || save.isPending}
                onClick={() =>
                  save.mutate(
                    {
                      table: "thanas",
                      id: t.id,
                      values: { name: draft.name, latitude: draft.latitude, longitude: draft.longitude },
                    },
                    { onSuccess: () => setEditId(null) },
                  )
                }
              >
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>
                Cancel
              </Button>
            </div>
          ) : (
            <div key={t.id} className="flex items-center gap-3 p-3">
              <span className="flex-1 text-sm font-medium">{t.name}</span>
              <span className="text-xs text-muted-foreground">
                {t.latitude.toFixed(4)}, {t.longitude.toFixed(4)}
              </span>
              <Button size="sm" variant="ghost" onClick={() => startEdit(t)}>
                Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => del.mutate({ table: "thanas", id: t.id })}>
                Delete
              </Button>
            </div>
          ),
        )}
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
      {field("maxSearchRadiusKm", "Max search radius (km)")}
      {field("metaDescription", "SEO meta description", true)}
      <Button
        onClick={() =>
          save.mutate({
            ...form,
            maxSearchRadiusKm: Number(form.maxSearchRadiusKm) || 5,
          })
        }
      >
        Save settings
      </Button>
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

/* -------------------------------- reviews --------------------------------- */

function ReviewsPanel() {
  const { data: reviews, isLoading } = useAdminReviews();
  const moderate = useModerateReview();
  const [chain, setChain] = useState("all");
  const [branch, setBranch] = useState("all");
  const [rating, setRating] = useState("all");
  const [status, setStatus] = useState("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const rows = (reviews ?? []).filter(
    (r) =>
      (chain === "all" || r.chainId === chain) &&
      (branch === "all" || r.branchLabel === branch) &&
      (rating === "all" || String(r.rating) === rating) &&
      (status === "all" || r.status === status),
  );

  const chains = [...new Map((reviews ?? []).map((r) => [r.chainId, r.chainName])).entries()];
  const branches = [...new Set((reviews ?? []).map((r) => r.branchLabel).filter(Boolean))] as string[];

  const select = (
    value: string,
    onChange: (v: string) => void,
    options: { value: string; label: string }[],
    label: string,
  ) => (
    <label className="text-xs font-semibold text-muted-foreground">
      {label}
      <select
        className="mt-1 block h-9 rounded-md border border-input bg-background px-2 text-sm font-normal text-foreground"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="all">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );

  const act = (id: string, next: ReviewStatus) => {
    if (next === "flagged") {
      const reason = window.prompt("Why is this review fake or suspicious?")?.trim();
      if (!reason) return;
      moderate.mutate({ id, status: "flagged", flaggedReason: reason });
      return;
    }
    moderate.mutate({ id, status: next });
  };

  return (
    <div className="mt-4 space-y-4">
      <p className="text-sm text-muted-foreground">
        Reviews auto-publish after phone verification. Flagging or deleting a review removes it from
        the chain profile and its rating summary immediately.
      </p>
      <div className="flex flex-wrap gap-3">
        {select(chain, setChain, chains.map(([id, name]) => ({ value: id, label: name })), "Chain")}
        {select(branch, setBranch, branches.map((b) => ({ value: b, label: b })), "Branch")}
        {select(rating, setRating, [5, 4, 3, 2, 1].map((r) => ({ value: String(r), label: `${r} star` })), "Rating")}
        {select(status, setStatus, REVIEW_STATUSES.map((s) => ({ value: s, label: s })), "Status")}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading reviews…</p>}

      <div className="surface-card divide-y divide-border">
        {rows.map((r) => (
          <div key={r.id} className="space-y-2 p-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="text-sm font-semibold text-foreground">{r.rating}★</span>
              <span className="text-foreground">{r.chainName}</span>
              {r.branchLabel && <span>· {r.branchLabel}</span>}
              <span>· {r.maskedPhone}</span>
              <span>· bill {r.billingId}</span>
              <span>· {new Date(r.createdAt).toLocaleDateString()}</span>
              <span
                className={`rounded-full px-2 py-0.5 font-bold ${
                  r.status === "published"
                    ? "bg-success/20 text-accent-foreground"
                    : r.status === "flagged"
                      ? "bg-warning/20 text-warning-foreground"
                      : r.status === "deleted"
                        ? "bg-destructive/15 text-destructive"
                        : "bg-muted"
                }`}
              >
                {r.status}
              </span>
            </div>
            <p className="text-sm">
              {expanded[r.id] || r.reviewText.length <= 160
                ? r.reviewText
                : `${r.reviewText.slice(0, 160)}… `}
              {r.reviewText.length > 160 && (
                <button
                  className="text-xs underline decoration-dotted"
                  onClick={() => setExpanded((s) => ({ ...s, [r.id]: !s[r.id] }))}
                >
                  {expanded[r.id] ? "less" : "expand"}
                </button>
              )}
            </p>
            {r.flaggedReason && (
              <p className="text-xs text-warning-foreground">Flag reason: {r.flaggedReason}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {r.status !== "flagged" && (
                <Button size="sm" variant="outline" onClick={() => act(r.id, "flagged")}>
                  Flag as fake
                </Button>
              )}
              {r.status !== "deleted" && (
                <Button size="sm" variant="ghost" onClick={() => act(r.id, "deleted")}>
                  Delete
                </Button>
              )}
              {r.status !== "published" && (
                <Button size="sm" onClick={() => act(r.id, "published")}>
                  Restore
                </Button>
              )}
            </div>
          </div>
        ))}
        {!rows.length && !isLoading && (
          <p className="p-4 text-sm text-muted-foreground">No reviews match these filters.</p>
        )}
      </div>
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
  valueOptions?: { value: string; label: string }[];
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
          ) : f.valueOptions ? (
            <select
              id={f.name}
              className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
              value={String(values[f.name] ?? "")}
              onChange={(e) => set(f.name, e.target.value)}
            >
              {f.valueOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
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
