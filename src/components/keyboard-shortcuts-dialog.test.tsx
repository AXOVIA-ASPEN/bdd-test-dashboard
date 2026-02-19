import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KeyboardShortcutsDialog } from './keyboard-shortcuts-dialog';

describe('KeyboardShortcutsDialog', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  describe('Rendering', () => {
    it('does not render when open is false', () => {
      render(<KeyboardShortcutsDialog open={false} onClose={mockOnClose} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
    });

    it('renders dialog when open is true', () => {
      render(<KeyboardShortcutsDialog open={true} onClose={mockOnClose} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    it('renders all keyboard shortcuts', () => {
      render(<KeyboardShortcutsDialog open={true} onClose={mockOnClose} />);
      
      // Check for key shortcuts
      expect(screen.getByText('r')).toBeInTheDocument();
      expect(screen.getByText('t')).toBeInTheDocument();
      expect(screen.getByText('/')).toBeInTheDocument();
      expect(screen.getByText('Esc')).toBeInTheDocument();
      expect(screen.getByText('Backspace')).toBeInTheDocument();
      expect(screen.getByText('Alt + ←')).toBeInTheDocument();
      
      // Check for actions
      expect(screen.getByText('Refresh data')).toBeInTheDocument();
      expect(screen.getByText('Toggle dark/light theme')).toBeInTheDocument();
      expect(screen.getByText('Focus search/filter')).toBeInTheDocument();
      expect(screen.getByText('Close dialogs/panels')).toBeInTheDocument();
      expect(screen.getAllByText('Navigate back').length).toBe(2); // Appears twice
      expect(screen.getByText('Show/hide shortcuts')).toBeInTheDocument();
    });

    it('renders context information for each shortcut', () => {
      render(<KeyboardShortcutsDialog open={true} onClose={mockOnClose} />);
      
      expect(screen.getAllByText('All pages').length).toBe(3); // r, t, and ? shortcuts
      expect(screen.getByText('Dashboard, Project pages')).toBeInTheDocument();
      expect(screen.getByText('When dialog open')).toBeInTheDocument();
      expect(screen.getAllByText('Detail pages').length).toBe(2); // Backspace and Alt+← shortcuts
    });

    it('renders keyboard icon in header', () => {
      render(<KeyboardShortcutsDialog open={true} onClose={mockOnClose} />);
      
      const svg = screen.getByRole('dialog').querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders close button with proper aria-label', () => {
      render(<KeyboardShortcutsDialog open={true} onClose={mockOnClose} />);
      
      const closeButton = screen.getByLabelText('Close shortcuts dialog');
      expect(closeButton).toBeInTheDocument();
    });

    it('has proper ARIA attributes', () => {
      render(<KeyboardShortcutsDialog open={true} onClose={mockOnClose} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'shortcuts-title');
    });

    it('renders footer with help text', () => {
      render(<KeyboardShortcutsDialog open={true} onClose={mockOnClose} />);
      
      expect(screen.getByText(/anytime to toggle this help/)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onClose when close button is clicked', () => {
      render(<KeyboardShortcutsDialog open={true} onClose={mockOnClose} />);
      
      const closeButton = screen.getByLabelText('Close shortcuts dialog');
      fireEvent.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', () => {
      render(<KeyboardShortcutsDialog open={true} onClose={mockOnClose} />);
      
      const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50');
      expect(backdrop).toBeInTheDocument();
      
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }
    });

    it('calls onClose when Escape key is pressed', () => {
      render(<KeyboardShortcutsDialog open={true} onClose={mockOnClose} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when other keys are pressed', () => {
      render(<KeyboardShortcutsDialog open={true} onClose={mockOnClose} />);
      
      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'a' });
      fireEvent.keyDown(document, { key: 'Tab' });
      
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('does not listen for Escape when dialog is closed', () => {
      const { rerender } = render(
        <KeyboardShortcutsDialog open={true} onClose={mockOnClose} />
      );
      
      // Close the dialog
      rerender(<KeyboardShortcutsDialog open={false} onClose={mockOnClose} />);
      
      // Try pressing Escape
      fireEvent.keyDown(document, { key: 'Escape' });
      
      // onClose should not be called because dialog is closed
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<KeyboardShortcutsDialog open={true} onClose={mockOnClose} />);
      
      const heading = screen.getByText('Keyboard Shortcuts');
      expect(heading.tagName).toBe('H2');
      expect(heading).toHaveAttribute('id', 'shortcuts-title');
    });

    it('uses semantic kbd elements for key display', () => {
      render(<KeyboardShortcutsDialog open={true} onClose={mockOnClose} />);
      
      const kbdElements = document.querySelectorAll('kbd');
      expect(kbdElements.length).toBeGreaterThan(0);
      
      // Check that shortcuts are in kbd elements
      const rKey = Array.from(kbdElements).find(el => el.textContent === 'r');
      expect(rKey).toBeInTheDocument();
    });

    it('backdrop has aria-hidden attribute', () => {
      render(<KeyboardShortcutsDialog open={true} onClose={mockOnClose} />);
      
      const backdrop = document.querySelector('[aria-hidden="true"]');
      expect(backdrop).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid open/close transitions', () => {
      const { rerender } = render(
        <KeyboardShortcutsDialog open={false} onClose={mockOnClose} />
      );
      
      // Rapidly toggle
      rerender(<KeyboardShortcutsDialog open={true} onClose={mockOnClose} />);
      rerender(<KeyboardShortcutsDialog open={false} onClose={mockOnClose} />);
      rerender(<KeyboardShortcutsDialog open={true} onClose={mockOnClose} />);
      
      // Dialog should be open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('cleanup removes event listener on unmount', () => {
      const { unmount } = render(
        <KeyboardShortcutsDialog open={true} onClose={mockOnClose} />
      );
      
      // Unmount the component
      unmount();
      
      // Try pressing Escape after unmount
      fireEvent.keyDown(document, { key: 'Escape' });
      
      // Should not crash and onClose should not be called
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('prevents default on Escape key press', () => {
      render(<KeyboardShortcutsDialog open={true} onClose={mockOnClose} />);
      
      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      
      document.dispatchEvent(event);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Visual Elements', () => {
    it('renders shortcut rows with hover styling classes', () => {
      render(<KeyboardShortcutsDialog open={true} onClose={mockOnClose} />);
      
      const rows = document.querySelectorAll('.hover\\:bg-accent\\/5');
      expect(rows.length).toBeGreaterThan(0);
    });

    it('renders kbd elements with proper styling', () => {
      render(<KeyboardShortcutsDialog open={true} onClose={mockOnClose} />);
      
      const kbdElements = document.querySelectorAll('kbd.font-mono');
      expect(kbdElements.length).toBeGreaterThan(0);
    });

    it('displays all 7 keyboard shortcuts', () => {
      render(<KeyboardShortcutsDialog open={true} onClose={mockOnClose} />);
      
      // There are 7 shortcuts defined, plus one in the footer (?)
      const rows = document.querySelectorAll('.space-y-3 > div');
      expect(rows.length).toBe(7);
    });
  });
});
