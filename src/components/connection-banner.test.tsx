import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConnectionBanner } from './connection-banner';

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
}));

vi.mock('lucide-react', () => ({
  WifiOff: () => <span data-testid="wifi-off-icon" />,
  CloudOff: () => <span data-testid="cloud-off-icon" />,
}));

const mockStore: any = {};
vi.mock('@/store/use-dashboard-store', () => ({
  useDashboardStore: (selector: any) => selector(mockStore),
}));

describe('ConnectionBanner', () => {
  beforeEach(() => {
    mockStore.connected = true;
    mockStore.browserOnline = true;
  });

  it('renders nothing when connected and online', () => {
    const { container } = render(<ConnectionBanner />);
    expect(container.textContent).toBe('');
  });

  it('shows offline message when browser is offline', () => {
    mockStore.browserOnline = false;
    render(<ConnectionBanner />);
    expect(screen.getByText(/You are offline/)).toBeInTheDocument();
    expect(screen.getByTestId('wifi-off-icon')).toBeInTheDocument();
  });

  it('shows connection lost message when Firestore disconnected but browser online', () => {
    mockStore.connected = false;
    render(<ConnectionBanner />);
    expect(screen.getByText(/Connection lost/)).toBeInTheDocument();
    expect(screen.getByTestId('cloud-off-icon')).toBeInTheDocument();
  });

  it('shows offline message when both offline and disconnected (offline takes priority)', () => {
    mockStore.browserOnline = false;
    mockStore.connected = false;
    render(<ConnectionBanner />);
    expect(screen.getByText(/You are offline/)).toBeInTheDocument();
  });
});
