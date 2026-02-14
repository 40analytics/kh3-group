import type { Table } from '@tanstack/react-table';

export function exportTableToCSV<TData>(
  table: Table<TData>,
  filename: string
) {
  const visibleColumns = table
    .getAllColumns()
    .filter((col) => col.getIsVisible() && col.id !== 'actions' && col.id !== 'select');

  // Header row
  const headers = visibleColumns.map(
    (col) => {
      const def = col.columnDef;
      const header = typeof def.header === 'string' ? def.header : col.id;
      return `"${String(header).replace(/"/g, '""')}"`;
    }
  );

  // Data rows — use filtered + sorted rows
  const rows = table.getFilteredRowModel().rows.map((row) =>
    visibleColumns.map((col) => {
      const value = row.getValue(col.id);
      const str = value == null ? '' : String(value);
      return `"${str.replace(/"/g, '""')}"`;
    })
  );

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
