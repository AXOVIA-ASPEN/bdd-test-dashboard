/**
 * Custom hook to register global keyboard shortcuts
 * Shortcuts are suppressed when focus is inside form fields
 */

import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  handler: () => void;
  when?: boolean;
}

/**
 * Check if the active element is a form field where we should suppress shortcuts
 */
function isFormField(element: Element | null): boolean {
  if (!element) return false;
  const tagName = element.tagName.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    element.hasAttribute('contenteditable')
  );
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if typing in form field
      if (isFormField(document.activeElement)) {
        return;
      }

      // Find matching shortcut
      for (const shortcut of shortcuts) {
        // Skip if conditional is false
        if (shortcut.when === false) continue;

        // Match key (case-insensitive)
        if (event.key.toLowerCase() === shortcut.key.toLowerCase()) {
          event.preventDefault();
          shortcut.handler();
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
