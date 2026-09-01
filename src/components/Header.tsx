import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, FileDown, Database, RefreshCw, Radio, 
  Sparkles, Clock, MapPin, Store, Bell, Check, ShieldCheck, Play, Pause, FileText
} from 'lucide-react';
import { StoreSummary, GoogleSheetsConfig } from '../types';

interface HeaderProps {
  summary: StoreSummary;
  onExportPDF: () => void;
  onExportExcel: () => void;
  onOpenGoogleSheets: () => void;
  onTriggerSync: () => void;
  sheetsConfig: GoogleSheetsConfig;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  notificationSlot: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  summary,
  onExportPDF,
  onExportExcel,
  onOpenGoogleSheets,
  onTriggerSync,
  sheetsConfig,
  isSimulating,
  onToggleSimulation,
  notificationSlot,
}) => {
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#0f1d38]/90 backdrop-blur-xl border-b border-cyan-500/30 px-4 sm:px-6 lg:px-8 py-3 transition-all shadow-[0_4px_30px_rgba(0,0,0,0.35)]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Brand & Store Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 bg-gradient-to-br from-[#FFE033] to-[#FFB700] rounded-xl flex items-center justify-center text-slate-950 font-black text-xl shrink-0 shadow-[0_0_20px_rgba(255,215,0,0.45)] border border-yellow-200/50">
            <span>I</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#FFD700] text-slate-950 shadow-sm">
                INFORMA
              </span>
              <span className="text-[11px] font-medium text-slate-300 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#FFD700]" />
                Juanda Medan • <span className="font-mono text-cyan-300 font-semibold">{summary.branchCode}</span>
              </span>
              <button
                type="button"
                onClick={onTriggerSync}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 transition-all cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                title={`Database Auto-Sync Aktif (${sheetsConfig.syncIntervalSeconds || 15}s) • Terakhir: ${sheetsConfig.lastSyncedAt || '-'} • Klik untuk sinkronkan sekarang`}
              >
                {sheetsConfig.isSyncing ? (
                  <RefreshCw className="w-2.5 h-2.5 animate-spin text-emerald-300" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                )}
                <span>AUTO-SYNC DB {sheetsConfig.isSyncing ? 'SINKRON...' : 'AKTIF'}</span>
              </button>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white uppercase drop-shadow-sm">
              INFORMA JUANDA MEDAN
            </h1>
            <p className="text-[10px] text-cyan-300/70 font-medium uppercase tracking-widest hidden sm:block">
              Sales Monitoring System • Live Pos Update
            </p>
          </div>
        </div>

        {/* Right: Actions Bar */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          {/* Real-time Clock Info */}
          <div className="hidden lg:flex flex-col items-end mr-1 text-right">
            <span className="text-xs font-mono font-bold text-cyan-200 flex items-center gap-1 drop-shadow-sm">
              <Clock className="w-3.5 h-3.5 text-[#FFD700]" />
              {timeString}
            </span>
            <span className="text-[10px] text-slate-300 font-medium">
              {summary.currentDate}
            </span>
          </div>

          <div className="hidden lg:block w-px h-6 bg-cyan-500/30 mx-1"></div>

          {/* Simulation Toggle */}
          <button
            type="button"
            id="btn-toggle-sim"
            onClick={onToggleSimulation}
            className={`px-3 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-all border shadow-sm ${
              isSimulating
                ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse'
                : 'bg-slate-800/80 border-cyan-500/30 text-slate-200 hover:text-white hover:bg-slate-700/80 hover:border-cyan-400/50'
            }`}
            title="Mode simulasi transaksi live POS otomatis"
          >
            {isSimulating ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                Simulasi Aktif
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-[#FFD700]" />
                Auto-POS
              </>
            )}
          </button>

          {/* Google Sheets Sync Button */}
          <button
            type="button"
            id="btn-google-sheets"
            onClick={onOpenGoogleSheets}
            className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/90 border border-cyan-500/30 hover:border-cyan-400/60 text-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm group"
            title="Buka Sinkronisasi Database Google Sheets"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-105 transition-transform" />
            <span className="hidden sm:inline">Google Sheets</span>
          </button>

          {/* Export PDF Button */}
          <button
            type="button"
            id="btn-export-pdf"
            onClick={onExportPDF}
            className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/90 border border-cyan-500/30 hover:border-red-400/60 text-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm group"
            title="Ekspor Laporan Kinerja Penjualan ke Format PDF"
          >
            <FileText className="w-3.5 h-3.5 text-rose-400 group-hover:scale-105 transition-transform" />
            <span>EXPORT PDF</span>
          </button>

          {/* Export Excel Button */}
          <button
            type="button"
            id="btn-export-excel"
            onClick={onExportExcel}
            className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/90 border border-cyan-500/30 hover:border-emerald-400/60 text-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm group"
            title="Ekspor Laporan Kinerja Penjualan ke Format Excel (.xlsx)"
          >
            <FileDown className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-105 transition-transform" />
            <span>EXPORT EXCEL</span>
          </button>

          {/* Push Notification Center Slot */}
          {notificationSlot}
        </div>
      </div>
    </header>
  );
};
