import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Users, Search, Award, CheckCircle2, XCircle, Shield, 
  Sparkles, Filter, Edit3, Play, Pause, RotateCcw, FastForward, SlidersHorizontal
} from 'lucide-react';
import { ComputedSMT } from '../types';
import { formatRupiah, formatPercent, formatInteger, getGoogleDriveDirectImageUrl } from '../utils/formatters';

interface SMTPerformanceTableProps {
  smts: ComputedSMT[];
  onEditSMT?: (smt: ComputedSMT) => void;
  onAddSMT?: () => void;
}

export const SMTPerformanceTable: React.FC<SMTPerformanceTableProps> = ({
  smts,
  onEditSMT,
  onAddSMT,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [incentiveFilter, setIncentiveFilter] = useState<'all' | 'qualified' | 'not_qualified'>('all');
  const [sortBy, setSortBy] = useState<'mtdDesc' | 'mtdAsc' | 'comserDesc' | 'polisDesc' | 'name'>('mtdDesc');
  
  // Auto-scroll state
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(true);
  const [scrollSpeed, setScrollSpeed] = useState<number>(0.8); // pixels per frame
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Filter and sort SMTs
  const filteredSMTs = useMemo(() => {
    return smts
      .filter((smt) => {
        const matchesSearch = 
          smt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          smt.nik.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesIncentive = 
          incentiveFilter === 'all' ||
          (incentiveFilter === 'qualified' && smt.isInsentifQualified) ||
          (incentiveFilter === 'not_qualified' && !smt.isInsentifQualified);

        return matchesSearch && matchesIncentive;
      })
      .sort((a, b) => {
        if (sortBy === 'mtdDesc') return b.mtdPercent - a.mtdPercent;
        if (sortBy === 'mtdAsc') return a.mtdPercent - b.mtdPercent;
        if (sortBy === 'comserDesc') return (b.comser || 0) - (a.comser || 0);
        if (sortBy === 'polisDesc') return (b.polis || 0) - (a.polis || 0);
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [smts, searchQuery, incentiveFilter, sortBy]);

  const totalSMT = smts.length;
  const qualifiedSMTCount = smts.filter((s) => s.isInsentifQualified).length;
  const totalComserSum = smts.reduce((sum, s) => sum + (s.comser || 0), 0);
  const totalPolisSum = smts.reduce((sum, s) => sum + (s.polis || 0), 0);

  // Continuous Auto-Scroll Effect (top to bottom loop)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let accumulatedScroll = container.scrollTop;

    const scrollStep = () => {
      if (isAutoScrolling && !isHovered && container) {
        accumulatedScroll += scrollSpeed;
        
        // Check if reached or near bottom
        const maxScroll = container.scrollHeight - container.clientHeight;
        if (maxScroll > 10) {
          if (accumulatedScroll >= maxScroll) {
            // Smoothly wrap around or restart from top after brief delay
            accumulatedScroll = 0;
            container.scrollTop = 0;
          } else {
            container.scrollTop = accumulatedScroll;
          }
        }
      } else if (container) {
        // Sync accumulatedScroll if user manually scrolled
        accumulatedScroll = container.scrollTop;
      }

      animationFrameRef.current = requestAnimationFrame(scrollStep);
    };

    animationFrameRef.current = requestAnimationFrame(scrollStep);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isAutoScrolling, isHovered, scrollSpeed, filteredSMTs.length]);

  const handleResetScroll = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div
      id="smt-performance-section"
      className="rounded-2xl futuristic-card p-4 sm:p-5 md:p-6 shadow-2xl overflow-hidden"
    >
      {/* Table Header with Title and Auto-scroll controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-cyan-300/80 uppercase tracking-widest">
              Performance SMT & Insentif
            </span>
            <span className="text-[10px] bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 px-2 py-0.5 rounded-full font-semibold shadow-sm">
              {qualifiedSMTCount} / {totalSMT} SMT Qualified
            </span>
          </div>
          <h2 className="text-base sm:text-lg md:text-xl font-extrabold tracking-tight text-white mt-1 flex items-center gap-2 drop-shadow-sm">
            <Users className="w-4 h-4 text-[#FFD700]" />
            Tabel Lengkap Performa SMT
          </h2>
        </div>

        {/* Auto-scroll Status and Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Auto Scroll Controls Group */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-cyan-500/30 text-xs shadow-inner">
            <button
              type="button"
              id="btn-toggle-autoscroll"
              onClick={() => setIsAutoScrolling(!isAutoScrolling)}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 font-bold transition-all ${
                isAutoScrolling
                  ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
              title={isAutoScrolling ? 'Klik untuk menjeda gulir otomatis' : 'Klik untuk mengaktifkan gulir otomatis'}
            >
              {isAutoScrolling ? (
                <>
                  <Pause className="w-3 h-3" />
                  <span>Auto-Scroll: Aktif</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 text-[#FFD700]" />
                  <span>Auto-Scroll: Jeda</span>
                </>
              )}
            </button>

            {/* Speed Selector */}
            <div className="flex items-center gap-0.5 px-1 border-l border-cyan-500/20">
              <span className="text-[10px] text-slate-400 mr-1 font-medium">Kecepatan:</span>
              <button
                type="button"
                onClick={() => setScrollSpeed(0.4)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${scrollSpeed === 0.4 ? 'bg-[#FFD700] text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                1x
              </button>
              <button
                type="button"
                onClick={() => setScrollSpeed(0.8)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${scrollSpeed === 0.8 ? 'bg-[#FFD700] text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                2x
              </button>
              <button
                type="button"
                onClick={() => setScrollSpeed(1.6)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${scrollSpeed === 1.6 ? 'bg-[#FFD700] text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                3x
              </button>
            </div>

            {/* Reset to Top */}
            <button
              type="button"
              onClick={handleResetScroll}
              className="p-1 text-slate-400 hover:text-cyan-300 rounded hover:bg-slate-800 transition-colors"
              title="Kembali ke Baris Teratas"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Add SMT Button */}
          {onAddSMT && (
            <button
              type="button"
              id="btn-add-smt"
              onClick={onAddSMT}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#FFAA00] hover:from-[#ffe234] hover:to-[#ffb700] text-slate-950 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(255,215,0,0.35)]"
            >
              + SMT Baru
            </button>
          )}
        </div>
      </div>

      {/* Overview Stat Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 shadow-inner">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block">Total SMT Aktif</span>
          <span className="text-base sm:text-lg font-bold text-white font-mono mt-0.5 block">{totalSMT} Orang</span>
        </div>
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
          <span className="text-[10px] text-emerald-300 uppercase font-bold tracking-widest block">Status Insentif</span>
          <span className="text-base sm:text-lg font-bold text-emerald-300 font-mono mt-0.5 block">{qualifiedSMTCount} SMT Berhak</span>
        </div>
        <div className="p-3 rounded-xl bg-cyan-500/15 border border-cyan-400/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          <span className="text-[10px] text-cyan-300 uppercase font-bold tracking-widest block">Total Comser</span>
          <span className="text-base sm:text-lg font-bold text-cyan-300 font-mono mt-0.5 block">{formatRupiah(totalComserSum)}</span>
        </div>
        <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-400/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
          <span className="text-[10px] text-amber-300 uppercase font-bold tracking-widest block">Total Polis</span>
          <span className="text-base sm:text-lg font-bold text-[#FFD700] font-mono mt-0.5 block">{formatInteger(totalPolisSum)} Polis</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 mb-3">
        {/* Search */}
        <div className="sm:col-span-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            id="search-smt"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari SMT berdasarkan nama atau NIK..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950/70 border border-cyan-500/30 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition-all shadow-inner"
          />
        </div>

        {/* Incentive Filter */}
        <div className="sm:col-span-3">
          <select
            id="filter-incentive"
            value={incentiveFilter}
            onChange={(e) => setIncentiveFilter(e.target.value as any)}
            aria-label="Filter status insentif SMT"
            className="w-full px-3 py-1.5 rounded-lg bg-slate-950/70 border border-cyan-500/30 text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-400 transition-all shadow-inner"
          >
            <option value="all">Semua Status ({totalSMT})</option>
            <option value="qualified">Berhak Mendapat Insentif ({qualifiedSMTCount})</option>
            <option value="not_qualified">Belum Berhak Mendapat Insentif ({totalSMT - qualifiedSMTCount})</option>
          </select>
        </div>

        {/* Sort SMT */}
        <div className="sm:col-span-3">
          <select
            id="sort-smt"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            aria-label="Urutkan performa SMT"
            className="w-full px-3 py-1.5 rounded-lg bg-slate-950/70 border border-cyan-500/30 text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-400 transition-all shadow-inner"
          >
            <option value="mtdDesc">MTD % Tertinggi</option>
            <option value="mtdAsc">MTD % Terendah</option>
            <option value="comserDesc">Comser Tertinggi (Rp)</option>
            <option value="polisDesc">Polis Terbanyak</option>
            <option value="name">Nama SMT (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Main SMT Performance Table with Continuous Auto-Scroll */}
      <div 
        ref={scrollContainerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="overflow-x-auto rounded-xl border border-cyan-500/30 bg-slate-950/80 max-h-[380px] overflow-y-auto custom-scrollbar relative select-none shadow-inner"
      >
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-900/95 backdrop-blur-md border-b border-cyan-500/30 text-cyan-300 uppercase tracking-widest text-[10px] font-extrabold sticky top-0 z-20 shadow-md">
            <tr>
              <th className="py-2.5 px-3">No</th>
              <th className="py-2.5 px-3">Nama SMT</th>
              <th className="py-2.5 px-3 text-right">Kekurangan Furniture</th>
              <th className="py-2.5 px-3 text-right">Kekurangan Accessories</th>
              <th className="py-2.5 px-3 text-center">MTD %</th>
              <th className="py-2.5 px-3 text-center">Status Insentif</th>
              <th className="py-2.5 px-3 text-right">Comser (Rp)</th>
              <th className="py-2.5 px-3 text-center">Polis</th>
              <th className="py-2.5 px-2 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredSMTs.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400">
                  Tidak ada data SMT yang cocok dengan pencarian / filter.
                </td>
              </tr>
            ) : (
              filteredSMTs.map((smt, idx) => {
                return (
                  <tr
                    key={smt.id}
                    className="hover:bg-slate-800/70 transition-colors group cursor-default"
                  >
                    {/* Number */}
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 font-bold">
                      {idx + 1}
                    </td>

                    {/* Foto SMT & Nama */}
                    <td className="py-2.5 px-3 min-w-[180px]">
                      <div className="flex items-center gap-2.5">
                        <div className="relative shrink-0">
                          <img
                            src={getGoogleDriveDirectImageUrl(smt.photoUrl, smt.name)}
                            alt={smt.name}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-full object-cover border border-slate-600 group-hover:border-cyan-400 transition-colors shadow-sm"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                smt.name
                              )}&background=ffd700&color=000000&bold=true`;
                            }}
                          />
                          {smt.isInsentifQualified && (
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-slate-950 shadow-sm" title="Berhak Mendapat Insentif" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-white group-hover:text-[#FFD700] transition-colors">
                            {smt.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            NIK: {smt.nik}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Kekurangan Furniture (Rp, no decimals) */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap font-mono">
                      {smt.isFurnitureAchieved ? (
                        <div className="flex flex-col items-end">
                          <span className="text-emerald-300 font-bold flex items-center gap-1 text-[11px]">
                            ✓ FullFill
                          </span>
                          <span className="text-[9px] text-slate-400">
                            Act: {formatRupiah(smt.actualFurniture)}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end">
                          <span className="text-rose-300 font-bold text-[11px]">
                            {formatRupiah(smt.kekuranganFurniture)}
                          </span>
                          <span className="text-[9px] text-slate-400">
                            Tgt: {formatRupiah(smt.targetFurniture)}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Kekurangan Accessories (Rp, no decimals) */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap font-mono">
                      {smt.isAccessoriesAchieved ? (
                        <div className="flex flex-col items-end">
                          <span className="text-emerald-300 font-bold flex items-center gap-1 text-[11px]">
                            ✓ FullFill
                          </span>
                          <span className="text-[9px] text-slate-400">
                            Act: {formatRupiah(smt.actualAccessories)}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end">
                          <span className="text-rose-300 font-bold text-[11px]">
                            {formatRupiah(smt.kekuranganAccessories)}
                          </span>
                          <span className="text-[9px] text-slate-400">
                            Tgt: {formatRupiah(smt.targetAccessories)}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* MTD % (2 decimal places) */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap font-mono">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] shadow-sm ${
                          smt.mtdPercent >= 100
                            ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/40'
                            : smt.mtdPercent >= 80
                            ? 'bg-amber-500/25 text-amber-300 border border-amber-400/40'
                            : 'bg-rose-500/25 text-rose-300 border border-rose-400/40'
                        }`}
                      >
                        {formatPercent(smt.mtdPercent)}
                      </span>
                    </td>

                    {/* Insentif (100% Furniture AND 100% Accessories) */}
                    <td className="py-2.5 px-3 text-center min-w-[170px]">
                      {smt.isInsentifQualified ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/25 text-emerald-300 border border-emerald-400/40 flex items-center gap-1 text-center shadow-sm">
                            <Sparkles className="w-2.5 h-2.5 text-[#FFD700]" />
                            Berhak Mendapat Insentif
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex flex-col items-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-medium bg-slate-900 text-slate-400 border border-slate-700 flex items-center gap-1 text-center">
                            <XCircle className="w-2.5 h-2.5 text-rose-400" />
                            Belum Berhak Mendapat Insentif
                          </span>
                          <span className="text-[9px] text-slate-400 mt-0.5 max-w-[150px] truncate" title={smt.statusReason}>
                            {smt.statusReason}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Comser */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap font-mono font-bold text-cyan-300">
                      {formatRupiah(smt.comser || 0)}
                    </td>

                    {/* Polis */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap font-mono font-bold text-[#FFD700]">
                      <span className="inline-flex items-center gap-1 text-[11px] bg-amber-500/15 border border-amber-400/30 px-2 py-0.5 rounded-full">
                        <Shield className="w-3 h-3 text-[#FFD700]" />
                        {formatInteger(smt.polis || 0)} Polis
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="py-2.5 px-2 text-center">
                      {onEditSMT && (
                        <button
                          type="button"
                          onClick={() => onEditSMT(smt)}
                          className="p-1 rounded bg-slate-800 hover:bg-[#FFD700] hover:text-slate-950 text-slate-400 transition-colors border border-slate-700 hover:border-transparent"
                          title="Edit data performa SMT"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Guidance and Auto-scroll Status Notice */}
      <div className="mt-3 p-2.5 rounded-xl bg-slate-900/60 border border-cyan-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Award className="w-3.5 h-3.5 text-[#FFD700] shrink-0" />
          <span className="text-[11px]">
            <strong className="text-[#FFD700] font-bold">Aturan Insentif:</strong> Wajib mencapai minimal <strong>100% Furniture</strong> & <strong>100% Accessories</strong> (Berhak Mendapat Insentif). Arahkan kursor ke tabel untuk menghentikan gulir otomatis sementara.
          </span>
        </div>
        <span className="font-mono text-cyan-300/80 text-[10px] font-semibold">
          Gulir Otomatis: {isAutoScrolling ? (isHovered ? 'Dijeda (Mouse Hover)' : 'Berjalan') : 'Dimatikan'}
        </span>
      </div>
    </div>
  );
};
