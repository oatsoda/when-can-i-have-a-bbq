import { ReactNode } from "react";

export function ResultRow({ children }: { children: ReactNode }) {
  return (
    <div className="rounded bg-orange-200 bg-opacity-80 px-3 py-2 gap-2">
      {children}
    </div>
  );
}
