import React, { useMemo, useState } from "react";
import { getVirtualWindow, rafThrottle } from "@/lib/performance";

type VirtualListProps<T> = {
  items: T[];
  rowHeight: number;
  height: number;
  overscan?: number;
  className?: string;
  renderItem: (item: T, index: number) => React.ReactNode;
};

export default function VirtualList<T>({ items, rowHeight, height, overscan = 8, className = "", renderItem }: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const onScroll = useMemo(() => rafThrottle((event: React.UIEvent<HTMLDivElement>) => setScrollTop(event.currentTarget.scrollTop)), []);
  const windowState = getVirtualWindow(items.length, rowHeight, height, scrollTop, overscan);
  const visibleItems = items.slice(windowState.start, windowState.end);

  return (
    <div className={className} style={{ height, overflow: "auto", position: "relative" }} onScroll={onScroll}>
      <div style={{ height: windowState.totalHeight, position: "relative" }}>
        <div style={{ transform: `translateY(${windowState.offsetTop}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={windowState.start + index} style={{ minHeight: rowHeight }}>
              {renderItem(item, windowState.start + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
