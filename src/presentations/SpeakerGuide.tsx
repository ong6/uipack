import { useId, useState } from "react";
import type {
  PresentationTheme,
  SpeechGuide as SpeechGuideData,
} from "./types";

export function estimateSpeechSeconds(say: string): number {
  const words = say.trim().match(/\S+/g)?.length ?? 0;
  if (!words) return 0;
  return Math.max(5, Math.round((words / 135) * 12) * 5);
}

export function formatSpeechGuide(speech: SpeechGuideData): string {
  return [
    `Say this\n${speech.say}`,
    `Delivery\n${speech.delivery}`,
    speech.next ? `Into the next slide\n${speech.next}` : undefined,
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const field = document.createElement("textarea");
  field.value = value;
  field.readOnly = true;
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.append(field);
  field.select();
  const copied = document.execCommand?.("copy") ?? false;
  field.remove();
  if (!copied) throw new Error("Copy is unavailable.");
}

export interface SpeakerGuideProps {
  speech: SpeechGuideData;
  slideTitle?: string;
  onCopy?: (text: string) => void;
  className?: string;
  theme?: PresentationTheme;
}

export function SpeakerGuide({
  speech,
  slideTitle = "Slide",
  onCopy,
  className = "",
  theme = "light",
}: SpeakerGuideProps) {
  const headingId = useId();
  const [status, setStatus] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const seconds = estimateSpeechSeconds(speech.say);
  const text = formatSpeechGuide(speech);
  const copy = async () => {
    try {
      await copyText(text);
      setStatus("copied");
      onCopy?.(text);
    } catch {
      setStatus("error");
    }
  };

  return (
    <aside
      className={`uipack-speaker-guide ${className}`.trim()}
      aria-labelledby={headingId}
      data-theme={theme}
    >
      <div className="uipack-speaker-guide__heading">
        <h3 id={headingId}>Speaker guide</h3>
        <span aria-label={`Estimated speaking time ${seconds} seconds`}>
          ~{seconds} sec
        </span>
      </div>
      <div className="uipack-speaker-guide__section">
        <h4>Say this</h4>
        <p>{speech.say}</p>
      </div>
      <div className="uipack-speaker-guide__section">
        <h4>Delivery</h4>
        <p>{speech.delivery}</p>
      </div>
      {speech.next && (
        <div className="uipack-speaker-guide__section">
          <h4>Into the next slide</h4>
          <p>{speech.next}</p>
        </div>
      )}
      <div className="uipack-speaker-guide__action">
        <button type="button" onClick={copy}>
          Copy talk track
        </button>
        <span role="status" aria-live="polite" aria-atomic="true">
          {status === "copied"
            ? `${slideTitle} talk track copied.`
            : status === "error"
              ? "Could not copy the talk track. Select the text instead."
              : ""}
        </span>
      </div>
    </aside>
  );
}
