"use client";

import { useEffect, useMemo, useState } from "react";

import { computeStatus, type OpenStatus as Status } from "@/lib/open-status";
import type { DayHours } from "@/lib/types";

/**
 * Live "open right now" chip. Computed client-side only (renders nothing on
 * the server) so a statically cached page can't show yesterday's answer.
 * The logic lives in lib/open-status.ts so it can be unit-tested.
 */
export function OpenStatus({ hours }: { hours?: DayHours[] }) {
  const [status, setStatus] = useState<Status | null>(null);
  // Re-run the effect only when the hours content changes, not on every
  // parent render that passes a fresh array reference.
  const hoursKey = useMemo(() => JSON.stringify(hours ?? []), [hours]);

  useEffect(() => {
    const rows: DayHours[] = JSON.parse(hoursKey);
    if (rows.length === 0) return;
    const update = () => setStatus(computeStatus(rows));
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [hoursKey]);

  if (!status) return null;
  return (
    <a
      href="#hours"
      className="animate-rise inline-flex items-center font-condensed text-sm font-bold uppercase tracking-[0.16em] text-navy/75 transition-colors hover:text-navy"
    >
      {status.label}
    </a>
  );
}
