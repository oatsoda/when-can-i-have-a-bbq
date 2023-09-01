import { ReactNode, useMemo } from "react";

export function ResultRow({
  children,
  cols = 0,
}: {
  children: ReactNode;
  cols?: number;
}) {
  const css = useMemo(() => {
    let css =
      "grid grid-flow-col rounded bg-orange-200 bg-opacity-80 px-3 py-2 gap-2";
    if (cols > 0) {
      css += ` grid-cols-${cols}`;
    }
    return css;
  }, [cols]);

  return <div className={css}>{children}</div>;
}
