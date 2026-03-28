"use client";

import { useEffect, useState } from "react";
import type { DocumentLayout } from "@/lib/documentLayout";
import { MARGIN_PRESETS, defaultDocumentLayout } from "@/lib/documentLayout";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  layout: DocumentLayout;
  onSave: (next: DocumentLayout) => void;
};

const field =
  "mt-1 w-full rounded border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900 dark:border-surface-border dark:bg-surface dark:text-zinc-100";

const btnPreset =
  "rounded-md border border-zinc-200 px-2 py-1 text-[11px] text-zinc-700 hover:bg-zinc-100 dark:border-surface-border dark:text-zinc-300 dark:hover:bg-surface-overlay";

export function LayoutModal({ open, onClose, layout, onSave }: Props) {
  const [draft, setDraft] = useState<DocumentLayout>(layout);

  useEffect(() => {
    if (open) setDraft(layout);
  }, [open, layout]);

  if (!open) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSave(draft);
    onClose();
  }

  const pillOn =
    "border-accent bg-blue-100 text-blue-900 dark:bg-blue-500/20 dark:text-zinc-100";
  const pillOff =
    "border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-surface-border dark:text-zinc-400 dark:hover:bg-surface-overlay";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/60" aria-label="Close" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-surface-border dark:bg-surface-raised">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-surface-border">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Page layout</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-surface-overlay dark:hover:text-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4 p-4">
          <div>
            <span className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Columns</span>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, columns: n }))}
                  className={`flex-1 rounded-lg border py-2 text-xs ${
                    draft.columns === n ? pillOn : pillOff
                  }`}
                >
                  {n === 1 ? "One" : n === 2 ? "Two" : "Three"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Orientation</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...d, orientation: "portrait" }))}
                className={`flex-1 rounded-lg border py-2 text-xs ${
                  draft.orientation === "portrait" ? pillOn : pillOff
                }`}
              >
                Portrait
              </button>
              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...d, orientation: "landscape" }))}
                className={`flex-1 rounded-lg border py-2 text-xs ${
                  draft.orientation === "landscape" ? pillOn : pillOff
                }`}
              >
                Landscape
              </button>
            </div>
          </div>

          <div>
            <span className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Margin preset</span>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={btnPreset} onClick={() => setDraft((d) => ({ ...d, ...MARGIN_PRESETS.narrow }))}>
                Narrow
              </button>
              <button type="button" className={btnPreset} onClick={() => setDraft((d) => ({ ...d, ...MARGIN_PRESETS.normal }))}>
                Normal
              </button>
              <button type="button" className={btnPreset} onClick={() => setDraft((d) => ({ ...d, ...MARGIN_PRESETS.wide }))}>
                Wide
              </button>
              <button
                type="button"
                className={btnPreset}
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    marginTop: defaultDocumentLayout.marginTop,
                    marginBottom: defaultDocumentLayout.marginBottom,
                    marginLeft: defaultDocumentLayout.marginLeft,
                    marginRight: defaultDocumentLayout.marginRight,
                  }))
                }
              >
                Default margins
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="block text-[11px] text-zinc-600 dark:text-zinc-400">
              Top
              <input className={field} value={draft.marginTop} onChange={(e) => setDraft((d) => ({ ...d, marginTop: e.target.value }))} />
            </label>
            <label className="block text-[11px] text-zinc-600 dark:text-zinc-400">
              Bottom
              <input
                className={field}
                value={draft.marginBottom}
                onChange={(e) => setDraft((d) => ({ ...d, marginBottom: e.target.value }))}
              />
            </label>
            <label className="block text-[11px] text-zinc-600 dark:text-zinc-400">
              Left
              <input className={field} value={draft.marginLeft} onChange={(e) => setDraft((d) => ({ ...d, marginLeft: e.target.value }))} />
            </label>
            <label className="block text-[11px] text-zinc-600 dark:text-zinc-400">
              Right
              <input
                className={field}
                value={draft.marginRight}
                onChange={(e) => setDraft((d) => ({ ...d, marginRight: e.target.value }))}
              />
            </label>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Header</label>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 dark:border-surface-border dark:bg-surface dark:text-zinc-100 dark:placeholder:text-zinc-600"
              placeholder="Optional header text (included in exports)"
              value={draft.headerText}
              onChange={(e) => setDraft((d) => ({ ...d, headerText: e.target.value }))}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Footer</label>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 dark:border-surface-border dark:bg-surface dark:text-zinc-100 dark:placeholder:text-zinc-600"
              placeholder="Optional footer text"
              value={draft.footerText}
              onChange={(e) => setDraft((d) => ({ ...d, footerText: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-zinc-200 pt-3 dark:border-surface-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-surface-overlay"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-muted"
            >
              Apply
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
