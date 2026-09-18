export interface TabItem {
  key: string;
  label: string;
  locked?: boolean;
}

export function Tabs({
  items,
  active,
  onChange,
  portalAccent,
}: {
  items: TabItem[];
  active: string;
  onChange: (key: string) => void;
  portalAccent?: string;
}) {
  return (
    <div role="tablist" aria-label="Sections" className="flex gap-1 border-b border-line overflow-x-auto">
      {items.map((item) => {
        const isActive = item.key === active;
        return (
          <button
            key={item.key}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange(item.key)}
            className={`relative whitespace-nowrap px-4 py-3 text-[15px] font-medium transition-colors duration-150 ${
              isActive ? 'text-ink' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {item.label}
            {item.locked && <span className="ml-1 text-ink-muted">🔒</span>}
            {isActive && (
              <span
                className="absolute inset-x-2 -bottom-px h-[2px] rounded-full"
                style={{ backgroundColor: portalAccent ?? 'var(--color-ink)' }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
