import React from 'react';
import { 
  Trophy, TrendingDown, Award, Star, CheckCircle, Sparkles, AlertTriangle
} from 'lucide-react';
import { ComputedSMT } from '../types';
import { formatPercent, formatRupiah, getGoogleDriveDirectImageUrl } from '../utils/formatters';

interface BestPoorSMTProps {
  smts: ComputedSMT[];
  onSelectSMT?: (smt: ComputedSMT) => void;
}

export const BestPoorSMT: React.FC<BestPoorSMTProps> = ({
  smts,
  onSelectSMT,
}) => {
  // Sort SMTs by MTD % descending
  const sortedSMTs = [...smts].sort((a, b) => b.mtdPercent - a.mtdPercent);

  // Top 3 Best SMT
  const bestSMTs = sortedSMTs.slice(0, 3);

  // Bottom 3 Poor SMT (lowest performers)
  const poorSMTs = [...sortedSMTs].reverse().slice(0, 3);

  const getRankBadge = (index: number) => {
    if (index === 0) {
      return {
        badgeClass: 'bg-gradient-to-br from-[#FFE033] to-[#FFB700] text-slate-950 font-black shadow-[0_0_10px_rgba(255,215,0,0.5)]',
        borderClass: 'border-yellow-400/40 bg-slate-900/80 shadow-[0_0_15px_rgba(255,215,0,0.1)]',
      };
    }
    if (index === 1) {
      return {
        badgeClass: 'bg-slate-200 text-slate-950 font-black shadow-[0_0_10px_rgba(255,255,255,0.4)]',
        borderClass: 'border-slate-400/40 bg-slate-900/70',
      };
    }
    return {
      badgeClass: 'bg-amber-600 text-white font-black shadow-[0_0_10px_rgba(217,119,6,0.4)]',
      borderClass: 'border-amber-600/30 bg-slate-900/60',
    };
  };

  return (
    <div
      id="best-poor-smt-section"
      className="rounded-2xl futuristic-card p-4 sm:p-5 shadow-2xl flex flex-col h-full overflow-hidden justify-between"
    >
      {/* Section Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-cyan-300/80 uppercase tracking-widest">
              Ranking SMT
            </span>
            <span className="text-[10px] bg-cyan-500/15 border border-cyan-400/30 px-2 py-0.5 rounded-full text-cyan-200 font-semibold shadow-sm">
              Top & Bottom
            </span>
          </div>
          <span className="text-[10px] text-cyan-300/60 font-mono font-medium">
            {smts.length} SMT
          </span>
        </div>

        <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-2 mb-3 drop-shadow-sm">
          <Trophy className="w-4 h-4 text-[#FFD700]" />
          Best & Poor SMT
        </h2>
      </div>

      {/* Main Ranking Content (Top 3 & Bottom 3) - Fixed layout fitted to column */}
      <div className="space-y-2.5 flex-1 flex flex-col justify-between overflow-hidden">
        {/* TOP 3 BEST SMT */}
        <div className="space-y-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#FFD700]" />
              Top 3 Best SMT
            </span>
            <span className="text-[9px] font-mono font-semibold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/40 shadow-sm">
              High MTD
            </span>
          </div>

          <div className="space-y-1.5">
            {bestSMTs.map((smt, idx) => {
              const rankInfo = getRankBadge(idx);
              return (
                <div
                  key={smt.id}
                  onClick={() => onSelectSMT && onSelectSMT(smt)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${rankInfo.borderClass} hover:border-[#FFD700]/70 hover:bg-slate-800/90 shadow-sm group`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${rankInfo.badgeClass}`}>
                      {idx + 1}
                    </div>

                    <div className="relative shrink-0">
                      <img
                        src={getGoogleDriveDirectImageUrl(smt.photoUrl, smt.name)}
                        alt={smt.name}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-full object-cover border border-cyan-400/40 shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            smt.name
                          )}&background=ffd700&color=000000&bold=true`;
                        }}
                      />
                      {smt.isInsentifQualified && (
                        <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-400 text-slate-950 p-0.5 rounded-full ring-1 ring-slate-900 shadow-sm" title="Insentif Qualified!">
                          <CheckCircle className="w-2 h-2 fill-emerald-300 text-slate-950" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="font-bold text-xs text-white group-hover:text-[#FFD700] transition-colors truncate">
                        {smt.name}
                      </div>
                      <div className="text-[10px] text-slate-300 font-mono truncate">
                        Act: {formatRupiah(smt.totalActual)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold font-mono text-emerald-300 drop-shadow-sm">
                      {formatPercent(smt.mtdPercent)}
                    </div>
                    <div className="text-[9px] font-mono text-slate-400">
                      MTD %
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* BOTTOM 3 POOR SMT */}
        <div className="pt-2 border-t border-cyan-500/20 space-y-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-rose-400" />
              Top 3 Poor SMT
            </span>
            <span className="text-[9px] font-mono font-semibold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-400/40 shadow-sm">
              Perlu Dorongan
            </span>
          </div>

          <div className="space-y-1.5">
            {poorSMTs.map((smt, idx) => {
              return (
                <div
                  key={smt.id}
                  onClick={() => onSelectSMT && onSelectSMT(smt)}
                  className="p-2 rounded-xl border border-slate-700/60 bg-slate-900/60 hover:border-rose-500/50 hover:bg-slate-800/80 transition-all cursor-pointer flex items-center justify-between gap-2 shadow-sm group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-rose-500/25 text-rose-300 border border-rose-500/40 shrink-0 font-mono">
                      #{smts.length - idx}
                    </div>

                    <div className="relative shrink-0">
                      <img
                        src={getGoogleDriveDirectImageUrl(smt.photoUrl, smt.name)}
                        alt={smt.name}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-full object-cover border border-slate-600 grayscale-[25%]"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            smt.name
                          )}&background=334155&color=ffffff`;
                        }}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-200 group-hover:text-rose-300 transition-colors truncate">
                        {smt.name}
                      </div>
                      <div className="text-[10px] text-rose-300 font-mono truncate">
                        Kekurangan: {formatRupiah(smt.kekuranganTotal)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold font-mono text-rose-300">
                      {formatPercent(smt.mtdPercent)}
                    </div>
                    <div className="text-[9px] font-mono text-slate-400">
                      MTD %
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-2 pt-2 border-t border-cyan-500/20 flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <span>Evaluasi Insentif 100% Dual</span>
        <span className="text-[#FFD700] font-semibold">Informa Juanda</span>
      </div>
    </div>
  );
};
