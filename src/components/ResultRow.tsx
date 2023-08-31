import { ReactNode } from "react";

export function ResultRow({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-flow-col grid-cols-2 rounded bg-orange-200 bg-opacity-80 px-3 py-2 gap-2">
      {children}
    </div>
  );
}
