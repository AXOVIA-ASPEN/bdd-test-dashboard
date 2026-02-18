/**
 * Custom hook to register global keyboard shortcuts
 * Shortcuts are suppressed when focus is inside form fields
 */

import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  handler: () => void;
  when?: boolean;
  alt?: boolean; // Require Alt key to be pressed
  ctrlOrCmd?: boolean; // Require Ctrl (or Cmd on Mac) to be pressed
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
      // Ignore if typing in form field (except for special cases like Escape)
      if (isFormField(document.activeElement) && event.key !== 'Escape') {
        return;
      }

      // Find matching shortcut
      for (const shortcut of shortcuts) {
        // Skip if conditional is false
        if (shortcut.when === false) continue;

        // Check modifier keys match
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const ctrlMatch = shortcut.ctrlOrCmd 
          ? (event.ctrlKey || event.metaKey) 
          : !event.ctrlKey && !event.metaKey;

        // Match key (case-insensitive) and modifiers
        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          altMatch &&
          ctrlMatch
        ) {
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
