import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Building, Search, CheckCircle2, AlertCircle, Edit2, Play, Pause, RotateCcw, Zap
} from 'lucide-react';
import { ComputedDepartment } from '../types';
import { formatRupiah, formatPercent } from '../utils/formatters';

interface DepartmentContributionProps {
  departments: ComputedDepartment[];
  onEditDepartment?: (dept: ComputedDepartment) => void;
}

export const DepartmentContribution: React.FC<DepartmentContributionProps> = ({
  departments,
  onEditDepartment,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'mtdDesc' | 'mtdAsc' | 'shortfallDesc' | 'name'>('mtdDesc');

  // Auto-rolling states
  const [isAutoRolling, setIsAutoRolling] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [rollSpeed, setRollSpeed] = useState<number>(0.6); // pixels per frame
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // Filter and sort 20 departments
  const filteredDepartments = useMemo(() => {
    return departments
      .filter((dept) => {
        const matchesSearch = 
          dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dept.psName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = 
          categoryFilter === 'all' || dept.category.toLowerCase() === categoryFilter.toLowerCase();
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'mtdDesc') return b.mtdPercent - a.mtdPercent;
        if (sortBy === 'mtdAsc') return a.mtdPercent - b.mtdPercent;
        if (sortBy === 'shortfallDesc') return b.kekurangan - a.kekurangan;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [departments, searchQuery, categoryFilter, sortBy]);

  const totalDeptCount = departments.length;
  const achievedCount = departments.filter((d) => d.mtdPercent >= 100).length;

  // Auto-rolling animation logic
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !isAutoRolling || isHovered) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    let lastTime = performance.now();
    let pauseTimer: NodeJS.Timeout | null = null;
    let isPausedAtBoundary = false;

    const rollStep = (time: number) => {
      const delta = Math.min((time - lastTime) / 16.66, 2.5);
      lastTime = time;

      if (!isPausedAtBoundary && container) {
        const maxScroll = container.scrollHeight - container.clientHeight;
        if (maxScroll > 10) {
          if (container.scrollTop >= maxScroll - 2) {
            isPausedAtBoundary = true;
            pauseTimer = setTimeout(() => {
              if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
              setTimeout(() => {
                isPausedAtBoundary = false;
              }, 1200);
            }, 1800);
          } else {
            container.scrollTop += rollSpeed * delta;
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(rollStep);
    };

    animFrameRef.current = requestAnimationFrame(rollStep);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (pauseTimer) clearTimeout(pauseTimer);
    };
  }, [isAutoRolling, isHovered, rollSpeed, filteredDepartments]);

  const handleResetScroll = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div
      id="department-contribution-section"
      className="rounded-2xl futuristic-card p-4 sm:p-5 shadow-2xl flex flex-col h-full overflow-hidden justify-between"
    >
      {/* Section Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-cyan-300/80 uppercase tracking-widest">
              20 Departemen
            </span>
            <span className="text-[10px] bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 px-2 py-0.5 rounded-full font-semibold shadow-sm">
              {achievedCount}/{totalDeptCount} Achieved
            </span>
          </div>

          {/* Rolling Controls */}
          <div className="flex items-center gap-1 bg-slate-950/70 p-0.5 rounded-lg border border-cyan-500/30 text-[10px] shadow-inner">
            <button
              type="button"
              id="btn-toggle-rolling-dept"
              onClick={() => setIsAutoRolling((prev) => !prev)}
              className={`px-2 py-0.5 rounded flex items-center gap-1 font-bold transition-all ${
                isAutoRolling
                  ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title={isAutoRolling ? 'Jeda rolling otomatis' : 'Aktifkan rolling otomatis'}
            >
              {isAutoRolling ? <Pause className="w-2.5 h-2.5 fill-current" /> : <Play className="w-2.5 h-2.5 fill-current" />}
              <span>{isAutoRolling ? 'ROLLING' : 'PAUSE'}</span>
            </button>

            <button
              type="button"
              onClick={handleResetScroll}
              className="p-1 text-slate-400 hover:text-cyan-300 rounded hover:bg-slate-800 transition-colors"
              title="Kembali ke atas"
            >
              <RotateCcw className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>

        <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-2 mb-3 drop-shadow-sm">
          <Building className="w-4 h-4 text-[#FFD700]" />
          Kontribusi Departemen
        </h2>

        {/* Compact Search & Category Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 mb-3">
          <div className="sm:col-span-7 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              id="search-dept"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Dept / PS..."
              className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-slate-950/70 border border-cyan-500/30 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition-all shadow-inner"
            />
          </div>

          <div className="sm:col-span-5">
            <select
              id="filter-category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter kategori departemen"
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950/70 border border-cyan-500/30 text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-400 transition-all shadow-inner"
            >
              <option value="all">Semua ({totalDeptCount})</option>
              <option value="furniture">Furniture</option>
              <option value="accessories">Accessories</option>
              <option value="commercial">Commercial</option>
              <option value="special">Special</option>
            </select>
          </div>
        </div>
      </div>

      {/* Auto-Rolling Department List */}
      <div 
        ref={scrollContainerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1 min-h-[220px] max-h-[300px] select-none"
      >
        {filteredDepartments.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Tidak ada departemen yang cocok.
          </div>
        ) : (
          filteredDepartments.map((dept, index) => {
            const isAchieved = dept.mtdPercent >= 100;
            const progressWidth = Math.min(dept.mtdPercent, 100);

            return (
              <div
                key={dept.id}
                className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/60 hover:border-cyan-500/40 transition-all text-xs group relative shadow-sm"
              >
                {/* Top Row: Name, Category, MTD % */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="min-w-0 flex items-center gap-2">
                    <span className="w-5 h-5 rounded flex items-center justify-center bg-slate-800 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 shrink-0 font-bold">
                      {index + 1}
                    </span>
                    <div className="truncate">
                      <div className="font-bold text-white group-hover:text-[#FFD700] transition-colors truncate">
                        {dept.name}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                        <span>PS: {dept.psName}</span>
                        <span className="text-cyan-500/50">•</span>
                        <span className="text-slate-400 font-medium">{dept.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] shadow-sm ${
                        isAchieved
                          ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/40'
                          : dept.mtdPercent >= 80
                          ? 'bg-amber-500/25 text-amber-300 border border-amber-400/40'
                          : 'bg-rose-500/25 text-rose-300 border border-rose-400/40'
                      }`}
                    >
                      {formatPercent(dept.mtdPercent)}
                    </span>

                    {onEditDepartment && (
                      <button
                        type="button"
                        onClick={() => onEditDepartment(dept)}
                        className="p-1 rounded bg-slate-800 hover:bg-[#FFD700] hover:text-slate-950 text-slate-400 hover:text-slate-950 transition-colors border border-slate-700 hover:border-transparent"
                        title="Edit Target & Actual Departemen"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-950/80 rounded-full h-1.5 overflow-hidden mb-1.5 border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isAchieved
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                        : dept.mtdPercent >= 80
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                        : 'bg-gradient-to-r from-rose-500 to-red-400 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                    }`}
                    style={{ width: `${progressWidth}%` }}
                  />
                </div>

                {/* Bottom Row: Actual vs Target & Kekurangan */}
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
                  <div>
                    <span className="text-emerald-300 font-semibold">
                      Act: {formatRupiah(dept.actual)}
                    </span>
                    <span className="text-slate-500 mx-1">/</span>
                    <span className="text-slate-300">
                      Tgt: {formatRupiah(dept.target)}
                    </span>
                  </div>

                  <div>
                    {isAchieved ? (
                      <span className="text-emerald-300 font-bold">✓ FullFill</span>
                    ) : (
                      <span className="text-rose-300 font-semibold">
                        Kekurangan: {formatRupiah(dept.kekurangan)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info with Rolling Status Indicator */}
      <div className="mt-2 pt-2 border-t border-cyan-500/20 flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <span className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-cyan-400" />
          <span>Rolling: {isAutoRolling ? (isHovered ? 'Dijeda (Hover)' : 'Aktif') : 'Mati'}</span>
        </span>
        <span className="text-[#FFD700] font-semibold">20 Departemen</span>
      </div>
    </div>
  );
};

