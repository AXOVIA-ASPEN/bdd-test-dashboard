export function Footer() {
  return (
    <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-card-border">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted">
        <span>© {new Date().getFullYear()} Silverline Software</span>
        <div className="flex items-center gap-4">
          <a href="https://github.com/Silverline-Software" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
          <span>BDD Test Dashboard v1.0</span>
        </div>
      </div>
    </footer>
  );
}
