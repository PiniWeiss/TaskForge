import { useSyncExternalStore } from 'react';

// One shared minute ticker for every relative timestamp on the page.
let now = new Date();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

function subscribe(listener: () => void) {
  listeners.add(listener);
  timer ??= setInterval(() => {
    now = new Date();
    for (const l of listeners) l();
  }, 60_000);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== undefined) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

/** The current time, refreshed once a minute. */
export function useNow(): Date {
  return useSyncExternalStore(subscribe, () => now);
}
