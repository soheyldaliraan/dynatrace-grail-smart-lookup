import React, { useEffect, useMemo, useRef } from "react";

import Borders from "@dynatrace/strato-design-tokens/borders";
import BoxShadows from "@dynatrace/strato-design-tokens/box-shadows";
import Colors from "@dynatrace/strato-design-tokens/colors";
import Spacings from "@dynatrace/strato-design-tokens/spacings";

export type SuggestionItem = {
  id: string;
  primary: string;
  secondary?: string;
  badge?: string;
  group: string;
  selectable?: boolean;
  meta?: unknown;
};

type Props = {
  open: boolean;
  items: SuggestionItem[];
  position: { top: number; left: number } | null;
  helperText?: string;
  emptyText?: string;
  selectedIndex: number;
  onHoverIndex: (i: number) => void;
  onPick: (item: SuggestionItem) => void;
  onClose: () => void;
};

export const LookupSuggestionPopup: React.FC<Props> = ({
  open,
  items,
  position,
  helperText,
  emptyText,
  selectedIndex,
  onHoverIndex,
  onPick,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const el = itemRefs.current[selectedIndex];
    if (el) {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, open]);

  const grouped = useMemo(() => {
    const groups = new Map<string, SuggestionItem[]>();
    items.forEach((it) => {
      const arr = groups.get(it.group) ?? [];
      arr.push(it);
      groups.set(it.group, arr);
    });
    return [...groups.entries()];
  }, [items]);

  if (!open || !position) return null;

  return (
    <div
      ref={containerRef}
      onMouseDown={(e) => e.preventDefault()}
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        zIndex: 1000,
        minWidth: 360,
        maxWidth: 520,
        maxHeight: 480,
        background: Colors.Background.Surface.Default,
        border: `${Borders.Width.Default} ${Borders.Style.Default} ${Colors.Border.Neutral.Default}`,
        borderRadius: Borders.Radius.Container.Default,
        boxShadow: BoxShadows.Surface.Floating.Rest,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {helperText && (
        <div
          style={{
            padding: `${Spacings.Size8} ${Spacings.Size12}`,
            color: Colors.Text.Neutral.Subdued,
            fontSize: 12,
            borderBottom: `${Borders.Width.Default} ${Borders.Style.Default} ${Colors.Border.Neutral.Default}`,
            background: Colors.Background.Container.Neutral.Subdued,
          }}
        >
          {helperText}
        </div>
      )}

      <div
        style={{
          overflowY: "auto",
          flex: 1,
          padding: `${Spacings.Size4} 0`,
        }}
      >
        {items.length === 0 && (
          <div
            style={{
              padding: `${Spacings.Size12} ${Spacings.Size12}`,
              color: Colors.Text.Neutral.Subdued,
              fontSize: 13,
            }}
          >
            {emptyText ?? "No matches"}
          </div>
        )}

        {grouped.map(([groupName, groupItems]) => (
          <div key={groupName}>
            {grouped.length > 1 && (
              <div
                style={{
                  padding: `${Spacings.Size8} ${Spacings.Size12} ${Spacings.Size4}`,
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: Colors.Text.Neutral.Subdued,
                }}
              >
                {groupName}
              </div>
            )}
            {groupItems.map((item) => {
              const globalIndex = items.indexOf(item);
              const isSelected = globalIndex === selectedIndex;
              return (
                <div
                  key={item.id}
                  ref={(el) => {
                    itemRefs.current[globalIndex] = el;
                  }}
                  onMouseEnter={() => onHoverIndex(globalIndex)}
                  onClick={() => item.selectable !== false && onPick(item)}
                  style={{
                    padding: `${Spacings.Size6} ${Spacings.Size12}`,
                    cursor: item.selectable === false ? "default" : "pointer",
                    background: isSelected
                      ? Colors.Background.Container.Primary.Default
                      : "transparent",
                    color:
                      item.selectable === false
                        ? Colors.Text.Neutral.Subdued
                        : Colors.Text.Neutral.Default,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: Spacings.Size8,
                    }}
                  >
                    <span
                      style={{
                        fontFamily:
                          "ui-monospace, SFMono-Regular, Menlo, monospace",
                        fontSize: 13,
                      }}
                    >
                      {item.primary}
                    </span>
                    {item.badge && (
                      <span
                        style={{
                          fontSize: 11,
                          padding: `2px ${Spacings.Size6}`,
                          borderRadius: Borders.Radius.Field.Emphasized,
                          background:
                            Colors.Background.Container.Primary.Emphasized,
                          color: Colors.Text.Primary.Default,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {item.secondary && (
                    <span
                      style={{
                        fontSize: 12,
                        color: Colors.Text.Neutral.Subdued,
                      }}
                    >
                      {item.secondary}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div
        style={{
          padding: `${Spacings.Size6} ${Spacings.Size12}`,
          borderTop: `${Borders.Width.Default} ${Borders.Style.Default} ${Colors.Border.Neutral.Default}`,
          background: Colors.Background.Container.Neutral.Subdued,
          color: Colors.Text.Neutral.Subdued,
          fontSize: 11,
          display: "flex",
          gap: Spacings.Size12,
        }}
      >
        <span>↑↓ navigate</span>
        <span>↵ select</span>
        <span>esc dismiss</span>
      </div>
    </div>
  );
};
