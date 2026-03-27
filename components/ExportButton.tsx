"use client";

type ExportButtonProps = {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
};

export default function ExportButton({
  label,
  onClick,
  variant = "primary"
}: ExportButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold transition ${
        variant === "primary"
          ? "bg-brand-blue text-white hover:brightness-95"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
}
