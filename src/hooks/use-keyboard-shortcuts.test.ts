/**
 * Tests for useKeyboardShortcuts hook
 */

import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useKeyboardShortcuts } from './use-keyboard-shortcuts';

describe('useKeyboardShortcuts', () => {
  let mockHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockHandler = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('basic functionality', () => {
    it('registers a simple keyboard shortcut', () => {
      renderHook(() =>
        useKeyboardShortcuts([{ key: 'k', handler: mockHandler }])
      );

      const event = new KeyboardEvent('keydown', { key: 'k' });
      document.dispatchEvent(event);

      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it('handles case-insensitive key matching', () => {
      renderHook(() =>
        useKeyboardShortcuts([{ key: 'K', handler: mockHandler }])
      );

      const event = new KeyboardEvent('keydown', { key: 'k' });
      document.dispatchEvent(event);

      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it('does not trigger handler for different key', () => {
      renderHook(() =>
        useKeyboardShortcuts([{ key: 'k', handler: mockHandler }])
      );

      const event = new KeyboardEvent('keydown', { key: 'j' });
      document.dispatchEvent(event);

      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('cleans up event listener on unmount', () => {
      const { unmount } = renderHook(() =>
        useKeyboardShortcuts([{ key: 'k', handler: mockHandler }])
      );

      unmount();

      const event = new KeyboardEvent('keydown', { key: 'k' });
      document.dispatchEvent(event);

      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('modifier keys', () => {
    it('requires Alt key when alt: true', () => {
      renderHook(() =>
        useKeyboardShortcuts([{ key: 'k', handler: mockHandler, alt: true }])
      );

      // Without Alt
      let event = new KeyboardEvent('keydown', { key: 'k' });
      document.dispatchEvent(event);
      expect(mockHandler).not.toHaveBeenCalled();

      // With Alt
      event = new KeyboardEvent('keydown', { key: 'k', altKey: true });
      document.dispatchEvent(event);
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it('requires Ctrl/Cmd key when ctrlOrCmd: true', () => {
      renderHook(() =>
        useKeyboardShortcuts([{ key: 'k', handler: mockHandler, ctrlOrCmd: true }])
      );

      // Without Ctrl/Cmd
      let event = new KeyboardEvent('keydown', { key: 'k' });
      document.dispatchEvent(event);
      expect(mockHandler).not.toHaveBeenCalled();

      // With Ctrl
      event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
      document.dispatchEvent(event);
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it('accepts metaKey (Cmd on Mac) when ctrlOrCmd: true', () => {
      renderHook(() =>
        useKeyboardShortcuts([{ key: 'k', handler: mockHandler, ctrlOrCmd: true }])
      );

      const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
      document.dispatchEvent(event);

      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it('rejects extra modifier keys when not specified', () => {
      renderHook(() =>
        useKeyboardShortcuts([{ key: 'k', handler: mockHandler }])
      );

      // Should not trigger with extra Alt
      let event = new KeyboardEvent('keydown', { key: 'k', altKey: true });
      document.dispatchEvent(event);
      expect(mockHandler).not.toHaveBeenCalled();

      // Should not trigger with extra Ctrl
      event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
      document.dispatchEvent(event);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('handles combined Alt + Ctrl shortcuts', () => {
      renderHook(() =>
        useKeyboardShortcuts([
          { key: 'k', handler: mockHandler, alt: true, ctrlOrCmd: true },
        ])
      );

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        altKey: true,
        ctrlKey: true,
      });
      document.dispatchEvent(event);

      expect(mockHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('form field suppression', () => {
    it('suppresses shortcuts when focus is in input field', () => {
      renderHook(() =>
        useKeyboardShortcuts([{ key: 'k', handler: mockHandler }])
      );

      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      const event = new KeyboardEvent('keydown', { key: 'k', bubbles: true });
      document.dispatchEvent(event);

      expect(mockHandler).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it('suppresses shortcuts when focus is in textarea', () => {
      renderHook(() =>
        useKeyboardShortcuts([{ key: 'k', handler: mockHandler }])
      );

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      textarea.focus();

      const event = new KeyboardEvent('keydown', { key: 'k', bubbles: true });
      document.dispatchEvent(event);

      expect(mockHandler).not.toHaveBeenCalled();

      document.body.removeChild(textarea);
    });

    it('suppresses shortcuts when focus is in select field', () => {
      renderHook(() =>
        useKeyboardShortcuts([{ key: 'k', handler: mockHandler }])
      );

      const select = document.createElement('select');
      document.body.appendChild(select);
      select.focus();

      const event = new KeyboardEvent('keydown', { key: 'k', bubbles: true });
      document.dispatchEvent(event);

      expect(mockHandler).not.toHaveBeenCalled();

      document.body.removeChild(select);
    });

    it('suppresses shortcuts in contenteditable elements', () => {
      renderHook(() =>
        useKeyboardShortcuts([{ key: 'k', handler: mockHandler }])
      );

      const div = document.createElement('div');
      div.setAttribute('contenteditable', 'true');
      document.body.appendChild(div);
      div.focus();

      const event = new KeyboardEvent('keydown', { key: 'k', bubbles: true });
      document.dispatchEvent(event);

      expect(mockHandler).not.toHaveBeenCalled();

      document.body.removeChild(div);
    });

    it('allows Escape key even in form fields', () => {
      renderHook(() =>
        useKeyboardShortcuts([{ key: 'Escape', handler: mockHandler }])
      );

      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(event);

      expect(mockHandler).toHaveBeenCalledTimes(1);

      document.body.removeChild(input);
    });
  });

  describe('conditional shortcuts', () => {
    it('triggers shortcut when when: true', () => {
      renderHook(() =>
        useKeyboardShortcuts([{ key: 'k', handler: mockHandler, when: true }])
      );

      const event = new KeyboardEvent('keydown', { key: 'k' });
      document.dispatchEvent(event);

      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it('skips shortcut when when: false', () => {
      renderHook(() =>
        useKeyboardShortcuts([{ key: 'k', handler: mockHandler, when: false }])
      );

      const event = new KeyboardEvent('keydown', { key: 'k' });
      document.dispatchEvent(event);

      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('triggers shortcut when when is undefined (defaults to true)', () => {
      renderHook(() =>
        useKeyboardShortcuts([{ key: 'k', handler: mockHandler }])
      );

      const event = new KeyboardEvent('keydown', { key: 'k' });
      document.dispatchEvent(event);

      expect(mockHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('multiple shortcuts', () => {
    it('registers multiple shortcuts', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      renderHook(() =>
        useKeyboardShortcuts([
          { key: 'k', handler: handler1 },
          { key: 'j', handler: handler2 },
        ])
      );

      const event1 = new KeyboardEvent('keydown', { key: 'k' });
      document.dispatchEvent(event1);
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).not.toHaveBeenCalled();

      const event2 = new KeyboardEvent('keydown', { key: 'j' });
      document.dispatchEvent(event2);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler1).toHaveBeenCalledTimes(1);
    });

    it('stops after first matching shortcut', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      renderHook(() =>
        useKeyboardShortcuts([
          { key: 'k', handler: handler1 },
          { key: 'k', handler: handler2 }, // Duplicate key
        ])
      );

      const event = new KeyboardEvent('keydown', { key: 'k' });
      document.dispatchEvent(event);

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).not.toHaveBeenCalled(); // Should not execute second handler
    });
  });

  describe('event prevention', () => {
    it('prevents default behavior when shortcut matches', () => {
      renderHook(() =>
        useKeyboardShortcuts([{ key: 'k', handler: mockHandler }])
      );

      const event = new KeyboardEvent('keydown', { key: 'k' });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      
      document.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it('does not prevent default when no shortcut matches', () => {
      renderHook(() =>
        useKeyboardShortcuts([{ key: 'k', handler: mockHandler }])
      );

      const event = new KeyboardEvent('keydown', { key: 'j' });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      
      document.dispatchEvent(event);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });
});
