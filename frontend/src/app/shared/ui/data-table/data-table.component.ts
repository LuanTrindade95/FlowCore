import { Component, Input } from '@angular/core';

export interface DataTableColumn {
  key: string;
  label: string;
}

export type DataTableRow = Record<string, string | number>;

@Component({
  selector: 'app-data-table',
  standalone: true,
  template: `
    <div class="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead class="bg-slate-50 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
          <tr>
            @for (column of columns; track column.key) {
              <th scope="col" class="px-4 py-3">{{ column.label }}</th>
            }
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 text-slate-700">
          @for (row of rows; track trackRow($index)) {
            <tr class="hover:bg-slate-50">
              @for (column of columns; track column.key) {
                <td class="px-4 py-3">{{ row[column.key] }}</td>
              }
            </tr>
          } @empty {
            <tr>
              <td class="px-4 py-8 text-center text-slate-500" [attr.colspan]="columns.length">Nenhum registro encontrado.</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class DataTableComponent {
  @Input({ required: true }) columns: DataTableColumn[] = [];
  @Input({ required: true }) rows: DataTableRow[] = [];

  trackRow(index: number): number {
    return index;
  }
}
