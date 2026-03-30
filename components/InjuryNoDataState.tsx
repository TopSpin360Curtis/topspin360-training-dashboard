"use client";

type InjuryNoDataStateProps = {
  title: string;
  body: string;
};

export default function InjuryNoDataState({
  title,
  body
}: InjuryNoDataStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-5">
      <p className="text-sm font-semibold text-brand-ink">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{body}</p>
    </div>
  );
}
