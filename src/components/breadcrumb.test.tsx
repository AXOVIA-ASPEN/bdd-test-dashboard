import { render, screen } from '@testing-library/react';
import { Breadcrumb } from './breadcrumb';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  ChevronRight: () => <span data-testid="chevron" />,
  Home: () => <span data-testid="home-icon" />,
}));

describe('Breadcrumb', () => {
  it('renders dashboard home link', () => {
    render(<Breadcrumb items={[{ label: 'My Project' }]} />);
    const nav = screen.getByLabelText('Breadcrumb');
    expect(nav).toBeInTheDocument();
    const homeLink = screen.getByLabelText('Dashboard');
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('renders current page without link', () => {
    render(<Breadcrumb items={[{ label: 'Current Page' }]} />);
    const current = screen.getByText('Current Page');
    expect(current.tagName).not.toBe('A');
    expect(current).toHaveClass('font-medium');
  });

  it('renders intermediate items as links', () => {
    render(
      <Breadcrumb
        items={[
          { label: 'Project A', href: '/project/abc/' },
          { label: 'Run Feb 16' },
        ]}
      />
    );
    const link = screen.getByText('Project A');
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/project/abc/');
    const current = screen.getByText('Run Feb 16');
    expect(current.tagName).not.toBe('A');
  });

  it('renders separators between items', () => {
    render(
      <Breadcrumb
        items={[
          { label: 'A', href: '/a' },
          { label: 'B' },
        ]}
      />
    );
    const chevrons = screen.getAllByTestId('chevron');
    expect(chevrons).toHaveLength(2);
  });

  it('truncates long names on mobile via CSS class', () => {
    render(<Breadcrumb items={[{ label: 'Very Long Project Name That Should Truncate' }]} />);
    const el = screen.getByText('Very Long Project Name That Should Truncate');
    expect(el).toHaveClass('truncate');
    expect(el).toHaveClass('max-w-[200px]');
  });
});
