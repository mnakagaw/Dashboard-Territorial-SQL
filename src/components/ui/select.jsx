import * as React from "react";

export function Select({
  value,
  onChange,
  options = [],
  placeholder,
  disabled,
  ariaLabel,
  className = "",
}) {
  return (
    <select
      className={
        "one-select w-full rounded-lg border border-white/30 bg-white px-3 py-2 text-sm text-[#30242a] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#b6125a] disabled:cursor-not-allowed disabled:opacity-55 " +
        className
      }
      value={value ?? ""}
      onChange={(e) => onChange && onChange(e.target.value || null)}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      <option value="">{placeholder ?? "Seleccione..."}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.value ?? opt.label}
          {opt.label && opt.value !== opt.label ? ` - ${opt.label}` : ""}
        </option>
      ))}
    </select>
  );
}
