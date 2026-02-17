/**
 * Announce a message to screen readers via the aria-live region.
 * Uses requestAnimationFrame to ensure the DOM update is picked up.
 */
export function announce(message: string) {
  if (typeof document === 'undefined') return;
  const el = document.getElementById('announcer');
  if (el) {
    el.textContent = '';
    requestAnimationFrame(() => {
      el.textContent = message;
    });
  }
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Debounced announce — collapses rapid updates into one announcement.
 */
export function announceDebounced(message: string, delayMs = 1000) {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => announce(message), delayMs);
}
