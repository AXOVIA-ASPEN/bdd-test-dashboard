'use client';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm min-w-0">
      <Link
        href="/"
        className="shrink-0 p-1 rounded hover:bg-card-border/50 transition-colors text-muted hover:text-accent"
        aria-label="Dashboard"
      >
        <Home className="w-4 h-4" />
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5 min-w-0">
          <ChevronRight className="w-3.5 h-3.5 text-muted shrink-0" />
          {item.href ? (
            <Link
              href={item.href}
              className="text-muted hover:text-accent transition-colors truncate max-w-[200px] sm:max-w-none"
              title={item.label}
            >
              {item.label}
            </Link>
          ) : (
            <span
              className="text-foreground font-medium truncate max-w-[200px] sm:max-w-none"
              title={item.label}
            >
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
