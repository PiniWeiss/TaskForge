import { useEffect, useRef } from 'react';

/** Return `false` from a handler to leave the key to the browser (it is then not prevented). */
export type HotkeyMap = Partial<Record<string, (event: KeyboardEvent) => unknown>>;

/** Typing in a field, or working inside a menu or dialog, owns the keyboard. */
export function isTypingOrInOverlay(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target.closest('input, textarea, select')) return true;
  return target.closest('[role="menu"], [role="listbox"], [role="dialog"], [role="alertdialog"]')
    ? true
    : false;
}

/**
 * Single-key shortcuts ("j", "Escape", "?", "/") on the document. Ignored while typing, inside
 * menus and dialogs, and when a modifier other than Shift is held, so browser shortcuts still work.
 */
export function useHotkeys(map: HotkeyMap, enabled = true): void {
  const latest = useRef(map);
  useEffect(() => {
    latest.current = map;
  });

  useEffect(() => {
    if (!enabled) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTypingOrInOverlay(event.target)) return;
      const handler = latest.current[event.key] ?? latest.current[event.key.toLowerCase()];
      if (!handler) return;
      if (handler(event) !== false) event.preventDefault();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [enabled]);
}
