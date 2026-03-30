"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import InjuryNoDataState from "@/components/InjuryNoDataState";
import { formatDate, formatNumber } from "@/lib/dataUtils";
import type { InjuryDetailData } from "@/lib/types";

type InjuryTrendCardProps = {
  detail: InjuryDetailData;
};

export default function InjuryTrendCard({ detail }: InjuryTrendCardProps) {
  return (
    <article className="rounded-3xl border border-white/60 bg-white/95 p-5 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue/70">
        Pre-injury trend
      </p>
      <h3 className="mt-2 text-xl font-semibold text-brand-ink">
        CW vs CCW leading into injury
      </h3>

      {detail.trendSeries.length ? (
        <div className="mt-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={detail.trendSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d9e2ef" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => formatDate(String(value))}
                stroke="#6b7280"
              />
              <YAxis stroke="#6b7280" />
              <Tooltip
                formatter={(value: number) => formatNumber(value)}
                labelFormatter={(value) => formatDate(String(value))}
              />
              <Legend />
              <ReferenceLine
                x={detail.injury.date}
                stroke="#b91c1c"
                strokeDasharray="6 4"
                label="Injury"
              />
              <Line
                type="monotone"
                dataKey="maxRfdCCW"
                stroke="#1a6fc4"
                strokeWidth={3}
                name="CCW"
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="maxRfdCW"
                stroke="#e88c3a"
                strokeWidth={3}
                name="CW"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-4">
          <InjuryNoDataState
            title="No trend data available"
            body="There are no saved sessions for this player, so no pre-injury trend can be plotted."
          />
        </div>
      )}
    </article>
  );
}
