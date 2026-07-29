import type { MedicalTest } from "@/data/seed";

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

const haystack = (t: MedicalTest) =>
  norm([t.canonicalName, t.banglaName, t.code, ...t.synonyms].join(" | "));

export function searchTests(all: MedicalTest[], query: string, limit = 8): MedicalTest[] {
  const q = norm(query);
  if (!q) return [];
  const terms = q.split(" ").filter(Boolean);
  const scored = all
    .map((test) => ({ test, hay: haystack(test) }))
    .map(({ test, hay }) => {
      let score = 0;
      for (const term of terms) {
        const at = hay.indexOf(term);
        if (at === -1) {
          if (term.length >= 3 && hay.includes(term.slice(0, term.length - 1))) {
            score += 1;
            continue;
          }
          return { test, score: -1 };
        }
        score += at === 0 ? 5 : 3;
        if (norm(test.canonicalName).startsWith(term)) score += 4;
      }
      return { test, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return scored.map((r) => r.test);
}

/** Tests that are commonly confused / redundant with each other. */
const redundantGroups: string[][] = [
  ["TEST-FBS", "TEST-RBS"],
  ["TEST-CT-BRAIN", "TEST-MRI-BRAIN"],
  ["TEST-ECG", "TEST-ECHO"],
];

export function redundancyWarning(all: MedicalTest[], codes: string[]): string | null {
  for (const group of redundantGroups) {
    const hit = group.filter((c) => codes.includes(c));
    if (hit.length > 1) {
      const names = hit
        .map((c) => all.find((t) => t.code === c)?.canonicalName)
        .filter(Boolean)
        .join(" & ");
      return `Note: ${names} overlap heavily. Most prescriptions need only one of them — double-check your prescription.`;
    }
  }
  return null;
}
