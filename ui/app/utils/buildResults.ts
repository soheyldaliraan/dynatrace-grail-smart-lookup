import { LOOKUPS, type LookupTable } from "../data/lookupCatalog";
import type { BaseLogRow } from "../data/mockResults";
import { getPickedFieldsList, getQueryLookups } from "./dqlContext";

export type ResultRow = Record<string, string>;

export type BuiltResults = {
  rows: ResultRow[];
  columns: string[];
};

const BASE_COLUMNS = ["timestamp", "event_type", "app_id"] as const;

export function buildResults(
  query: string,
  baseRows: BaseLogRow[],
): BuiltResults {
  const lookups = getQueryLookups(query);
  const pickedFields = getPickedFieldsList(query);

  const lookupColumns: string[] = [];
  const lookupAdditionalSourceFields = new Set<string>();
  const tableByLookup = new Map<string, LookupTable | undefined>();

  for (const l of lookups) {
    const table = LOOKUPS.find((t) => t.id === l.tableId);
    tableByLookup.set(l.tableId + ":" + l.prefix, table);
    if (table) {
      for (const f of table.fields) {
        lookupColumns.push(`${l.prefix}${f}`);
      }
    }
    lookupAdditionalSourceFields.add(l.sourceField);
  }

  const allColumns = [
    ...BASE_COLUMNS,
    ...[...lookupAdditionalSourceFields].filter(
      (f) => !BASE_COLUMNS.includes(f as (typeof BASE_COLUMNS)[number]),
    ),
    ...lookupColumns,
  ];

  const rows: ResultRow[] = baseRows.map((row) => {
    const out: ResultRow = {
      timestamp: row.timestamp,
      event_type: row.event_type,
      app_id: row.app_id,
      http_status: row.http_status,
      owner_team: row.owner_team,
      region: row.region,
      severity: row.severity,
    };
    for (const l of lookups) {
      const table = tableByLookup.get(l.tableId + ":" + l.prefix);
      const sourceVal = (row as unknown as Record<string, string>)[
        l.sourceField
      ];
      const match = table?.rows.find((r) => r.key === sourceVal);
      for (const col of table?.fields ?? []) {
        out[`${l.prefix}${col}`] = match?.values[col] ?? "—";
      }
    }
    return out;
  });

  const finalColumns = pickedFields
    ? pickedFields.filter((f) => allColumns.includes(f))
    : allColumns;

  return { rows, columns: finalColumns };
}
