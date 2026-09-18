"use client";

import { Calculator } from "lucide-react";
import type { KeyboardEvent } from "react";
import type { UsageDraft, UsagePreset } from "@/lib/types";
import { SCENARIO_PRESETS, SIZE_PRESETS, matchPresetId } from "@/lib/presets";
import { parseUsageDraft, toUsageDraft } from "@/lib/calculator";

type UsageCalculatorProps = {
  draft: UsageDraft;
  onChange: (draft: UsageDraft) => void;
};

type FieldConfig = {
  key: keyof UsageDraft;
  label: string;
  hint: string;
};

const FIELDS: readonly FieldConfig[] = [
  {
    key: "monthlyRequests",
    label: "Monthly Requests",
    hint: "Total API requests per month",
  },
  {
    key: "inputTokensPerRequest",
    label: "Average Input Tokens / Request",
    hint: "Prompt tokens sent per request",
  },
  {
    key: "outputTokensPerRequest",
    label: "Average Output Tokens / Request",
    hint: "Completion tokens returned per request",
  },
];

const BLOCKED_KEYS = ["-", "+", "e", "E"];

/** Explains how an unusable raw value is handled instead of failing silently. */
function getFieldMessage(raw: string): string | null {
  const trimmed = raw.trim();

  if (trimmed === "") return "Empty — calculated as 0.";

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return "Numbers only — calculated as 0.";
  if (parsed < 0) return "Negative values are not allowed — calculated as 0.";

  return null;
}

function blockInvalidKeys(event: KeyboardEvent<HTMLInputElement>) {
  if (BLOCKED_KEYS.includes(event.key)) event.preventDefault();
}

export function UsageCalculator({ draft, onChange }: UsageCalculatorProps) {
  const activePresetId = matchPresetId(parseUsageDraft(draft));

  const applyPreset = (preset: UsagePreset) => {
    onChange(toUsageDraft(preset.usage));
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-2">
        <Calculator className="h-4 w-4 text-slate-500" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-slate-900">Usage Calculator</h2>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        Enter your expected monthly volume. Every field accepts non-negative
        numbers only.
      </p>

      <div className="mt-5 space-y-4">
        <PresetGroup
          legend="Scale"
          presets={SIZE_PRESETS}
          activeId={activePresetId}
          onSelect={applyPreset}
        />
        <PresetGroup
          legend="Scenario"
          presets={SCENARIO_PRESETS}
          activeId={activePresetId}
          onSelect={applyPreset}
        />
        <p className="text-xs text-slate-500">
          Presets are UX shortcuts only. They are not industry averages or
          benchmarks.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FIELDS.map((field) => (
          <NumberField
            key={field.key}
            id={field.key}
            label={field.label}
            hint={field.hint}
            value={draft[field.key]}
            onValueChange={(value) =>
              onChange({ ...draft, [field.key]: value })
            }
          />
        ))}
      </div>
    </div>
  );
}

type NumberFieldProps = {
  id: string;
  label: string;
  hint: string;
  value: string;
  onValueChange: (value: string) => void;
};

function NumberField({
  id,
  label,
  hint,
  value,
  onValueChange,
}: NumberFieldProps) {
  const message = getFieldMessage(value);
  const hintId = `${id}-hint`;
  const messageId = `${id}-message`;

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-slate-800"
      >
        {label}
      </label>
      <p id={hintId} className="mt-1 text-xs text-slate-500">
        {hint}
      </p>
      <input
        id={id}
        name={id}
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={blockInvalidKeys}
        aria-describedby={message ? messageId : hintId}
        aria-invalid={message ? true : undefined}
        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
      />
      {message ? (
        <p id={messageId} className="mt-1.5 text-xs text-amber-700">
          {message}
        </p>
      ) : null}
    </div>
  );
}

type PresetGroupProps = {
  legend: string;
  presets: readonly UsagePreset[];
  activeId: string | null;
  onSelect: (preset: UsagePreset) => void;
};

function PresetGroup({
  legend,
  presets,
  activeId,
  onSelect,
}: PresetGroupProps) {
  return (
    <fieldset>
      <legend className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {legend}
      </legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {presets.map((preset) => {
          const isActive = preset.id === activeId;

          return (
            <button
              key={preset.id}
              type="button"
              title={preset.hint}
              aria-pressed={isActive}
              onClick={() => onSelect(preset)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
                isActive
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
