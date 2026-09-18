"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { UsageInput } from "@/lib/types";
import { buildCalculatorSearch, matchesCalculatorSearch } from "@/lib/url-state";

/**
 * Loads the calculator inputs from the URL, once, on mount.
 *
 * This is a separate component so the Suspense boundary required by
 * `useSearchParams` wraps nothing but the read: the calculator itself stays in
 * the prerendered HTML rather than being pushed behind a loading state.
 *
 * The read is deliberately one-shot. The URL seeds the calculator and then
 * stops driving it — from the first interaction onwards the data flows the
 * other way, through {@link CalculatorUrlWriter}.
 */
export function CalculatorUrlLoader({
  onSearch,
}: {
  onSearch: (search: string) => void;
}) {
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    onSearch(search);
  }, [onSearch, search]);

  return null;
}

/**
 * Mirrors the calculator inputs into the URL.
 *
 * `replace` keeps every keystroke out of the browser history — there is nothing
 * to go Back to but the previous page — and `scroll: false` stops the view
 * jumping to the top of the document while typing.
 *
 * The first render is skipped: on load the URL is the source of truth (see
 * {@link CalculatorUrlLoader}), so writing the default inputs over it would
 * throw away the very parameters that have just been read.
 */
export function CalculatorUrlWriter({ usage }: { usage: UsageInput }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = buildCalculatorSearch(usage);
  const hasSkippedFirstRenderRef = useRef(false);

  useEffect(() => {
    if (!hasSkippedFirstRenderRef.current) {
      hasSkippedFirstRenderRef.current = true;
      return;
    }

    if (matchesCalculatorSearch(search, window.location.search)) return;

    router.replace(search === "" ? pathname : `${pathname}?${search}`, {
      scroll: false,
    });
  }, [pathname, router, search]);

  return null;
}
