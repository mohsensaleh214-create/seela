import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  width?: string;
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  onRowClick,
  rowLabel,
}: {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  rowLabel?: (row: T) => string;
}) {
  return (
    <div className="overflow-x-auto rounded-[12px] border border-line bg-surface">
      <table className="w-full min-w-[640px] border-collapse text-left text-[15px]">
        <thead className="sticky top-0 z-10 bg-surface-sunken">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className="border-b border-line px-4 py-3 text-[13px] font-medium text-ink-muted"
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              role={onRowClick ? 'button' : undefined}
              aria-label={onRowClick && rowLabel ? rowLabel(row) : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onRowClick(row);
                      }
                    }
                  : undefined
              }
              className={`border-b border-line last:border-0 ${
                onRowClick ? 'cursor-pointer hover:bg-surface-sunken focus-visible:bg-surface-sunken' : ''
              }`}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 align-middle text-ink-body">
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <div className="px-4 py-10 text-center text-[15px] text-ink-muted">Nothing to show here.</div>}
    </div>
  );
}
