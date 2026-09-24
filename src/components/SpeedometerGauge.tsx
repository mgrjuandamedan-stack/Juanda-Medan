import React, { useState } from 'react';
import { Target, AlertTriangle, CheckCircle2, Zap, Flame, Sparkles, TrendingUp, PlusCircle } from 'lucide-react';
import { formatRupiah, formatPercent } from '../utils/formatters';
import { StoreSummary } from '../types';

interface SpeedometerGaugeProps {
  summary: StoreSummary;
  onSimulateSale?: (amount: number) => void;
}

export const SpeedometerGauge: React.FC<SpeedometerGaugeProps> = ({
  summary,
  onSimulateSale,
}) => {
  const [viewMode, setViewMode] = useState<'mtd' | 'daily'>('mtd');

  const currentPercent = viewMode === 'mtd' ? summary.mtdPercent : summary.dailyPercent;
  const currentTarget = viewMode === 'mtd' ? summary.totalTargetMTD : summary.dailyTarget;
  const currentActual = viewMode === 'mtd' ? summary.totalActualMTD : summary.dailyActual;
  const currentKekurangan = viewMode === 'mtd' ? summary.kekuranganMTD : summary.dailyKekurangan;
  const isAchieved = currentPercent >= 100;

  // Scale calibration: 0% to 140%
  // 0% at left (180°), 70% at top (90°), 100% at (51.43°), 140% at right (0°)
  const MAX_SCALE = 140;
  const clampedPercent = Math.min(Math.max(currentPercent, 0), MAX_SCALE);

  // Exact mathematical alignment (Single Source of Truth)
  // needleAngle: -90° (left at 0%) to +90° (right at 140%)
  const needleAngle = -90 + (clampedPercent / MAX_SCALE) * 180;

  // SVG Geometry constants
  const cx = 160;
  const cy = 140;
  const radius = 100;
  const strokeWidth = 14;

  // Helper to convert any percentage to polar angle in degrees (180° = 0%, 0° = 140%)
  const pctToPolarAngle = (pct: number) => {
    const clamped = Math.min(Math.max(pct, 0), MAX_SCALE);
    return 180 - (clamped / MAX_SCALE) * 180;
  };

  // Helper to convert polar angle & radius to SVG Cartesian coordinates (cx, cy)
  const getCoords = (polarAngleDeg: number, r: number) => {
    const rad = (polarAngleDeg * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy - r * Math.sin(rad),
    };
  };

  // Active progress arc path from 0% up to current clamped percent
  const startCoords = getCoords(180, radius);
  const currentPolarAngle = pctToPolarAngle(clampedPercent);
  const currentCoords = getCoords(currentPolarAngle, radius);
  const isSweepLarge = clampedPercent > 70 ? 0 : 0; // Sweep angle <= 180, largeArcFlag is always 0
  const activeArcPath =
    clampedPercent > 0.5
      ? `M ${startCoords.x.toFixed(2)} ${startCoords.y.toFixed(2)} A ${radius} ${radius} 0 ${isSweepLarge} 1 ${currentCoords.x.toFixed(2)} ${currentCoords.y.toFixed(2)}`
      : '';

  // Calibration Tick Marks
  // Major ticks: 0%, 20%, 40%, 60%, 80%, 100%, 120%, 140%
  const majorTicks = [0, 20, 40, 60, 80, 100, 120, 140];
  // Minor ticks: 10%, 30%, 50%, 70%, 90%, 110%, 130%
  const minorTicks = [10, 30, 50, 70, 90, 110, 130];

  // 100% Target Milestone exact coordinates
  const target100Polar = pctToPolarAngle(100);
  const target100CoordsInner = getCoords(target100Polar, radius - 16);
  const target100CoordsOuter = getCoords(target100Polar, radius + 16);
  const target100CoordsBadge = getCoords(target100Polar, radius + 28);

  // Status badge config
  let statusBadge = {
    bg: 'bg-rose-500/15 border-rose-500/40 text-rose-300',
    title: 'Defisit Target',
    sub: 'Perlu Akselerasi',
    icon: AlertTriangle,
    accent: '#f43f5e',
    glowColor: 'rgba(244,63,94,0.4)',
  };
  if (currentPercent >= 110) {
    statusBadge = {
      bg: 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300',
      title: 'SUPERIOR (110%+)',
      sub: 'Performa Luar Biasa!',
      icon: Flame,
      accent: '#10b981',
      glowColor: 'rgba(16,185,129,0.5)',
    };
  } else if (currentPercent >= 100) {
    statusBadge = {
      bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
      title: 'ACHIEVED (100%+)',
      sub: 'Target Tercapai!',
      icon: CheckCircle2,
      accent: '#34d399',
      glowColor: 'rgba(52,211,153,0.45)',
    };
  } else if (currentPercent >= 85) {
    statusBadge = {
      bg: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
      title: 'ON-TRACK (85%+)',
      sub: 'Mendekati Sasaran',
      icon: Zap,
      accent: '#f59e0b',
      glowColor: 'rgba(245,158,11,0.4)',
    };
  }

  const StatusIcon = statusBadge.icon;

  return (
    <div
      id="speedometer-section"
      className="relative overflow-hidden rounded-2xl futuristic-card p-4 sm:p-5 shadow-2xl flex flex-col h-full justify-between group border border-cyan-500/30"
    >
      {/* Background ambient multi-color glow */}
      <div
        className="pointer-events-none absolute -top-14 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-3xl opacity-25 transition-all duration-700"
        style={{ backgroundColor: statusBadge.accent }}
      />
      <div className="pointer-events-none absolute inset-0 bg-radial from-cyan-500/5 via-transparent to-transparent opacity-40" />

      {/* Header & Toggle */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-cyan-300/80 uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#FFD700]" />
              Store Performance
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border shadow-sm ${statusBadge.bg}`}>
              <StatusIcon className="w-3 h-3 shrink-0" />
              <span>{statusBadge.title}</span>
            </span>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-950/80 p-0.5 rounded-lg border border-cyan-500/30 text-[10px] shadow-inner">
            <button
              type="button"
              id="toggle-view-mtd"
              onClick={() => setViewMode('mtd')}
              className={`px-2.5 py-0.5 rounded-md transition-all ${
                viewMode === 'mtd'
                  ? 'bg-gradient-to-r from-[#FFD700] to-[#FFAA00] text-slate-950 font-extrabold shadow-[0_0_12px_rgba(255,215,0,0.5)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              MTD
            </button>
            <button
              type="button"
              id="toggle-view-daily"
              onClick={() => setViewMode('daily')}
              className={`px-2.5 py-0.5 rounded-md transition-all ${
                viewMode === 'daily'
                  ? 'bg-gradient-to-r from-[#FFD700] to-[#FFAA00] text-slate-950 font-extrabold shadow-[0_0_12px_rgba(255,215,0,0.5)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Harian
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-2 drop-shadow-sm">
            <Target className="w-4 h-4 text-[#FFD700]" />
            Pencapaian {viewMode === 'mtd' ? 'MTD Store' : 'Target Harian'}
          </h2>

          {/* Quick test simulation button (discreet) */}
          {onSimulateSale && (
            <button
              type="button"
              onClick={() => onSimulateSale(5000000)}
              title="Simulasi Penjualan POS (+Rp 5.000.000)"
              className="text-[10px] font-mono text-cyan-300 hover:text-cyan-100 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/30 hover:border-cyan-400 px-2 py-0.5 rounded-md transition-all flex items-center gap-1 shadow-sm"
            >
              <PlusCircle className="w-3 h-3 text-[#FFD700]" />
              <span>+5Jt Test</span>
            </button>
          )}
        </div>
      </div>

      {/* Speedometer Gauge Visual */}
      <div className="my-1 sm:my-2 flex flex-col items-center justify-center relative select-none">
        <div className="relative w-full max-w-[320px] aspect-[2/1.3] flex items-center justify-center">
          <svg
            viewBox="0 0 320 185"
            className="w-full h-full drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)] overflow-visible"
          >
            <defs>
              {/* Vibrant Continuous Arc Gradient */}
              <linearGradient id="accurateGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f43f5e" />      {/* 0% Defisit */}
                <stop offset="35%" stopColor="#fb923c" />     {/* ~50% */}
                <stop offset="55%" stopColor="#facc15" />     {/* ~75% */}
                <stop offset="71.4%" stopColor="#10b981" />   {/* 100% Target Milestone */}
                <stop offset="85.7%" stopColor="#059669" />   {/* 120% */}
                <stop offset="100%" stopColor="#06b6d4" />    {/* 140% Overachieve */}
              </linearGradient>

              {/* Glowing Beam Filter */}
              <filter id="neonBeamGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              {/* High-Precision Needle Shadow */}
              <filter id="needleShadowPrecision" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#000000" floodOpacity="0.85" />
              </filter>

              {/* Metallic Pivot Gradient */}
              <radialGradient id="pivotGradient" cx="40%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#e2e8f0" />
                <stop offset="50%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#0f172a" />
              </radialGradient>

              {/* Needle Body Gradient */}
              <linearGradient id="needleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#e2e8f0" />
                <stop offset="50%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#94a3b8" />
              </linearGradient>
            </defs>

            {/* Outer Subtle Dial Bezel Ring */}
            <path
              d="M 36 140 A 124 124 0 0 1 284 140"
              fill="none"
              stroke="#1e293b"
              strokeWidth="1.5"
              strokeDasharray="4 6"
              opacity="0.6"
            />

            {/* Inactive Track Background (Dark Slate) */}
            <path
              d="M 60 140 A 100 100 0 0 1 260 140"
              fill="none"
              stroke="#0f172a"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            {/* Subtle Track Inner Border */}
            <path
              d="M 60 140 A 100 100 0 0 1 260 140"
              fill="none"
              stroke="#334155"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              opacity="0.3"
            />

            {/* Active Colored Progress Arc */}
            {activeArcPath && (
              <>
                {/* Neon Glow underlayer */}
                <path
                  d={activeArcPath}
                  fill="none"
                  stroke="url(#accurateGaugeGradient)"
                  strokeWidth={strokeWidth + 4}
                  strokeLinecap="round"
                  opacity="0.45"
                  filter="url(#neonBeamGlow)"
                />
                {/* Sharp crisp foreground beam */}
                <path
                  d={activeArcPath}
                  fill="none"
                  stroke="url(#accurateGaugeGradient)"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  opacity="0.95"
                />
              </>
            )}

            {/* Minor Ticks (Every 10%: 10, 30, 50, 70, 90, 110, 130) */}
            {minorTicks.map((p) => {
              const polar = pctToPolarAngle(p);
              const p1 = getCoords(polar, radius - 8);
              const p2 = getCoords(polar, radius + 8);
              return (
                <line
                  key={`minor-${p}`}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke="#475569"
                  strokeWidth="1.2"
                  strokeOpacity="0.75"
                />
              );
            })}

            {/* Major Ticks (Every 20%: 0, 20, 40, 60, 80, 100, 120, 140) */}
            {majorTicks.map((p) => {
              const polar = pctToPolarAngle(p);
              const isTargetTick = p === 100;
              const tickInnerR = isTargetTick ? radius - 15 : radius - 11;
              const tickOuterR = isTargetTick ? radius + 13 : radius + 10;
              const labelR = radius + 24;

              const p1 = getCoords(polar, tickInnerR);
              const p2 = getCoords(polar, tickOuterR);
              const lp = getCoords(polar, labelR);

              return (
                <g key={`major-${p}`}>
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={
                      isTargetTick
                        ? '#10b981'
                        : p >= 100
                        ? '#34d399'
                        : p <= 40
                        ? '#f43f5e'
                        : '#cbd5e1'
                    }
                    strokeWidth={isTargetTick ? '3' : '1.8'}
                    strokeOpacity={isTargetTick ? '1' : '0.85'}
                  />
                  {/* Tick Numerical Label */}
                  <text
                    x={lp.x}
                    y={lp.y}
                    fill={isTargetTick ? '#FFD700' : p > 100 ? '#38bdf8' : '#cbd5e1'}
                    fontSize={isTargetTick ? '10' : '8.5'}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontFamily="monospace"
                    fontWeight={isTargetTick ? '900' : '700'}
                    className="drop-shadow-sm"
                  >
                    {p}%
                  </text>
                </g>
              );
            })}

            {/* 100% Target Milestone Flag Badge */}
            <g>
              {/* Connecting Accent Line at 100% */}
              <line
                x1={target100CoordsInner.x}
                y1={target100CoordsInner.y}
                x2={target100CoordsOuter.x}
                y2={target100CoordsOuter.y}
                stroke="#10b981"
                strokeWidth="2.5"
              />
              {/* Target Dot on Track */}
              <circle
                cx={getCoords(target100Polar, radius).x}
                cy={getCoords(target100Polar, radius).y}
                r="3.5"
                fill="#FFD700"
                stroke="#0f172a"
                strokeWidth="1.5"
              />
              {/* Outer TARGET Milestone Badge */}
              <g
                transform={`translate(${target100CoordsBadge.x + 10}, ${target100CoordsBadge.y - 12})`}
                className="select-none"
              >
                <rect
                  x="-2"
                  y="-1"
                  width="44"
                  height="14"
                  rx="4"
                  fill="#064e3b"
                  stroke="#10b981"
                  strokeWidth="1"
                  className={isAchieved ? 'animate-pulse' : ''}
                />
                <text
                  x="20"
                  y="9"
                  fill="#6ee7b7"
                  fontSize="7.5"
                  fontWeight="900"
                  fontFamily="monospace"
                  textAnchor="middle"
                  letterSpacing="0.5"
                >
                  TARGET
                </text>
              </g>
            </g>

            {/* Glowing Active Bead At Needle Position along Arc */}
            {clampedPercent > 0 && (
              <g>
                <circle
                  cx={currentCoords.x}
                  cy={currentCoords.y}
                  r="5"
                  fill={isAchieved ? '#10b981' : '#FFD700'}
                  className="animate-pulse"
                />
                <circle
                  cx={currentCoords.x}
                  cy={currentCoords.y}
                  r="9"
                  fill="none"
                  stroke={isAchieved ? '#10b981' : '#FFD700'}
                  strokeWidth="1.5"
                  opacity="0.6"
                />
              </g>
            )}

            {/* Precision Aerodynamic Instrument Needle */}
            <g
              transform={`rotate(${needleAngle}, ${cx}, ${cy})`}
              className="transition-transform duration-1000 ease-out"
              filter="url(#needleShadowPrecision)"
            >
              {/* Counter-Weight Tail (Bottom) */}
              <polygon
                points={`${cx - 4.5},${cy + 18} ${cx + 4.5},${cy + 18} ${cx + 5},${cy} ${cx - 5},${cy}`}
                fill="#1e293b"
                stroke="#475569"
                strokeWidth="0.8"
              />
              <circle cx={cx} cy={cy + 12} r="2.5" fill="#f59e0b" opacity="0.9" />

              {/* Needle Body (Tapered) */}
              <polygon
                points={`${cx - 4.5},${cy} ${cx + 4.5},${cy} ${cx + 1.2},${cy - radius + 10} ${cx - 1.2},${cy - radius + 10}`}
                fill="url(#needleGradient)"
              />

              {/* Luminous Core Line */}
              <line
                x1={cx}
                y1={cy - 6}
                x2={cx}
                y2={cy - radius + 8}
                stroke={isAchieved ? '#10b981' : '#f59e0b'}
                strokeWidth="1.2"
                strokeLinecap="round"
              />

              {/* Razor-Sharp Glowing Tip */}
              <polygon
                points={`${cx - 2},${cy - radius + 10} ${cx + 2},${cy - radius + 10} ${cx},${cy - radius + 1}`}
                fill={isAchieved ? '#10b981' : '#FFD700'}
              />
            </g>

            {/* Metallic CNC Center Pivot Bezel */}
            {/* Outer Bezel Ring */}
            <circle cx={cx} cy={cy} r="12" fill="#0b1329" stroke="#334155" strokeWidth="2" />
            {/* Inner Metallic Disc */}
            <circle cx={cx} cy={cy} r="8.5" fill="url(#pivotGradient)" />
            {/* Center Jeweled LED Core */}
            <circle
              cx={cx}
              cy={cy}
              r="4"
              fill={isAchieved ? '#10b981' : '#FFD700'}
              stroke="#0f172a"
              strokeWidth="1"
            />
          </svg>

          {/* Central Digital HUD Display */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-center pointer-events-none">
            <div className="flex items-baseline justify-center gap-0.5">
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.35)]">
                {formatPercent(currentPercent)}
              </span>
            </div>
            <div className="text-[10px] uppercase font-black tracking-widest text-[#FFD700] drop-shadow-sm flex items-center justify-center gap-1">
              <span>{isAchieved ? '✓ Target Achieved' : 'Pencapaian'}</span>
              <span className="text-slate-400 font-mono text-[9px]">
                ({viewMode === 'mtd' ? 'MTD' : 'Harian'})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Target & Actual Summary Box */}
      <div className="space-y-2 pt-2 border-t border-cyan-500/20 text-xs">
        <div className="grid grid-cols-2 gap-2">
          {/* Target */}
          <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-700/60 shadow-inner">
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">
              Target {viewMode === 'mtd' ? 'MTD' : 'Hari Ini'}
            </span>
            <span className="text-xs sm:text-sm font-bold font-mono text-slate-100 mt-0.5 block truncate">
              {formatRupiah(currentTarget)}
            </span>
          </div>

          {/* Actual Sales */}
          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-300 block">
              Actual Sales
            </span>
            <span className="text-xs sm:text-sm font-bold font-mono text-emerald-300 mt-0.5 block truncate">
              {formatRupiah(currentActual)}
            </span>
          </div>
        </div>

        {/* Kekurangan Target / Achievement Store Highlight */}
        <div className={`p-2.5 rounded-xl border flex items-center justify-between shadow-sm ${
          isAchieved
            ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
            : 'bg-rose-500/15 border-rose-500/30 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
        }`}>
          <div>
            <span className="text-[9px] uppercase font-bold tracking-wider block opacity-85">
              {isAchieved ? 'Status Target' : `Kekurangan ${viewMode === 'mtd' ? 'MTD' : 'Hari Ini'} (Rp)`}
            </span>
            <span className="text-xs sm:text-sm font-bold font-mono">
              {isAchieved ? '✓ Achievement Store' : formatRupiah(currentKekurangan)}
            </span>
          </div>
          <div className="text-right flex flex-col items-end">
            <span
              className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-950/70 border border-cyan-500/30 text-cyan-200 shadow-inner"
              title={`Bulan ${summary.monthName} ${summary.year}: Hari ke-${summary.daysElapsed} dari total ${summary.daysInMonth} hari berjalan (Sisa ${summary.daysRemaining} hari)`}
            >
              Hari ke-{summary.daysElapsed}/{summary.daysInMonth}
            </span>
            <span className="text-[9px] text-slate-400 font-mono mt-0.5">
              Sisa {summary.daysRemaining} Hari
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

