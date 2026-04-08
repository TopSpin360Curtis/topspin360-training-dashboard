"use client";

type ExportButtonProps = {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
};

export default function ExportButton({
  label,
  onClick,
  variant = "primary",
  disabled = false
}: ExportButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold transition ${
        variant === "primary"
          ? "bg-brand-blue text-white hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
      }`}
    >
      {label}
    </button>
  );
}
