import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  DQLEditor,
  type DQLEditorRef,
} from "@dynatrace/strato-components-preview/editors";

import { LOOKUPS, type LookupTable, findMatchingLookups } from "../data/lookupCatalog";
import {
  buildLookupSnippet,
  getAvailableFieldsAfterLookups,
  getInScopeFields,
  getLineStart,
  getPotentialFieldsViaLookups,
  getTriggerContext,
  type TriggerContext,
} from "../utils/dqlContext";
import { LookupSuggestionPopup, type SuggestionItem } from "./LookupSuggestionPopup";

type EditorViewLike = {
  state: {
    doc: { length: number; toString(): string };
    selection: { main: { head: number; from: number; to: number } };
  };
  dispatch: (tx: unknown) => void;
  coordsAtPos: (
    pos: number,
  ) => { left: number; right: number; top: number; bottom: number } | null;
  focus: () => void;
  contentDOM: HTMLElement;
  dom: HTMLElement;
};

type EditorRefWithView = DQLEditorRef & {
  editorView?: () => EditorViewLike | null | undefined;
};

type Props = {
  value: string;
  onChange: (next: string) => void;
};

export const SmartDqlEditor: React.FC<Props> = ({ value, onChange }) => {
  const editorRef = useRef<EditorRefWithView>(null);

  const [trigger, setTrigger] = useState<TriggerContext>({ kind: null });
  const [popupPos, setPopupPos] = useState<{ top: number; left: number } | null>(
    null,
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const triggerRef = useRef<TriggerContext>(trigger);
  const justPickedRef = useRef<{ value: string; cursor: number } | null>(null);

  useEffect(() => {
    triggerRef.current = trigger;
  }, [trigger]);

  const inScopeFields = useMemo(() => {
    const view = editorRef.current?.editorView?.();
    const cursor = view?.state.selection.main.head ?? value.length;
    return getInScopeFields(value, cursor);
  }, [value]);

  const items = useMemo<SuggestionItem[]>(() => {
    if (trigger.kind === "lookup") {
      const matching = findMatchingLookups(inScopeFields).filter((t) =>
        t.name.toLowerCase().includes(trigger.prefix.toLowerCase()),
      );
      const fieldSet = new Set(inScopeFields);
      return matching.map((t) => {
        const matches = fieldSet.has(t.lookupField);
        return {
          id: t.id,
          primary: t.name,
          secondary: t.description,
          badge: matches
            ? `matches on ${t.lookupField}`
            : `key: ${t.lookupField}`,
          group: t.source === "user" ? "Your lookups" : "System lookups",
          selectable: true,
          meta: t,
        };
      });
    }

    if (trigger.kind === "fields") {
      const view = editorRef.current?.editorView?.();
      const cursor = view?.state.selection.main.head ?? value.length;
      const all = getAvailableFieldsAfterLookups(value, cursor, LOOKUPS);
      const baseSet = new Set(getInScopeFields(value, cursor));
      const upToCursor = value.slice(0, cursor);
      const inFieldsList = /\|\s*fields\s+([^|\n]*)$/.exec(upToCursor);
      const alreadyPicked = new Set<string>();
      if (inFieldsList) {
        inFieldsList[1]
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((s) => {
            const idMatch = /^([a-zA-Z_][a-zA-Z0-9_]*)/.exec(s);
            if (idMatch) alreadyPicked.add(idMatch[1]);
          });
      }
      const prefixLc = trigger.prefix.toLowerCase();

      const filtered = all
        .filter((f) => f.toLowerCase().includes(prefixLc))
        .filter((f) => !alreadyPicked.has(f) || f === trigger.prefix);

      const fieldItems: SuggestionItem[] = filtered.map((f) => {
        const fromLookup = !baseSet.has(f);
        return {
          id: f,
          primary: f,
          secondary: fromLookup ? "Added by lookup" : "Original field",
          badge: fromLookup ? "lookup" : undefined,
          group: fromLookup ? "From lookups" : "Original fields",
          selectable: true,
        };
      });

      const potential = getPotentialFieldsViaLookups(value, cursor, LOOKUPS)
        .filter((p) => p.fieldName.toLowerCase().includes(prefixLc))
        .filter((p) => !alreadyPicked.has(p.fieldName));

      const potentialItems: SuggestionItem[] = potential.map((p) => ({
        id: `potential:${p.fieldName}`,
        primary: p.fieldName,
        secondary: `From ${p.table.name} (joins on ${p.sourceField})`,
        badge: `+ ${p.table.name}`,
        group: "Add lookup to use these",
        selectable: true,
        meta: { potential: true, table: p.table, sourceField: p.sourceField },
      }));

      return [...fieldItems, ...potentialItems];
    }

    return [];
  }, [trigger, value, inScopeFields]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [trigger.kind, trigger.kind === "lookup" || trigger.kind === "fields" ? trigger.prefix : ""]);

  const updateCaretAndTrigger = useCallback(
    (currentValue: string) => {
      const view = editorRef.current?.editorView?.();
      if (!view) {
        setTrigger({ kind: null });
        setPopupPos(null);
        return;
      }
      const head = view.state.selection.main.head;
      if (
        justPickedRef.current &&
        justPickedRef.current.value === currentValue &&
        justPickedRef.current.cursor === head
      ) {
        return;
      }
      justPickedRef.current = null;
      const ctx = getTriggerContext(currentValue, head);
      setTrigger(ctx);

      if (ctx.kind === null) {
        setPopupPos(null);
        return;
      }

      const coords = view.coordsAtPos(head);
      if (coords) {
        setPopupPos({ top: coords.bottom + 4, left: coords.left });
      } else {
        const cursorEl = editorRef.current?.element?.querySelector(
          ".cm-cursor",
        ) as HTMLElement | null;
        if (cursorEl) {
          const rect = cursorEl.getBoundingClientRect();
          setPopupPos({ top: rect.bottom + 4, left: rect.left });
        } else {
          setPopupPos(null);
        }
      }
    },
    [],
  );

  const handleEditorChange = useCallback(
    (next: string) => {
      onChange(next);
      requestAnimationFrame(() => updateCaretAndTrigger(next));
    },
    [onChange, updateCaretAndTrigger],
  );

  useEffect(() => {
    const el = editorRef.current?.element;
    if (!el) return;
    let raf = 0;
    let lastHead = -1;
    let lastValue = "";
    const tick = () => {
      const view = editorRef.current?.editorView?.();
      if (view) {
        const head = view.state.selection.main.head;
        const docStr = view.state.doc.toString();
        if (head !== lastHead || docStr !== lastValue) {
          lastHead = head;
          lastValue = docStr;
          updateCaretAndTrigger(docStr);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [updateCaretAndTrigger]);

  const close = useCallback(() => {
    setTrigger({ kind: null });
    setPopupPos(null);
  }, []);

  const pick = useCallback(
    (item: SuggestionItem) => {
      const ctx = triggerRef.current;
      const view = editorRef.current?.editorView?.();
      if (ctx.kind === null || !view) return;

      const potentialMeta = item.meta as
        | { potential: true; table: LookupTable; sourceField: string }
        | undefined;
      const isPotential =
        ctx.kind === "fields" && potentialMeta?.potential === true;

      if (isPotential && potentialMeta) {
        const docStr = view.state.doc.toString();
        const fieldsLineStart = getLineStart(docStr, ctx.replaceFrom);
        const lookupBody = buildLookupSnippet(
          potentialMeta.table,
          potentialMeta.sourceField,
        );
        const lookupStep = `| lookup ${lookupBody}\n`;
        const fieldInsert = `${item.primary}, `;

        view.dispatch({
          changes: [
            { from: fieldsLineStart, to: fieldsLineStart, insert: lookupStep },
            {
              from: ctx.replaceFrom,
              to: ctx.replaceTo,
              insert: fieldInsert,
            },
          ],
          selection: {
            anchor: ctx.replaceFrom + lookupStep.length + fieldInsert.length,
          },
          scrollIntoView: true,
        } as unknown);
        view.focus();
        justPickedRef.current = null;
        return;
      }

      let insert = "";
      if (ctx.kind === "lookup") {
        const table = item.meta as LookupTable;
        const fieldSet = new Set(inScopeFields);
        const sourceField = fieldSet.has(table.lookupField)
          ? table.lookupField
          : table.lookupField;
        insert = buildLookupSnippet(table, sourceField);
      } else if (ctx.kind === "fields") {
        insert = `${item.primary}, `;
      }

      const newCursor = ctx.replaceFrom + insert.length;
      const newDoc =
        view.state.doc.toString().slice(0, ctx.replaceFrom) +
        insert +
        view.state.doc.toString().slice(ctx.replaceTo);

      view.dispatch({
        changes: { from: ctx.replaceFrom, to: ctx.replaceTo, insert },
        selection: { anchor: newCursor },
        scrollIntoView: true,
      } as unknown);
      view.focus();
      if (ctx.kind === "fields") {
        justPickedRef.current = null;
      } else {
        justPickedRef.current = { value: newDoc, cursor: newCursor };
        close();
      }
    },
    [close, inScopeFields],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const ctx = triggerRef.current;
      if (ctx.kind === null) return;
      const editorEl = editorRef.current?.element;
      if (!editorEl || !editorEl.contains(e.target as Node)) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((i) => Math.min(i + 1, Math.max(items.length - 1, 0)));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        if (items.length > 0 && items[selectedIndex]) {
          e.preventDefault();
          e.stopPropagation();
          pick(items[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        close();
      } else if (e.key === "Tab") {
        if (items.length > 0 && items[selectedIndex]) {
          e.preventDefault();
          e.stopPropagation();
          pick(items[selectedIndex]);
        }
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [items, selectedIndex, pick, close]);

  const helperText =
    trigger.kind === "lookup"
      ? "Choose a lookup table — Grail matches by your in-scope fields"
      : trigger.kind === "fields"
      ? "Pick a field — picking one in 'Add lookup' will insert the lookup step too"
      : undefined;

  return (
    <div style={{ position: "relative" }}>
      <DQLEditor
        ref={editorRef as React.Ref<DQLEditorRef>}
        value={value}
        onChange={handleEditorChange}
      />
      <LookupSuggestionPopup
        open={trigger.kind !== null}
        items={items}
        position={popupPos}
        helperText={helperText}
        emptyText={
          trigger.kind === "lookup"
            ? "No lookup tables match"
            : "No matching fields"
        }
        selectedIndex={selectedIndex}
        onHoverIndex={setSelectedIndex}
        onPick={pick}
        onClose={close}
      />
    </div>
  );
};
