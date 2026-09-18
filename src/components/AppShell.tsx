import { useEffect, useState, type ReactNode } from 'react';
import { Menu, Search } from 'lucide-react';
import { Sidebar, MobileSidebar } from './Sidebar';
import { NotificationBell } from './NotificationBell';
import { CommandPalette } from './CommandPalette';

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="flex min-h-screen bg-canvas">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Sidebar />
      <MobileSidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3 lg:px-6">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink-body hover:bg-surface-sunken lg:hidden"
          >
            <Menu size={20} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex min-h-[44px] flex-1 max-w-[420px] items-center gap-2 rounded-[8px] border border-line-strong bg-surface px-3 py-2 text-[14px] text-ink-muted hover:bg-surface-sunken"
          >
            <Search size={16} aria-hidden />
            <span className="flex-1 text-left">Search students, cases, activities</span>
            <kbd className="hidden rounded border border-line-strong px-1.5 py-0.5 text-[11px] text-ink-muted sm:inline">⌘K</kbd>
          </button>
          <div className="ml-auto">
            <NotificationBell />
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6">{children}</div>
        </main>
      </div>
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
