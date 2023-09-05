import { ChangeEvent } from "react";

export function Toggle({
  text,
  value,
  checked,
  onChange,
}: {
  text: string;
  value?: string | number | readonly string[] | undefined; // TODO: Use ReturnType somehow?
  checked: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="relative inline-flex items-center cursor-pointer mt-1">
      <input
        type="checkbox"
        value={value}
        className="sr-only peer"
        checked={checked}
        onChange={onChange}
      />
      <div className="w-11 h-6 bg-orange-100 rounded-full peer peer-focus:ring-4 peer-focus:ring-orange-400 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-orange-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
      <span className="ml-2 text-sm">{text}</span>
    </label>
  );
}
