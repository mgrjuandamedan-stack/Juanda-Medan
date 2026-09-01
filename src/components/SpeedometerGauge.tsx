import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Target, TrendingUp, AlertTriangle, CheckCircle2, Zap, Flame, Award, DollarSign } from 'lucide-react';
import { formatRupiah, formatPercent, formatInteger } from '../utils/formatters';
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

  // Gauge calculations (180 degree semi-circle: from -90deg to +90deg)
  const clampedPercent = Math.min(Math.max(currentPercent, 0), 140);
  const needleAngle = -90 + (clampedPercent / 140) * 180;

  // Status badge config
  let statusBadge = {
    bg: 'bg-red-500/10 border-red-500/30 text-red-400',
    title: 'Under Target',
    icon: AlertTriangle,
    accent: '#ef4444',
  };
  if (currentPercent >= 110) {
    statusBadge = {
      bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
      title: 'SUPERIOR (110%+)',
      icon: Flame,
      accent: '#10b981',
    };
  } else if (currentPercent >= 100) {
    statusBadge = {
      bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      title: 'ACHIEVED (100%+)',
      icon: CheckCircle2,
      accent: '#34d399',
    };
  } else if (currentPercent >= 85) {
    statusBadge = {
      bg: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
      title: 'On-Track (85%+)',
      icon: Zap,
      accent: '#f59e0b',
    };
  }

  const StatusIcon = statusBadge.icon;

  return (
    <div
      id="speedometer-section"
      className="relative overflow-hidden rounded-2xl futuristic-card p-4 sm:p-5 shadow-2xl flex flex-col h-full justify-between group"
    >
      {/* Background ambient glow */}
      <div
        className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-20 transition-all duration-700"
        style={{ backgroundColor: statusBadge.accent }}
      />

      {/* Header & Toggle */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-cyan-300/80 uppercase tracking-widest">
              Store Performance
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border shadow-sm ${statusBadge.bg}`}>
              <StatusIcon className="w-3 h-3" />
              {statusBadge.title}
            </span>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-950/70 p-0.5 rounded-lg border border-cyan-500/30 text-[10px] shadow-inner">
            <button
              type="button"
              id="toggle-view-mtd"
              onClick={() => setViewMode('mtd')}
              className={`px-2.5 py-0.5 rounded-md transition-all ${
                viewMode === 'mtd'
                  ? 'bg-gradient-to-r from-[#FFD700] to-[#FFAA00] text-slate-950 font-extrabold shadow-[0_0_10px_rgba(255,215,0,0.4)]'
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
                  ? 'bg-gradient-to-r from-[#FFD700] to-[#FFAA00] text-slate-950 font-extrabold shadow-[0_0_10px_rgba(255,215,0,0.4)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Harian
            </button>
          </div>
        </div>

        <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-2 drop-shadow-sm">
          <Target className="w-4 h-4 text-[#FFD700]" />
          Pencapaian MTD Store
        </h2>
      </div>

      {/* Speedometer Gauge Visual */}
      <div className="my-2 flex flex-col items-center justify-center relative">
        <div className="relative w-full max-w-[240px] aspect-[2/1.25] flex items-center justify-center">
          <svg
            viewBox="0 0 240 135"
            className="w-full h-full drop-shadow-[0_4px_15px_rgba(0,0,0,0.4)] overflow-visible"
          >
            <defs>
              <linearGradient id="gaugeGradientCompact" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="45%" stopColor="#FFD700" />
                <stop offset="71.4%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
              <filter id="needleShadowCompact" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.9" />
              </filter>
            </defs>

            {/* Background track */}
            <path
              d="M 25 120 A 95 95 0 0 1 215 120"
              fill="none"
              stroke="#1e293b"
              strokeWidth="14"
              strokeLinecap="round"
            />

            {/* Colored meter track */}
            <path
              d="M 25 120 A 95 95 0 0 1 215 120"
              fill="none"
              stroke="url(#gaugeGradientCompact)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray="298.45"
              strokeDashoffset="0"
              opacity="0.95"
            />

            {/* Tick marks */}
            {[
              { p: 0, label: '0%' },
              { p: 70, label: '100%' },
              { p: 105, label: '150%' },
            ].map((tick) => {
              const angle = -180 + (tick.p / 140) * 180;
              const rad = (angle * Math.PI) / 180;
              const x1 = 120 + 82 * Math.cos(rad);
              const y1 = 120 + 82 * Math.sin(rad);
              const x2 = 120 + 88 * Math.cos(rad);
              const y2 = 120 + 88 * Math.sin(rad);
              const tx = 120 + 104 * Math.cos(rad);
              const ty = 120 + 104 * Math.sin(rad);
              return (
                <g key={tick.label}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.6" />
                  <text x={tx} y={ty} fill="#ffffff" fillOpacity="0.75" fontSize="8" textAnchor="middle" dominantBaseline="middle" fontFamily="monospace" fontWeight="bold">
                    {tick.label}
                  </text>
                </g>
              );
            })}

            {/* 100% Target Flag Indicator */}
            <g transform="translate(187, 53)">
              <circle cx="0" cy="0" r="3.5" fill="#10b981" className="animate-pulse" />
              <circle cx="0" cy="0" r="6" fill="none" stroke="#10b981" strokeWidth="1" opacity="0.6" />
            </g>

            {/* Needle */}
            <g
              transform={`rotate(${needleAngle}, 120, 120)`}
              className="transition-transform duration-1000 ease-out"
              filter="url(#needleShadowCompact)"
            >
              <polygon points="117,120 123,120 120.8,32 119.2,32" fill="#FFD700" />
              <polygon points="118.5,45 121.5,45 120,28" fill="#ffffff" />
            </g>

            {/* Center Pivot Pin */}
            <circle cx="120" cy="120" r="9" fill="#0f172a" stroke="#FFD700" strokeWidth="2.5" />
            <circle cx="120" cy="120" r="3.5" fill="#FFD700" />
          </svg>

          {/* Percentage Value Centered Below Pin */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-center">
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]">
              {formatPercent(currentPercent)}
            </div>
            <div className="text-[10px] uppercase font-black tracking-widest text-[#FFD700] -mt-1 drop-shadow-sm">
              Achievement
            </div>
          </div>
        </div>
      </div>

      {/* Target & Actual Summary Box */}
      <div className="space-y-2 pt-2 border-t border-cyan-500/20 text-xs">
        <div className="grid grid-cols-2 gap-2">
          {/* Target */}
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 shadow-inner">
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
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-950/70 border border-cyan-500/30 text-cyan-200 shadow-inner">
            {summary.daysElapsed}/{summary.daysInMonth} Hari
          </span>
        </div>
      </div>
    </div>
  );
};
