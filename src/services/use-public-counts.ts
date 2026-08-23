import { useEffect, useState } from "react";
import type { PublicCounts } from "../pages/api/public-counts";
import ApiRoutes from "../routing/api-routes";

const ZERO: PublicCounts = {
  members: 0,
  products: 0,
  grants: 0,
  events: 0,
  supervisions: 0,
  partners: 0,
};

/**
 * Landing-page tile counts for an institute, from the anonymous, PII-free `/api/public-counts`.
 *
 * The homepage shows these numbers to logged-out visitors, so this endpoint is deliberately
 * unauthenticated — but it returns only integers, never rows. Falls back to zeros on any error,
 * so a tile shows "0" rather than breaking the page.
 */
export default function usePublicCounts(urlIdentifier?: string): PublicCounts {
  const [counts, setCounts] = useState<PublicCounts>(ZERO);

  useEffect(() => {
    if (!urlIdentifier) {
      setCounts(ZERO);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${ApiRoutes.publicCounts}?instituteId=${urlIdentifier}`);
        if (!res.ok) return;
        const body: PublicCounts = await res.json();
        if (!cancelled) setCounts(body);
      } catch {
        /* leave zeros */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [urlIdentifier]);

  return counts;
}
