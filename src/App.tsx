import React, { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  Building, Users, Trophy, Sparkles, RefreshCw, AlertCircle, 
  HelpCircle, ArrowUpRight, CheckCircle2, Shield, TrendingUp, Info
} from 'lucide-react';

import { 
  Department, SMTPerformance, ComputedDepartment, ComputedSMT, 
  StoreSummary, PushNotificationItem, GoogleSheetsConfig 
} from './types';
import { INITIAL_DEPARTMENTS, INITIAL_SMT_LIST } from './data/initialData';
import { 
  computeDepartmentMetrics, computeSMTMetrics, computeStoreSummary, 
  formatRupiah, formatPercent, formatInteger 
} from './utils/formatters';
import { exportToPDF, exportToExcel } from './utils/exportUtils';
import { fetchLiveDatabase } from './utils/syncService';

import { Header } from './components/Header';
import { SpeedometerGauge } from './components/SpeedometerGauge';
import { DepartmentContribution } from './components/DepartmentContribution';
import { BestPoorSMT } from './components/BestPoorSMT';
import { SMTPerformanceTable } from './components/SMTPerformanceTable';
import { NotificationCenter } from './components/NotificationCenter';
import { GoogleSheetsIntegrationModal } from './components/GoogleSheetsIntegrationModal';
import { EditSMTModal } from './components/EditSMTModal';
import { EditDepartmentModal } from './components/EditDepartmentModal';

export default function App() {
  // State: Core Data (persisted in localStorage if available)
  const [departments, setDepartments] = useState<Department[]>(() => {
    const saved = localStorage.getItem('informa_juanda_departments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 20) return parsed;
      } catch (e) {
        console.error('Error loading stored departments', e);
      }
    }
    return INITIAL_DEPARTMENTS;
  });

  const [smts, setSMTs] = useState<SMTPerformance[]>(() => {
    const saved = localStorage.getItem('informa_juanda_smts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Error loading stored SMTs', e);
      }
    }
    return INITIAL_SMT_LIST;
  });

  const [customSummary, setCustomSummary] = useState<Partial<StoreSummary> | null>(() => {
    const saved = localStorage.getItem('informa_juanda_summary');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading stored summary', e);
      }
    }
    return null;
  });

  const [notifications, setNotifications] = useState<PushNotificationItem[]>([
    {
      id: 'notif-1',
      title: 'Selamat Datang di Informa Juanda Medan',
      message: 'Sistem monitoring penjualan real-time, speedometer target, dan evaluasi 20 departemen & SMT aktif.',
      type: 'info',
      timestamp: '08:00 WIB',
      read: false,
    },
    {
      id: 'notif-2',
      title: '🌟 SMT Top Performer: Rian Syahputra',
      message: 'Mencapai 100% Dual Target (Furniture & Accessories) dan meraih kualifikasi INSENTIF!',
      type: 'achievement',
      timestamp: '09:15 WIB',
      read: false,
    },
  ]);

  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>(() => {
    const saved = localStorage.getItem('informa_juanda_sheets_cfg');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1Rbc8N_-i2BYImnxUdvu1c2CsYRruBD5wpf5kmpwzGDs/edit?usp=sharing',
      sheetId: '1Rbc8N_-i2BYImnxUdvu1c2CsYRruBD5wpf5kmpwzGDs',
      autoSync: true,
      syncIntervalSeconds: 15,
      lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
      isSyncing: false,
      status: 'connected',
    };
  });

  // Live running date ticker (advances automatically every 30 seconds)
  const [runningDateTick, setRunningDateTick] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setRunningDateTick(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Modal states
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [editingSMT, setEditingSMT] = useState<SMTPerformance | null>(null);
  const [isNewSMTOpen, setIsNewSMTOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<ComputedDepartment | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Persistence to localStorage
  useEffect(() => {
    localStorage.setItem('informa_juanda_departments', JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem('informa_juanda_smts', JSON.stringify(smts));
  }, [smts]);

  useEffect(() => {
    if (customSummary) {
      localStorage.setItem('informa_juanda_summary', JSON.stringify(customSummary));
    }
  }, [customSummary]);

  useEffect(() => {
    localStorage.setItem('informa_juanda_sheets_cfg', JSON.stringify(sheetsConfig));
  }, [sheetsConfig]);

  // Calculations
  const computedDepartments = useMemo(() => {
    return departments.map(computeDepartmentMetrics);
  }, [departments]);

  const computedSMTs = useMemo(() => {
    return smts.map(computeSMTMetrics);
  }, [smts]);

  const storeSummary = useMemo(() => {
    const base = computeStoreSummary(computedDepartments, computedSMTs);
    if (!customSummary) return base;

    const totalTargetMTD = customSummary.totalTargetMTD ?? base.totalTargetMTD;
    const totalActualMTD = customSummary.totalActualMTD ?? base.totalActualMTD;
    const kekuranganMTD = customSummary.kekuranganMTD ?? Math.max(0, totalTargetMTD - totalActualMTD);
    const mtdPercent = customSummary.mtdPercent ?? (totalTargetMTD > 0 ? (totalActualMTD / totalTargetMTD) * 100 : 0);

    const dailyTarget = customSummary.dailyTarget ?? base.dailyTarget;
    const dailyActual = customSummary.dailyActual ?? base.dailyActual;
    const dailyKekurangan = customSummary.dailyKekurangan ?? Math.max(0, dailyTarget - dailyActual);
    const dailyPercent = customSummary.dailyPercent ?? (dailyTarget > 0 ? (dailyActual / dailyTarget) * 100 : 0);

    return {
      ...base,
      ...customSummary,
      branchCode: customSummary.branchCode || base.branchCode,
      location: customSummary.location || base.location,
      // Always guarantee current running date (tanggal berjalan) & day counts
      currentDate: base.currentDate,
      dayName: base.dayName,
      monthName: base.monthName,
      year: base.year,
      daysElapsed: base.daysElapsed,
      daysInMonth: base.daysInMonth,
      daysRemaining: base.daysRemaining,
      totalTargetMTD,
      totalActualMTD,
      kekuranganMTD,
      mtdPercent,
      dailyTarget,
      dailyActual,
      dailyKekurangan,
      dailyPercent,
      totalComser: customSummary.totalComser ?? base.totalComser,
      totalPolis: customSummary.totalPolis ?? base.totalPolis,
      totalQualifiedSMT: customSummary.totalQualifiedSMT ?? base.totalQualifiedSMT,
    };
  }, [computedDepartments, computedSMTs, customSummary, runningDateTick]);

  // Helper to add a notification
  const addNotification = useCallback((title: string, message: string, type: 'achievement' | 'milestone' | 'warning' | 'info' = 'info') => {
    const newNotif: PushNotificationItem = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 24)]);
  }, []);

  // Synchronize from database with change detection
  const executeDatabaseSync = useCallback(async (silent = false) => {
    if (!sheetsConfig.sheetUrl) return;

    setSheetsConfig((prev) => ({ ...prev, isSyncing: true }));
    try {
      const result = await fetchLiveDatabase(sheetsConfig.sheetUrl);
      let hasDataChanged = false;
      const changeNotes: string[] = [];

      // Check for Department changes
      if (result.departments && result.departments.length > 0) {
        setDepartments((prevDepts) => {
          const prevStr = JSON.stringify(prevDepts.map(d => ({ n: d.name, t: d.target, a: d.actual, dt: d.dailyTarget, da: d.dailyActual })));
          const nextStr = JSON.stringify(result.departments!.map(d => ({ n: d.name, t: d.target, a: d.actual, dt: d.dailyTarget, da: d.dailyActual })));
          if (prevStr !== nextStr) {
            hasDataChanged = true;
            changeNotes.push('Departemen');
            return result.departments!;
          }
          return prevDepts;
        });
      }

      // Check for SMT changes
      if (result.smts && result.smts.length > 0) {
        setSMTs((prevSMTs) => {
          const prevStr = JSON.stringify(prevSMTs.map(s => ({ n: s.name, tf: s.targetFurniture, af: s.actualFurniture, ta: s.targetAccessories, aa: s.actualAccessories, c: s.comser, p: s.polis, pic: s.photoUrl })));
          const nextStr = JSON.stringify(result.smts!.map(s => ({ n: s.name, tf: s.targetFurniture, af: s.actualFurniture, ta: s.targetAccessories, aa: s.actualAccessories, c: s.comser, p: s.polis, pic: s.photoUrl })));
          if (prevStr !== nextStr) {
            hasDataChanged = true;
            changeNotes.push('Performa SMT');
            return result.smts!;
          }
          return prevSMTs;
        });
      }

      // Check for Store Summary changes
      if (result.summary) {
        setCustomSummary((prevSummary) => {
          const prevStr = JSON.stringify(prevSummary || {});
          const nextStr = JSON.stringify(result.summary || {});
          if (prevStr !== nextStr) {
            hasDataChanged = true;
            changeNotes.push('Ringkasan Toko');
            return result.summary!;
          }
          return prevSummary;
        });
      }

      setSheetsConfig((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
        status: 'connected',
        errorMessage: undefined,
      }));

      if (hasDataChanged) {
        addNotification(
          '⚡ Data Database Diperbarui Otomatis',
          `Perubahan pada database (${changeNotes.join(', ')}) langsung disinkronkan ke dashboard.`,
          'achievement'
        );
      } else if (!silent) {
        const deptCount = result.departments?.length || departments.length;
        const smtCount = result.smts?.length || smts.length;
        addNotification(
          '🔄 Database Google Sheets Tersinkronisasi',
          `Data ${deptCount} Departemen & ${smtCount} SMT Informa Juanda telah sesuai 100% dengan database cloud.`,
          'info'
        );
      }
    } catch (err: any) {
      console.warn('Sync attempt info:', err.message);
      setSheetsConfig((prev) => ({
        ...prev,
        isSyncing: false,
        status: 'connected',
      }));
    }
  }, [sheetsConfig.sheetUrl, departments.length, smts.length, addNotification]);

  // Initial Sync on load
  useEffect(() => {
    executeDatabaseSync(true);
  }, []);

  // Periodic Auto-sync if enabled
  useEffect(() => {
    if (!sheetsConfig.autoSync) return;
    const intervalSec = Math.max(sheetsConfig.syncIntervalSeconds || 30, 10);
    const interval = setInterval(() => {
      executeDatabaseSync(true);
    }, intervalSec * 1000);

    return () => clearInterval(interval);
  }, [sheetsConfig.autoSync, sheetsConfig.syncIntervalSeconds, executeDatabaseSync]);

  // Quick sale simulation trigger
  const handleSimulateSale = useCallback((amount: number) => {
    // Pick a random department and a random SMT
    const randomDeptIdx = Math.floor(Math.random() * departments.length);
    const randomSMTIdx = Math.floor(Math.random() * smts.length);

    setDepartments((prev) => {
      const updated = [...prev];
      const dept = updated[randomDeptIdx];
      if (dept) {
        updated[randomDeptIdx] = {
          ...dept,
          actual: dept.actual + amount,
          dailyActual: (dept.dailyActual || 0) + amount,
        };
      }
      return updated;
    });

    setSMTs((prev) => {
      const updated = [...prev];
      const smt = updated[randomSMTIdx];
      if (smt) {
        // Split amount into 70% Furniture and 30% Accessories
        const furnPart = Math.round(amount * 0.7);
        const accPart = amount - furnPart;
        const comserAdd = Math.round(amount * 0.04);

        const newActFurn = smt.actualFurniture + furnPart;
        const newActAcc = smt.actualAccessories + accPart;
        const wasQualified = smt.actualFurniture >= smt.targetFurniture && smt.actualAccessories >= smt.targetAccessories;
        const isNowQualified = newActFurn >= smt.targetFurniture && newActAcc >= smt.targetAccessories;

        updated[randomSMTIdx] = {
          ...smt,
          actualFurniture: newActFurn,
          actualAccessories: newActAcc,
          comser: (smt.comser || 0) + comserAdd,
          polis: (smt.polis || 0) + (Math.random() > 0.6 ? 1 : 0),
        };

        // If newly qualified, trigger celebration!
        if (!wasQualified && isNowQualified) {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 },
          });
          addNotification(
            `🎉 INSENTIF QUALIFIED: ${smt.name}!`,
            `SMT ${smt.name} berhasil mencapai 100% Furniture & 100% Accessories! Total penjualan bertambah ${formatRupiah(amount)}.`,
            'achievement'
          );
        }
      }
      return updated;
    });
  }, [departments.length, smts.length, addNotification]);

  // Background auto-POS simulator
  useEffect(() => {
    if (!isSimulating) return;
    const timer = setInterval(() => {
      const randomAmount = Math.floor(Math.random() * 8 + 2) * 1000000; // 2M - 10M
      handleSimulateSale(randomAmount);
    }, 4500);

    return () => clearInterval(timer);
  }, [isSimulating, handleSimulateSale]);

  // Google Sheets manual sync trigger
  const handleTriggerSheetsSync = () => {
    executeDatabaseSync(false);
  };

  // Export PDF Handler
  const handleExportPDF = () => {
    exportToPDF(storeSummary, computedDepartments, computedSMTs);
    addNotification(
      '📄 Laporan PDF Berhasil Dibuat',
      'Laporan resmi kinerja penjualan Informa Juanda Medan telah diunduh ke perangkat Anda.',
      'info'
    );
  };

  // Export Excel Handler
  const handleExportExcel = () => {
    exportToExcel(storeSummary, computedDepartments, computedSMTs);
    addNotification(
      '📊 Laporan Excel (.xlsx) Berhasil Diunduh',
      'Workbook lengkap (Ringkasan, 20 Dept, Performa SMT) siap digunakan.',
      'info'
    );
  };

  // Save SMT edit / creation
  const handleSaveSMT = (savedSMT: SMTPerformance) => {
    setSMTs((prev) => {
      const exists = prev.some((s) => s.id === savedSMT.id);
      if (exists) {
        return prev.map((s) => (s.id === savedSMT.id ? savedSMT : s));
      }
      return [savedSMT, ...prev];
    });

    addNotification(
      'Data SMT Disimpan',
      `Perubahan data target & aktual untuk SMT ${savedSMT.name} telah diperbarui.`,
      'info'
    );
  };

  // Save Department edit
  const handleSaveDepartment = (savedDept: Department) => {
    setDepartments((prev) =>
      prev.map((d) => (d.id === savedDept.id ? savedDept : d))
    );

    addNotification(
      'Data Departemen Disimpan',
      `Target & penjualan untuk departemen ${savedDept.name} telah diperbarui.`,
      'info'
    );
  };

  // Reset to default
  const handleResetData = () => {
    if (window.confirm('Reset data dashboard ke default awal Informa Juanda?')) {
      setDepartments(INITIAL_DEPARTMENTS);
      setSMTs(INITIAL_SMT_LIST);
      localStorage.removeItem('informa_juanda_departments');
      localStorage.removeItem('informa_juanda_smts');
      addNotification('Data Direset', 'Semua data telah dikembalikan ke template awal.', 'info');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1226] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.25),rgba(255,255,255,0))] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] relative overflow-x-hidden">
      {/* Futuristic Background Ambient Glows & Tech Grid */}
      <div className="fixed inset-0 futuristic-grid pointer-events-none opacity-40 z-0" />
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed top-1/3 -right-40 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed -bottom-40 left-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Header Navigation */}
      <Header
        summary={storeSummary}
        onExportPDF={handleExportPDF}
        onExportExcel={handleExportExcel}
        onOpenGoogleSheets={() => setIsSheetsModalOpen(true)}
        onTriggerSync={handleTriggerSheetsSync}
        sheetsConfig={sheetsConfig}
        isSimulating={isSimulating}
        onToggleSimulation={() => setIsSimulating(!isSimulating)}
        notificationSlot={
          <NotificationCenter
            notifications={notifications}
            onMarkAllRead={() =>
              setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
            }
            onClearNotifications={() => setNotifications([])}
            onSendCustomNotification={(title, msg, type) =>
              addNotification(title, msg, type)
            }
          />
        }
      />

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-5 space-y-5 relative z-10">
        {/* TOP SECTION: 3 Columns Grid (Kiri: MTD Store, Tengah: Kontribusi Dept, Kanan: Best & Poor SMT) */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
          {/* Kolom 1 (Kiri): MTD Store (Speedometer Gauge & Defisit Target Toko) */}
          <div className="flex flex-col h-full">
            <SpeedometerGauge
              summary={storeSummary}
              onSimulateSale={handleSimulateSale}
            />
          </div>

          {/* Kolom 2 (Tengah): Kontribusi 20 Departemen (Tampilan Ringkas & Teratur) */}
          <div className="flex flex-col h-full">
            <DepartmentContribution
              departments={computedDepartments}
              onEditDepartment={(dept) => setEditingDept(dept)}
            />
          </div>

          {/* Kolom 3 (Kanan): Best & Poor SMT (Tampilan Sederhana) */}
          <div className="flex flex-col h-full">
            <BestPoorSMT
              smts={computedSMTs}
              onSelectSMT={(smt) => setEditingSMT(smt)}
            />
          </div>
        </section>

        {/* BOTTOM SECTION: Performa SMT (Bergulir Otomatis dari Atas ke Bawah & Mengulang) */}
        <section id="smt-table-container">
          <SMTPerformanceTable
            smts={computedSMTs}
            onEditSMT={(smt) => setEditingSMT(smt)}
            onAddSMT={() => setIsNewSMTOpen(true)}
          />
        </section>

        {/* Footer & Reset Controls */}
        <footer className="pt-6 pb-8 border-t border-cyan-500/20 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            <span className="font-bold text-white tracking-wide">INFORMA JUANDA MEDAN</span>
            <span className="mx-2 text-cyan-500">•</span>
            <span>Dashboard Penjualan Real-Time & Evaluasi Insentif</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleResetData}
              className="text-slate-400 hover:text-red-400 transition-colors"
            >
              Reset Data Default
            </button>
            <span className="text-cyan-500">•</span>
            <span className="font-mono text-[#FFD700] font-medium">
              Format Angka: Rupiah (Tanpa Koma), % (2 Desimal)
            </span>
          </div>
        </footer>
      </main>

      {/* MODALS */}
      {/* 1. Google Sheets Database Sync Modal */}
      <GoogleSheetsIntegrationModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        config={sheetsConfig}
        onSaveConfig={(cfg) => setSheetsConfig(cfg)}
        onTriggerSync={handleTriggerSheetsSync}
        departments={computedDepartments}
        smts={computedSMTs}
        summary={storeSummary}
        onImportData={(importedDepts, importedSMTs, importedSummary) => {
          if (importedDepts && importedDepts.length > 0) {
            setDepartments(importedDepts);
          }
          if (importedSMTs && importedSMTs.length > 0) {
            setSMTs(importedSMTs);
          }
          if (importedSummary) {
            setCustomSummary(importedSummary);
          }
          addNotification(
            '📊 Data Berhasil Diimpor',
            'Data 3 Database (Ringkasan Toko, 20 Departemen & SMT) Informa Juanda telah diperbarui dari database Google Sheets.',
            'achievement'
          );
        }}
      />

      {/* 2. Edit SMT Modal */}
      <EditSMTModal
        isOpen={Boolean(editingSMT) || isNewSMTOpen}
        onClose={() => {
          setEditingSMT(null);
          setIsNewSMTOpen(false);
        }}
        smt={editingSMT}
        isNew={isNewSMTOpen}
        onSave={handleSaveSMT}
      />

      {/* 3. Edit Department Modal */}
      <EditDepartmentModal
        isOpen={Boolean(editingDept)}
        onClose={() => setEditingDept(null)}
        dept={editingDept}
        onSave={handleSaveDepartment}
      />
    </div>
  );
}
