"use client";

interface DayEntry {
  date: string; // "YYYY-MM-DD"
  xp:   number;
}

interface Props {
  data: DayEntry[];
}

const WIDTH  = 600;
const HEIGHT = 160;
const PAD_L  = 40;
const PAD_R  = 12;
const PAD_T  = 16;
const PAD_B  = 28;

const CHART_W = WIDTH  - PAD_L - PAD_R;
const CHART_H = HEIGHT - PAD_T - PAD_B;

export default function XPChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-[#c9952a]/20 bg-[#faf6ef] p-6 text-center text-sm text-[#6b5c44]/60">
        Complete quests to see your XP chart.
      </div>
    );
  }

  const maxXp = Math.max(...data.map((d) => d.xp), 1);

  // Build cumulative running XP points
  const points: { x: number; y: number; xp: number; date: string }[] = data.map((d, i) => {
    const x = PAD_L + (i / Math.max(data.length - 1, 1)) * CHART_W;
    const y = PAD_T + (1 - d.xp / maxXp) * CHART_H;
    return { x, y, xp: d.xp, date: d.date };
  });

  // SVG polyline path
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

  // Fill area path
  const areaPath =
    linePath +
    ` L ${points[points.length - 1].x.toFixed(1)} ${(PAD_T + CHART_H).toFixed(1)}` +
    ` L ${PAD_L.toFixed(1)} ${(PAD_T + CHART_H).toFixed(1)} Z`;

  // Y-axis labels (0, half, max)
  const yLabels = [
    { y: PAD_T + CHART_H, label: "0" },
    { y: PAD_T + CHART_H / 2, label: formatXp(maxXp / 2) },
    { y: PAD_T,               label: formatXp(maxXp) },
  ];

  // X-axis: first and last date
  const xLabels =
    data.length > 1
      ? [
          { x: PAD_L,              label: shortDate(data[0].date) },
          { x: PAD_L + CHART_W,    label: shortDate(data[data.length - 1].date) },
        ]
      : [{ x: PAD_L, label: shortDate(data[0].date) }];

  return (
    <div className="rounded-2xl border border-[#c9952a]/20 bg-[#faf6ef] p-6 space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#6b5c44]/60">
        30-Day XP Earned
      </p>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        aria-label="XP earned over the last 30 days"
        role="img"
      >
        <defs>
          <linearGradient id="xp-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#c9952a" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#c9952a" stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yLabels.map(({ y }) => (
          <line
            key={y}
            x1={PAD_L} y1={y} x2={PAD_L + CHART_W} y2={y}
            stroke="#c9952a" strokeOpacity="0.12" strokeWidth="1"
          />
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#xp-fill)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#c9952a" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* Data points */}
        {points.map((p) => (
          <circle key={p.date} cx={p.x} cy={p.y} r="3" fill="#c9952a" />
        ))}

        {/* Y-axis labels */}
        {yLabels.map(({ y, label }) => (
          <text
            key={y}
            x={PAD_L - 6} y={y}
            textAnchor="end" dominantBaseline="middle"
            fontSize="9" fill="#6b5c44" opacity="0.6"
            fontFamily="sans-serif"
          >
            {label}
          </text>
        ))}

        {/* X-axis labels */}
        {xLabels.map(({ x, label }, i) => (
          <text
            key={i}
            x={x} y={PAD_T + CHART_H + 16}
            textAnchor={i === 0 ? "start" : "end"}
            fontSize="9" fill="#6b5c44" opacity="0.6"
            fontFamily="sans-serif"
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}

function formatXp(xp: number): string {
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k`;
  return Math.round(xp).toString();
}

function shortDate(iso: string): string {
  const [, month, day] = iso.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(month) - 1]} ${parseInt(day)}`;
}
