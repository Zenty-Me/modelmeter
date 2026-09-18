"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Share2 } from "lucide-react";

/** How long "Link copied" stays on screen. */
const FEEDBACK_MS = 2000;

type Feedback = "idle" | "copied" | "failed";

/**
 * Copies text without assuming the async Clipboard API exists.
 *
 * That API is only available in a secure context, so a page served over plain
 * HTTP falls back to the selection-based command. Copying is a convenience,
 * never a requirement: if both routes fail the caller reports it and the button
 * stays usable.
 */
async function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Permission denied or an insecure context — try the legacy route.
    }
  }

  return copyTextWithSelection(text);
}

/** Last-resort copy for browsers without the async Clipboard API. */
function copyTextWithSelection(text: string): boolean {
  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  // Off-screen, but still in the document: `select()` needs a live node.
  field.style.position = "fixed";
  field.style.top = "0";
  field.style.left = "-9999px";
  document.body.appendChild(field);

  try {
    field.select();
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(field);
  }
}

const BUTTON_CLASS =
  "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";

const FEEDBACK_TEXT: Record<Feedback, string> = {
  idle: "",
  copied: "Link copied",
  failed: "Copy failed — copy the address bar",
};

/**
 * Copies the current URL, which already encodes the calculator inputs.
 *
 * The address bar is read at click time rather than rebuilt from state, so what
 * lands in the clipboard is exactly the link the user is looking at.
 */
export function ShareEstimate() {
  const [feedback, setFeedback] = useState<Feedback>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleClick = useCallback(async () => {
    const copied = await copyText(window.location.href);

    setFeedback(copied ? "copied" : "failed");

    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setFeedback("idle"), FEEDBACK_MS);
  }, []);

  const Icon = feedback === "copied" ? Check : Share2;

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <button type="button" onClick={handleClick} className={BUTTON_CLASS}>
        <Icon className="h-4 w-4" aria-hidden="true" />
        Share estimate
      </button>
      {/* Reserved height: the confirmation appears without shifting the card. */}
      <p role="status" className="min-h-4 text-xs text-slate-500">
        {FEEDBACK_TEXT[feedback]}
      </p>
    </div>
  );
}
