// Speaker view sync: every window showing the same deck ID follows the last one moved, over a
// BroadcastChannel. Also reports each position change to the host (onPositionChange).
import { useEffect, useRef } from "react";
import { useLatest } from "../../env";
import type { DeckPosition, DeckSlide } from "../types";
import type { DeckView } from "./usePosition";

type SyncMessage = { type: "hello" } | { type: "go"; index: number; step?: number };

export interface DeckSyncOptions {
  /** The deck ID: the channel's name. */
  id: string;
  view: DeckView;
  viewRef: { readonly current: DeckView };
  commit: (next: DeckView) => void;
  go: (index: number, step?: number) => void;
  slides: DeckSlide[];
  onPositionChange?: (position: DeckPosition & { id: string }) => void;
}

export function useDeckSync({ id, view, viewRef, commit, go, slides, onPositionChange }: DeckSyncOptions) {
  const channel = useRef<BroadcastChannel | null>(null);
  // Set while applying another window's move, so it is not broadcast back.
  const remote = useRef(false);
  // The last position this window reported. Mounting (and StrictMode's second mount) reports nothing,
  // so opening a speaker window never moves the audience window.
  const reported = useRef({ index: view.index, step: view.step });
  const countRef = useLatest(slides.length);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const ch = new BroadcastChannel(`uipack-deck:${id}`);
    channel.current = ch;
    ch.onmessage = (e: MessageEvent) => {
      const msg = e.data as SyncMessage;
      const v = viewRef.current;
      if (msg.type === "hello") {
        ch.postMessage({ type: "go", index: v.index, step: v.step } satisfies SyncMessage);
      } else if (msg.type === "go" && typeof msg.index === "number") {
        // Where the move lands here: another window may hold more slides, so it is clamped first.
        // Only a move that changes the position is marked as remote; a mark left by a no-op would
        // stay set and swallow this window's next move.
        const index = Math.min(Math.max(msg.index, 0), countRef.current - 1);
        const step = msg.step ?? 0;
        if (v.index === index && v.step === step) return;
        remote.current = true;
        if (v.index === index) commit({ ...v, step });
        else go(index, step);
      }
    };
    ch.postMessage({ type: "hello" } satisfies SyncMessage);
    return () => {
      ch.close();
      channel.current = null;
    };
  }, [id, go, commit, viewRef, countRef]);

  // Report a real position change: to the host, and to the other windows unless it came from them.
  const reportRef = useLatest({ slides, onPositionChange });
  useEffect(() => {
    const last = reported.current;
    if (last.index === view.index && last.step === view.step) return;
    reported.current = { index: view.index, step: view.step };
    const { slides, onPositionChange } = reportRef.current;
    onPositionChange?.({ index: view.index, step: view.step, id: slides[view.index].id });
    if (remote.current) {
      remote.current = false;
      return;
    }
    channel.current?.postMessage({ type: "go", index: view.index, step: view.step } satisfies SyncMessage);
  }, [view.index, view.step, reportRef]);
}
