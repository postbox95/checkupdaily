import type { DiagnosticCenter } from "@/data/seed";

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map((n) => Number(n) || 0);
  return h * 60 + m;
};

const fmt = (hhmm: string) => {
  const mins = toMinutes(hhmm);
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const suffix = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${suffix}`;
};

const humanIn = (mins: number) => {
  if (mins < 60) return `${mins} min`;
  const h = Math.round(mins / 60);
  return `${h} hour${h === 1 ? "" : "s"}`;
};

export interface OpenStatus {
  open: boolean;
  /** short badge label, e.g. "Open now" / "Closed — opens in 6 hours" */
  label: string;
  hoursText: string;
}

/** Works with overnight windows (e.g. 22:00 → 02:00) and weekly closed days. */
export function branchOpenStatus(
  center: Pick<DiagnosticCenter, "opensAt" | "closesAt" | "is24Hours" | "closedDays">,
  now: Date = new Date(),
): OpenStatus {
  const closedDays = center.closedDays ?? [];
  if (center.is24Hours && !closedDays.length)
    return { open: true, label: "Open 24 hours", hoursText: "Open 24 hours" };

  const open = toMinutes(center.opensAt || "08:00");
  const close = toMinutes(center.closesAt || "22:00");
  const overnight = close <= open;
  const hoursText = center.is24Hours
    ? "Open 24 hours"
    : `${fmt(center.opensAt || "08:00")} – ${fmt(center.closesAt || "22:00")}`;

  const day = now.getDay();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const dayOpen = (d: number) => !closedDays.includes(((d % 7) + 7) % 7);

  const isOpen = (() => {
    if (center.is24Hours) return dayOpen(day);
    if (overnight) {
      if (nowMins >= open) return dayOpen(day);
      if (nowMins < close) return dayOpen(day - 1);
      return false;
    }
    return dayOpen(day) && nowMins >= open && nowMins < close;
  })();

  if (isOpen) return { open: true, label: "Open now", hoursText };

  // find the next opening moment within the next 7 days
  for (let d = 0; d < 8; d++) {
    if (!dayOpen(day + d)) continue;
    const minutesUntil = d * 1440 + open - nowMins;
    if (minutesUntil <= 0) continue;
    if (minutesUntil < 1440)
      return { open: false, label: `Closed — opens in ${humanIn(minutesUntil)}`, hoursText };
    return {
      open: false,
      label: `Closed — opens ${DAY_NAMES[((day + d) % 7 + 7) % 7]} ${fmt(center.opensAt || "08:00")}`,
      hoursText,
    };
  }
  return { open: false, label: "Closed", hoursText };
}
