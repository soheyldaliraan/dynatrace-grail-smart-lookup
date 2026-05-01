import type { LookupTable } from "../data/lookupCatalog";

export type TriggerContext =
  | { kind: "lookup"; prefix: string; replaceFrom: number; replaceTo: number }
  | { kind: "fields"; prefix: string; replaceFrom: number; replaceTo: number }
  | { kind: null };

export type ParsedLookup = {
  tableId: string;
  sourceField: string;
  lookupField: string;
  prefix: string;
};

const IDENT = "[a-zA-Z_][a-zA-Z0-9_]*";

const LOOKUP_STEP_REGEX =
  /\|\s*lookup\s*\[load\s*"([^"]+)"\]\s*,\s*sourceField:\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*,\s*lookupField:\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*,\s*prefix:\s*"([^"]*)"/g;

export function getQueryLookups(
  value: string,
  cursor: number = value.length,
): ParsedLookup[] {
  const upToCursor = value.slice(0, cursor);
  const lookups: ParsedLookup[] = [];
  const re = new RegExp(LOOKUP_STEP_REGEX.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(upToCursor)) !== null) {
    lookups.push({
      tableId: m[1],
      sourceField: m[2],
      lookupField: m[3],
      prefix: m[4],
    });
  }
  return lookups;
}

export function getPickedFieldsList(
  value: string,
  cursor: number = value.length,
): string[] | null {
  const upToCursor = value.slice(0, cursor);
  const fieldsRegex = /\|\s*fields\s+([^|\n]+)/g;
  let m: RegExpExecArray | null;
  let last: string | null = null;
  while ((m = fieldsRegex.exec(upToCursor)) !== null) {
    last = m[1];
  }
  if (!last) return null;
  const picked = last
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => /^([a-zA-Z_][a-zA-Z0-9_]*)/.exec(s)?.[1])
    .filter((s): s is string => Boolean(s));
  return picked.length > 0 ? picked : null;
}

function getCurrentLine(value: string, cursor: number): {
  line: string;
  lineStart: number;
} {
  const before = value.slice(0, cursor);
  const lineStart = before.lastIndexOf("\n") + 1;
  const after = value.slice(cursor);
  const nlIndex = after.indexOf("\n");
  const lineEnd = nlIndex === -1 ? value.length : cursor + nlIndex;
  return { line: value.slice(lineStart, lineEnd), lineStart };
}

export function getTriggerContext(
  value: string,
  cursor: number,
): TriggerContext {
  const { line, lineStart } = getCurrentLine(value, cursor);
  const cursorInLine = cursor - lineStart;
  const before = line.slice(0, cursorInLine);

  const lookupMatch = /\|\s*lookup\s+([a-zA-Z0-9_"/-]*)$/.exec(before);
  if (lookupMatch) {
    const prefix = lookupMatch[1] ?? "";
    return {
      kind: "lookup",
      prefix,
      replaceFrom: lineStart + (before.length - prefix.length),
      replaceTo: cursor,
    };
  }

  const fieldsMatch = /\|\s*fields\s+(?:[a-zA-Z0-9_,\s]*,\s*)?([a-zA-Z0-9_]*)$/.exec(
    before,
  );
  if (fieldsMatch) {
    const prefix = fieldsMatch[1] ?? "";
    return {
      kind: "fields",
      prefix,
      replaceFrom: lineStart + (before.length - prefix.length),
      replaceTo: cursor,
    };
  }

  return { kind: null };
}

export function getInScopeFields(value: string, cursor: number): string[] {
  const upToCursor = value.slice(0, cursor);
  const fields = new Set<string>();

  const sourceMatch = /\bfetch\s+([a-zA-Z_][a-zA-Z0-9_.]*)/i.exec(upToCursor);
  if (sourceMatch) {
    const source = sourceMatch[1].toLowerCase();
    if (source.startsWith("logs")) {
      fields.add("timestamp");
    } else if (source.startsWith("events") || source.startsWith("bizevents")) {
      fields.add("timestamp");
    } else if (source.startsWith("spans")) {
      fields.add("timestamp");
    }
  }

  const fieldsAddRegex = new RegExp(
    `\\bfieldsAdd\\s+((?:${IDENT}\\s*=[^|\\n]+,?\\s*)+)`,
    "g",
  );
  let m: RegExpExecArray | null;
  while ((m = fieldsAddRegex.exec(upToCursor)) !== null) {
    const inner = m[1];
    const assignRegex = new RegExp(`(${IDENT})\\s*=`, "g");
    let a: RegExpExecArray | null;
    while ((a = assignRegex.exec(inner)) !== null) {
      fields.add(a[1]);
    }
  }

  const parseAsRegex = /\bparse\s+[^,]+,\s*"[^"]*"\s*(?:as\s+([a-zA-Z_][a-zA-Z0-9_]*))?/gi;
  let p: RegExpExecArray | null;
  while ((p = parseAsRegex.exec(upToCursor)) !== null) {
    if (p[1]) fields.add(p[1]);
    else fields.add("parsed");
  }

  const fieldsRegex = /\|\s*fields\s+([^|\n]+)/g;
  let f: RegExpExecArray | null;
  let lastFieldsList: string | null = null;
  while ((f = fieldsRegex.exec(upToCursor)) !== null) {
    lastFieldsList = f[1];
  }
  if (lastFieldsList) {
    lastFieldsList
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((f2) => {
        const idMatch = /^([a-zA-Z_][a-zA-Z0-9_]*)/.exec(f2);
        if (idMatch) fields.add(idMatch[1]);
      });
  }

  for (const l of getQueryLookups(value, cursor)) {
    fields.add(l.sourceField);
  }

  return [...fields];
}

export function getAvailableFieldsAfterLookups(
  value: string,
  cursor: number,
  catalog: LookupTable[],
): string[] {
  const base = new Set(getInScopeFields(value, cursor));
  for (const l of getQueryLookups(value, cursor)) {
    const table = catalog.find((t) => t.id === l.tableId);
    if (table) {
      table.fields.forEach((f) => base.add(`${l.prefix}${f}`));
    }
  }
  return [...base];
}

export type PotentialField = {
  fieldName: string;
  table: LookupTable;
  sourceField: string;
};

export function getPotentialFieldsViaLookups(
  value: string,
  cursor: number,
  catalog: LookupTable[],
): PotentialField[] {
  const inScope = new Set(getInScopeFields(value, cursor));
  const alreadyAdded = new Set(
    getQueryLookups(value, cursor).map((l) => l.tableId),
  );
  const result: PotentialField[] = [];
  for (const table of catalog) {
    if (alreadyAdded.has(table.id)) continue;
    if (!inScope.has(table.lookupField)) continue;
    for (const f of table.fields) {
      result.push({
        fieldName: `${table.prefix}${f}`,
        table,
        sourceField: table.lookupField,
      });
    }
  }
  return result;
}

export function getLineStart(value: string, cursor: number): number {
  return value.slice(0, cursor).lastIndexOf("\n") + 1;
}

export function buildLookupSnippet(
  table: LookupTable,
  sourceField: string,
): string {
  return [
    `[load "${table.id}"],`,
    `    sourceField: ${sourceField}, lookupField: ${table.lookupField}, prefix: "${table.prefix}"`,
  ].join("\n");
}

export function applyTextReplacement(
  value: string,
  from: number,
  to: number,
  insert: string,
): { value: string; cursor: number } {
  const next = value.slice(0, from) + insert + value.slice(to);
  return { value: next, cursor: from + insert.length };
}
