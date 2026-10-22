import { useState, type RefObject } from "react";
import { useIsoLayoutEffect } from "../../env";

/** A build step whose view holds detail that the fully built slide hides (a bento tour stop). */
export interface DetailStop {
  step: number;
  /** What the step shows, for a caption: the detail's own title, else the cell's ID. */
  label: string;
}

/**
 * The detail stops a rendered slide declares. A part marks itself with `data-detail-stops` (the
 * steps, space-separated) and `data-tour` (the cell IDs per step); `Bento` does both. The read and
 * print views render one extra still per stop, so a forwarded deck keeps what the camera showed.
 */
export function detailStopsOf(root: Element | null): DetailStop[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>("[data-detail-stops]")).flatMap((part) => {
    const tour = (part.dataset.tour ?? "").split(" ");
    return (part.dataset.detailStops ?? "")
      .split(" ")
      .map(Number)
      .filter((step) => step > 0)
      .map((step) => {
        const id = tour[step - 1] ?? String(step);
        const detail = part.querySelector(`[data-bento-cell="${CSS.escape(id)}"] .uipack-deck-bento__detail`);
        return { step, label: detail?.firstElementChild?.textContent?.trim() || id };
      });
  });
}

/** The detail stops inside `ref`, read after layout and again whenever `key` changes. */
export function useDetailStops(ref: RefObject<Element | null>, key: unknown): DetailStop[] {
  const [stops, setStops] = useState<DetailStop[]>([]);
  useIsoLayoutEffect(() => {
    const next = detailStopsOf(ref.current);
    setStops((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  }, [key]);
  return stops;
}
