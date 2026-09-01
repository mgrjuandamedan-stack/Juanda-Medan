import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, Download, Upload, RefreshCw, CheckCircle2, 
  AlertCircle, Copy, ExternalLink, Code2, Sparkles, X, Database, ShieldCheck,
  Globe, ArrowRight, PlayCircle, Image, Layers, HelpCircle, Rocket, Server, Check,
  BookOpen, Terminal, Share2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { GoogleSheetsConfig, ComputedDepartment, ComputedSMT, StoreSummary, Department, SMTPerformance } from '../types';
import { generateGoogleSheetsTemplateCSV, exportToExcel } from '../utils/exportUtils';
import { getGoogleDriveDirectImageUrl } from '../utils/formatters';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GoogleSheetsConfig;
  onSaveConfig: (config: GoogleSheetsConfig) => void;
  onTriggerSync: () => void;
  departments: ComputedDepartment[];
  smts: ComputedSMT[];
  summary: StoreSummary;
  onImportData?: (importedDepts: Department[], importedSMTs: SMTPerformance[], importedSummary?: Partial<StoreSummary>) => void;
}

export const GoogleSheetsIntegrationModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onTriggerSync,
  departments,
  smts,
  summary,
  onImportData,
}) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'appscript' | 'deploy' | 'structure'>('sync');
  const [sheetUrl, setSheetUrl] = useState(config.sheetUrl || 'https://docs.google.com/spreadsheets/d/1Rbc8N_-i2BYImnxUdvu1c2CsYRruBD5wpf5kmpwzGDs/edit?usp=sharing');
  const [autoSync, setAutoSync] = useState(config.autoSync ?? true);
  const [syncInterval, setSyncInterval] = useState(config.syncIntervalSeconds || 30);
  const [copiedCode, setCopiedCode] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isLoadingFetch, setIsLoadingFetch] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    exportToExcel(summary, departments, smts);
  };

  const handleDownloadCSV = () => {
    const csvContent = generateGoogleSheetsTemplateCSV(departments, smts);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `INFORMA_JUANDA_DATABASE_TEMPLATE_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSave = () => {
    onSaveConfig({
      sheetUrl,
      autoSync,
      syncIntervalSeconds: syncInterval,
      lastSyncTimestamp: new Date().toISOString(),
    });
    onClose();
  };

  // Parse workbook with smart column & sheet detection
  const parseWorkbookData = (workbook: XLSX.WorkBook) => {
    let parsedDepts: Department[] = [];
    let parsedSMTs: SMTPerformance[] = [];
    let parsedSummary: Partial<StoreSummary> | null = null;

    // 1. Detect Ringkasan Toko Sheet (Store Summary Database)
    const summarySheetName = workbook.SheetNames.find(name => 
      name.toLowerCase().includes('ringkasan') || 
      name.toLowerCase().includes('summary') ||
      name.toLowerCase().includes('toko')
    );

    if (summarySheetName && workbook.Sheets[summarySheetName]) {
      const summarySheet = workbook.Sheets[summarySheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(summarySheet, { header: 1 });
      
      if (rows.length > 0) {
        parsedSummary = {};
        rows.forEach(r => {
          if (!r || !r[0]) return;
          const k = String(r[0]).toLowerCase().trim();
          const v = r[1];
          if (k.includes('kode toko') || k.includes('branch')) parsedSummary!.branchCode = String(v);
          if (k.includes('lokasi') || k.includes('location')) parsedSummary!.location = String(v);
          if (k.includes('tanggal') || k.includes('date')) parsedSummary!.currentDate = String(v);
          if (k.includes('target mtd') && !k.includes('furn') && !k.includes('acc')) parsedSummary!.totalTargetMTD = Number(v);
          if ((k.includes('actual') || k.includes('realisasi')) && k.includes('mtd') && !k.includes('furn') && !k.includes('acc')) parsedSummary!.totalActualMTD = Number(v);
          if (k.includes('target harian') || (k.includes('daily') && k.includes('target'))) parsedSummary!.dailyTarget = Number(v);
          if (k.includes('actual harian') || k.includes('realisasi harian') || (k.includes('daily') && k.includes('act'))) parsedSummary!.dailyActual = Number(v);
          if (k.includes('comser')) parsedSummary!.totalComser = Number(v);
          if (k.includes('polis')) parsedSummary!.totalPolis = Number(v);
          if (k.includes('lolos insentif') || k.includes('qualified')) parsedSummary!.totalQualifiedSMT = Number(v);
        });
      }
    }

    // 2. Detect Department Sheet
    const deptSheetName = workbook.SheetNames.find(name => 
      name.toLowerCase().includes('departemen') || 
      name.toLowerCase().includes('dept') ||
      name.toLowerCase().includes('kontribusi')
    ) || workbook.SheetNames[1];

    if (deptSheetName && workbook.Sheets[deptSheetName]) {
      const deptSheet = workbook.Sheets[deptSheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(deptSheet, { header: 1 });
      
      if (rows.length > 1) {
        const headerRow: string[] = (rows[0] || []).map((h: any) => String(h).toLowerCase());
        
        const nameIdx = headerRow.findIndex(h => h.includes('nama') || h.includes('departemen') || h.includes('dept'));
        const catIdx = headerRow.findIndex(h => h.includes('kategori') || h.includes('cat'));
        const psIdx = headerRow.findIndex(h => h.includes('ps') || h.includes('specialist') || h.includes('pic') || h.includes('person'));
        const targetIdx = headerRow.findIndex(h => h.includes('target') && !h.includes('harian'));
        const actualIdx = headerRow.findIndex(h => (h.includes('actual') || h.includes('realisasi')) && !h.includes('harian'));
        const dTargetIdx = headerRow.findIndex(h => h.includes('harian') && h.includes('target'));
        const dActualIdx = headerRow.findIndex(h => h.includes('harian') && (h.includes('actual') || h.includes('realisasi')));

        parsedDepts = rows.slice(1).filter(r => r && (r[1] || r[0])).map((r, i) => {
          const rawName = nameIdx !== -1 ? String(r[nameIdx] || '') : String(r[1] || `Dept ${i + 1}`);
          const rawCat = catIdx !== -1 ? String(r[catIdx] || 'Furniture') : String(r[2] || 'Furniture');
          const rawPS = psIdx !== -1 ? String(r[psIdx] || '-') : String(r[3] || '-');
          const rawTarget = targetIdx !== -1 ? Number(r[targetIdx]) : Number(r[4]);
          const rawActual = actualIdx !== -1 ? Number(r[actualIdx]) : Number(r[5]);
          const rawDTarget = dTargetIdx !== -1 ? Number(r[dTargetIdx]) : (Number(r[8]) || Math.round((rawTarget || 0) / 30));
          const rawDActual = dActualIdx !== -1 ? Number(r[dActualIdx]) : Number(r[9] || 0);

          return {
            id: `dept-${i + 1}`,
            name: rawName || `Dept ${i + 1}`,
            category: (['Furniture', 'Accessories', 'Commercial', 'Special'].includes(rawCat) ? rawCat : 'Furniture') as any,
            psName: rawPS || '-',
            target: Math.round(Number(rawTarget) || 0),
            actual: Math.round(Number(rawActual) || 0),
            dailyTarget: Math.round(Number(rawDTarget) || 0),
            dailyActual: Math.round(Number(rawDActual) || 0),
          };
        }).filter(d => d.name.trim().length > 0);
      }
    }

    // 3. Detect SMT Sheet
    const smtSheetName = workbook.SheetNames.find(name => 
      name.toLowerCase().includes('smt') || 
      name.toLowerCase().includes('sales') ||
      name.toLowerCase().includes('performa') ||
      name.toLowerCase().includes('insentif')
    ) || workbook.SheetNames[0];

    if (smtSheetName && workbook.Sheets[smtSheetName]) {
      const smtSheet = workbook.Sheets[smtSheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(smtSheet, { header: 1 });
      
      if (rows.length > 1) {
        const headerRow: string[] = (rows[0] || []).map((h: any) => String(h).toLowerCase());

        const nikIdx = headerRow.findIndex(h => h.includes('nik') || h.includes('id'));
        const nameIdx = headerRow.findIndex(h => h.includes('nama') || h.includes('smt') || h.includes('name'));
        const photoIdx = headerRow.findIndex(h => h.includes('foto') || h.includes('drive') || h.includes('link') || h.includes('photo') || h.includes('url') || h.includes('gambar'));
        const targetFurnIdx = headerRow.findIndex(h => h.includes('target') && (h.includes('furn') || h.includes('mebel')));
        const actFurnIdx = headerRow.findIndex(h => (h.includes('act') || h.includes('real')) && (h.includes('furn') || h.includes('mebel')));
        const targetAccIdx = headerRow.findIndex(h => h.includes('target') && (h.includes('acc') || h.includes('aksesoris')));
        const actAccIdx = headerRow.findIndex(h => (h.includes('act') || h.includes('real')) && (h.includes('acc') || h.includes('aksesoris')));
        const comserIdx = headerRow.findIndex(h => h.includes('comser') || h.includes('service') || h.includes('komisi'));
        const polisIdx = headerRow.findIndex(h => h.includes('polis') || h.includes('asuransi') || h.includes('proteksi'));
        const notesIdx = headerRow.findIndex(h => h.includes('catatan') || h.includes('evaluasi') || h.includes('notes'));

        parsedSMTs = rows.slice(1).filter(r => r && (r[1] || r[0])).map((r, i) => {
          const rawNik = nikIdx !== -1 ? String(r[nikIdx] || '') : String(r[0] || `NIK-${1000 + i}`);
          const rawName = nameIdx !== -1 ? String(r[nameIdx] || '') : String(r[1] || `SMT ${i + 1}`);
          
          // Photo column: Google Drive link or direct URL
          let rawPhoto = photoIdx !== -1 ? String(r[photoIdx] || '') : (typeof r[2] === 'string' && r[2].includes('http') ? r[2] : '');
          if (!rawPhoto) {
            rawPhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(rawName)}&background=ffd700&color=000000&bold=true`;
          }

          const rawTargetFurn = targetFurnIdx !== -1 ? Number(r[targetFurnIdx]) : (photoIdx !== -1 && photoIdx < 3 ? Number(r[3]) : Number(r[2]));
          const rawActFurn = actFurnIdx !== -1 ? Number(r[actFurnIdx]) : (photoIdx !== -1 && photoIdx < 4 ? Number(r[4]) : Number(r[3]));
          const rawTargetAcc = targetAccIdx !== -1 ? Number(r[targetAccIdx]) : (photoIdx !== -1 && photoIdx < 6 ? Number(r[6]) : Number(r[5]));
          const rawActAcc = actAccIdx !== -1 ? Number(r[actAccIdx]) : (photoIdx !== -1 && photoIdx < 7 ? Number(r[7]) : Number(r[6]));
          
          const rawComser = comserIdx !== -1 ? Number(r[comserIdx]) : (Number(r[13]) || Number(r[12]) || 0);
          const rawPolis = polisIdx !== -1 ? Number(r[polisIdx]) : (Number(r[14]) || Number(r[13]) || 0);
          const rawNotes = notesIdx !== -1 ? String(r[notesIdx] || '') : String(r[15] || r[14] || '');

          return {
            id: `smt-${i + 1}`,
            nik: rawNik || `NIK-${1000 + i}`,
            name: rawName || `SMT ${i + 1}`,
            photoUrl: getGoogleDriveDirectImageUrl(rawPhoto, rawName),
            targetFurniture: Math.round(Number(rawTargetFurn) || 0),
            actualFurniture: Math.round(Number(rawActFurn) || 0),
            targetAccessories: Math.round(Number(rawTargetAcc) || 0),
            actualAccessories: Math.round(Number(rawActAcc) || 0),
            comser: Math.round(Number(rawComser) || 0),
            polis: Math.round(Number(rawPolis) || 0),
            notes: rawNotes,
          };
        }).filter(s => s.name.trim().length > 0);
      }
    }

    return { parsedDepts, parsedSMTs, parsedSummary };
  };

  // Direct fetch from Google Sheets or Apps Script Web App
  const handleFetchFromLiveSheet = async () => {
    setIsLoadingFetch(true);
    setImportStatus(null);

    try {
      const trimmedUrl = sheetUrl.trim();

      // Case A: Google Apps Script Web App URL (returns direct JSON)
      if (trimmedUrl.includes('script.google.com') && (trimmedUrl.includes('/exec') || trimmedUrl.includes('/dev'))) {
        const res = await fetch(trimmedUrl);
        if (!res.ok) throw new Error('Gagal menghubungi Web App Google Apps Script.');
        const json = await res.json();

        if (json && (json.departments || json.smts || json.summary)) {
          const fetchedDepts = (json.departments || []).map((d: any, idx: number) => ({
            id: d.id || `dept-${idx + 1}`,
            name: d.name || `Dept ${idx + 1}`,
            category: d.category || 'Furniture',
            target: Number(d.target) || 0,
            actual: Number(d.actual) || 0,
            psName: d.psName || '-',
            dailyTarget: Number(d.dailyTarget) || Math.round((Number(d.target) || 0) / 30),
            dailyActual: Number(d.dailyActual) || 0,
          }));

          const fetchedSMTs = (json.smts || []).map((s: any, idx: number) => ({
            id: s.id || `smt-${idx + 1}`,
            nik: s.nik || `NIK-${1000 + idx}`,
            name: s.name || `SMT ${idx + 1}`,
            photoUrl: getGoogleDriveDirectImageUrl(s.photoUrl || s.photo, s.name),
            targetFurniture: Number(s.targetFurniture) || 0,
            actualFurniture: Number(s.actualFurniture) || 0,
            targetAccessories: Number(s.targetAccessories) || 0,
            actualAccessories: Number(s.actualAccessories) || 0,
            comser: Number(s.comser) || 0,
            polis: Number(s.polis) || 0,
            notes: s.notes || '',
          }));

          if (onImportData) {
            onImportData(
              fetchedDepts.length > 0 ? fetchedDepts : departments,
              fetchedSMTs.length > 0 ? fetchedSMTs : smts,
              json.summary || undefined
            );
          }
          const summaryInfo = json.summary ? ` & Ringkasan Toko (${json.summary.branchCode || 'INFORMA JUANDA'})` : '';
          setImportStatus(`✅ Berhasil menyinkronkan 3 Database: Ringkasan Toko${summaryInfo}, ${fetchedDepts.length} Departemen, & ${fetchedSMTs.length} SMT via Google Apps Script!`);
          setIsLoadingFetch(false);
          return;
        }
      }

      // Case B: Standard Google Sheets URL
      const match = trimmedUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      const sheetId = match ? match[1] : null;

      if (!sheetId && !trimmedUrl.includes('http')) {
        throw new Error('URL Google Sheets tidak valid. Pastikan link berisi /d/{ID_SPREADSHEET}/ atau link Google Apps Script /exec');
      }

      // Method 1: Try fetching the full XLSX export
      if (sheetId) {
        try {
          const xlsxUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
          const response = await fetch(xlsxUrl);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
            const { parsedDepts, parsedSMTs, parsedSummary } = parseWorkbookData(workbook);

            if (parsedDepts.length > 0 || parsedSMTs.length > 0 || parsedSummary) {
              if (onImportData) {
                onImportData(
                  parsedDepts.length > 0 ? parsedDepts : departments,
                  parsedSMTs.length > 0 ? parsedSMTs : smts,
                  parsedSummary || undefined
                );
              }
              setImportStatus(`✅ Berhasil menyinkronkan Database Ringkasan Toko, ${parsedDepts.length} Departemen & ${parsedSMTs.length} SMT langsung dari Google Sheets!`);
              setIsLoadingFetch(false);
              return;
            }
          }
        } catch (e) {
          console.warn('XLSX fetch fallback to CSV', e);
        }
      }

      // Method 2: Fetch CSV
      const csvExportUrl = sheetId 
        ? `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`
        : trimmedUrl;

      const csvResponse = await fetch(csvExportUrl);
      if (!csvResponse.ok) {
        throw new Error('Gagal mengambil data dari Google Sheets. Pastikan akses spreadsheet diatur ke "Anyone with the link can view" (Siapa saja yang memiliki link dapat melihat).');
      }

      const csvText = await csvResponse.text();
      parseAndApplyCSV(csvText);
      setImportStatus('✅ Berhasil menyinkronkan data langsung dari Google Sheets!');
    } catch (err: any) {
      setImportStatus(`⚠️ ${err.message || 'Gagal sinkronisasi online. Anda juga dapat menggunakan opsi Upload File Excel/CSV atau Deploy Web App.'}`);
    } finally {
      setIsLoadingFetch(false);
    }
  };

  // Upload XLSX or CSV directly
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const { parsedDepts, parsedSMTs, parsedSummary } = parseWorkbookData(workbook);

        if (parsedDepts.length > 0 || parsedSMTs.length > 0 || parsedSummary) {
          if (onImportData) {
            onImportData(
              parsedDepts.length > 0 ? parsedDepts : departments,
              parsedSMTs.length > 0 ? parsedSMTs : smts,
              parsedSummary || undefined
            );
          }
          setImportStatus(`✅ Berhasil mengimpor Database Ringkasan Toko, ${parsedDepts.length} Departemen & ${parsedSMTs.length} SMT dari file!`);
        } else {
          setImportStatus('⚠️ Format sheet tidak dikenali. Pastikan file memiliki sheet "Ringkasan Toko", "Kontribusi 20 Departemen", atau "Performa SMT".');
        }
      } catch (err: any) {
        setImportStatus(`❌ Gagal membaca file: ${err.message}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const parseAndApplyCSV = (csvText: string) => {
    const lines = csvText.split('\n').filter(l => l.trim().length > 0);
    const newDepts: Department[] = [];
    const newSMTs: SMTPerformance[] = [];

    lines.forEach((line) => {
      const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
      if (cols[0] === 'DEPT') {
        newDepts.push({
          id: cols[1] || `dept-${newDepts.length + 1}`,
          name: cols[2] || '',
          category: (cols[3] as any) || 'Furniture',
          target: Number(cols[4]) || 0,
          actual: Number(cols[5]) || 0,
          psName: cols[8] || '-',
          dailyTarget: Math.round((Number(cols[4]) || 0) / 30),
          dailyActual: Math.round((Number(cols[5]) || 0) / 30),
        });
      } else if (cols[0] === 'SMT') {
        const rawPhoto = cols[11] || cols[10] || '';
        newSMTs.push({
          id: cols[1] || `smt-${newSMTs.length + 1}`,
          name: cols[2] || '',
          nik: cols[3] || '',
          photoUrl: getGoogleDriveDirectImageUrl(rawPhoto, cols[2]),
          targetFurniture: Number(cols[4]) || 0,
          actualFurniture: Number(cols[5]) || 0,
          targetAccessories: Number(cols[6]) || 0,
          actualAccessories: Number(cols[7]) || 0,
          comser: Number(cols[9]) || 0,
          polis: Number(cols[10]) || 0,
        });
      }
    });

    if (newDepts.length > 0 || newSMTs.length > 0) {
      if (onImportData) {
        onImportData(
          newDepts.length > 0 ? newDepts : departments,
          newSMTs.length > 0 ? newSMTs : smts
        );
      }
    }
  };

  // Google Apps Script code for Web App deployment & JSON API
  const appsScriptCode = `/**
 * INFORMA JUANDA MEDAN - Google Apps Script Web App API
 * Termasuk 3 Database: Ringkasan Toko, Kontribusi 20 Departemen, & Performa SMT
 * 
 * CARA MENGGUNAKAN:
 * 1. Di Google Sheets, buka menu: Extensions (Ekstensi) > Apps Script
 * 2. Hapus semua kode yang ada, tempel seluruh kode ini ke dalam Code.gs
 * 3. Klik tombol Save (Ikon Disket)
 * 4. Klik tombol "Deploy" (Pojok Kanan Atas) > "New deployment"
 * 5. Klik ikon Gerigi (Select type) > Pilih "Web app"
 * 6. Isi Konfigurasi:
 *    - Description: Informa Juanda Live API (Ringkasan Toko + Dept + SMT)
 *    - Execute as: Me (email Anda)
 *    - Who has access: Anyone (Siapa saja)  <-- PENTING!
 * 7. Klik "Deploy", izinkan akses Google Account jika diminta.
 * 8. Salin "Web app URL" (akhiran /exec) dan tempel ke Dashboard!
 */

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // ====================================================
    // 1. BACA DATABASE: RINGKASAN TOKO (STORE SUMMARY)
    // ====================================================
    var summarySheet = ss.getSheetByName("Ringkasan Toko") || ss.getSheetByName("Summary") || ss.getSheetByName("Ringkasan");
    var summaryData = summarySheet ? summarySheet.getDataRange().getValues() : [];
    
    var summary = {
      storeName: "INFORMA JUANDA MEDAN",
      branchCode: "INFORMA-JUANDA-01",
      location: "Medan, Sumatera Utara",
      currentDate: Utilities.formatDate(new Date(), "Asia/Jakarta", "dd MMMM yyyy"),
      monthName: Utilities.formatDate(new Date(), "Asia/Jakarta", "MMMM"),
      year: new Date().getFullYear(),
      totalTargetMTD: 0,
      totalActualMTD: 0,
      kekuranganMTD: 0,
      mtdPercent: 0,
      dailyTarget: 0,
      dailyActual: 0,
      dailyKekurangan: 0,
      dailyPercent: 0,
      totalComser: 0,
      totalPolis: 0,
      totalQualifiedSMT: 0
    };

    // Ekstraksi Key-Value jika Sheet Ringkasan Toko ada
    if (summaryData.length > 0) {
      for (var s = 0; s < summaryData.length; s++) {
        var key = String(summaryData[s][0] || "").toLowerCase().trim();
        var val = summaryData[s][1];
        if (!key) continue;

        if (key.includes("kode toko") || key.includes("branch code")) {
          summary.branchCode = String(val || summary.branchCode);
        } else if (key.includes("lokasi") || key.includes("location")) {
          summary.location = String(val || summary.location);
        } else if (key.includes("tanggal") || key.includes("date")) {
          summary.currentDate = String(val || summary.currentDate);
        } else if (key.includes("target mtd") && !key.includes("furn") && !key.includes("acc")) {
          summary.totalTargetMTD = Number(val) || 0;
        } else if ((key.includes("actual") || key.includes("realisasi")) && key.includes("mtd") && !key.includes("furn") && !key.includes("acc")) {
          summary.totalActualMTD = Number(val) || 0;
        } else if (key.includes("kekurangan mtd")) {
          summary.kekuranganMTD = Number(val) || 0;
        } else if (key.includes("pencapaian mtd") || key.includes("mtd (%)")) {
          summary.mtdPercent = Number(val) || 0;
        } else if (key.includes("target harian") || (key.includes("daily") && key.includes("target"))) {
          summary.dailyTarget = Number(val) || 0;
        } else if (key.includes("actual harian") || key.includes("realisasi harian") || (key.includes("daily") && key.includes("act"))) {
          summary.dailyActual = Number(val) || 0;
        } else if (key.includes("kekurangan harian")) {
          summary.dailyKekurangan = Number(val) || 0;
        } else if (key.includes("pencapaian harian") || key.includes("daily (%)")) {
          summary.dailyPercent = Number(val) || 0;
        } else if (key.includes("comser")) {
          summary.totalComser = Number(val) || 0;
        } else if (key.includes("polis")) {
          summary.totalPolis = Number(val) || 0;
        } else if (key.includes("lolos insentif") || key.includes("qualified")) {
          summary.totalQualifiedSMT = Number(val) || 0;
        }
      }
    }
    
    // ====================================================
    // 2. BACA DATABASE: KONTRIBUSI 20 DEPARTEMEN
    // ====================================================
    var deptSheet = ss.getSheetByName("Kontribusi 20 Departemen") || ss.getSheetByName("Departemen") || ss.getSheets()[1];
    var deptData = deptSheet ? deptSheet.getDataRange().getValues() : [];
    var departments = [];
    var sumDeptTarget = 0;
    var sumDeptActual = 0;
    var sumDailyTarget = 0;
    var sumDailyActual = 0;
    
    if (deptData.length > 1) {
      for (var j = 1; j < deptData.length; j++) {
        var dRow = deptData[j];
        if (!dRow[1] && !dRow[0]) continue;
        
        var dTarget = Number(dRow[4]) || 0;
        var dActual = Number(dRow[5]) || 0;
        var dDailyTar = Number(dRow[8]) || Number(dRow[6]) || Math.round(dTarget / 30);
        var dDailyAct = Number(dRow[9]) || Number(dRow[7]) || 0;
        
        sumDeptTarget += dTarget;
        sumDeptActual += dActual;
        sumDailyTarget += dDailyTar;
        sumDailyActual += dDailyAct;
        
        departments.push({
          id: "dept-" + j,
          name: String(dRow[1] || "Dept " + j),
          category: String(dRow[2] || "Furniture"),
          psName: String(dRow[3] || "-"),
          target: dTarget,
          actual: dActual,
          dailyTarget: dDailyTar,
          dailyActual: dDailyAct
        });
      }
    }
    
    // ====================================================
    // 3. BACA DATABASE: PERFORMA SMT & INSENTIF
    // ====================================================
    var smtSheet = ss.getSheetByName("Performa SMT & Insentif") || ss.getSheetByName("Performa SMT") || ss.getSheets()[0];
    var smtData = smtSheet ? smtSheet.getDataRange().getValues() : [];
    var smts = [];
    var sumComser = 0;
    var sumPolis = 0;
    var qualifiedCount = 0;
    
    if (smtData.length > 1) {
      for (var i = 1; i < smtData.length; i++) {
        var row = smtData[i];
        if (!row[0] && !row[1]) continue;
        
        var targetFurn = Number(row[3]) || 0;
        var actFurn = Number(row[4]) || 0;
        var targetAcc = Number(row[6]) || 0;
        var actAcc = Number(row[7]) || 0;
        var sComser = Number(row[13]) || Number(row[8]) || 0;
        var sPolis = Number(row[14]) || Number(row[9]) || 0;
        var notes = String(row[15] || row[10] || "");
        
        sumComser += sComser;
        sumPolis += sPolis;
        
        var furnAchieved = targetFurn > 0 ? (actFurn >= targetFurn) : true;
        var accAchieved = targetAcc > 0 ? (actAcc >= targetAcc) : true;
        if (furnAchieved && accAchieved && (targetFurn > 0 || targetAcc > 0)) {
          qualifiedCount++;
        }
        
        smts.push({
          id: "smt-" + i,
          nik: String(row[0] || "NIK-" + (1000 + i)),
          name: String(row[1] || "SMT " + i),
          photoUrl: String(row[2] || ""),
          targetFurniture: targetFurn,
          actualFurniture: actFurn,
          targetAccessories: targetAcc,
          actualAccessories: actAcc,
          comser: sComser,
          polis: sPolis,
          notes: notes
        });
      }
    }

    // Auto-calculate store metrics if not explicitly set in Ringkasan Toko sheet
    if (summary.totalTargetMTD === 0 && sumDeptTarget > 0) {
      summary.totalTargetMTD = sumDeptTarget;
    }
    if (summary.totalActualMTD === 0 && sumDeptActual > 0) {
      summary.totalActualMTD = sumDeptActual;
    }
    if (summary.dailyTarget === 0 && sumDailyTarget > 0) {
      summary.dailyTarget = sumDailyTarget;
    }
    if (summary.dailyActual === 0 && sumDailyActual > 0) {
      summary.dailyActual = sumDailyActual;
    }
    if (summary.totalComser === 0 && sumComser > 0) {
      summary.totalComser = sumComser;
    }
    if (summary.totalPolis === 0 && sumPolis > 0) {
      summary.totalPolis = sumPolis;
    }
    if (summary.totalQualifiedSMT === 0 && qualifiedCount > 0) {
      summary.totalQualifiedSMT = qualifiedCount;
    }
    
    summary.kekuranganMTD = Math.max(0, summary.totalTargetMTD - summary.totalActualMTD);
    summary.mtdPercent = summary.totalTargetMTD > 0 ? (summary.totalActualMTD / summary.totalTargetMTD) * 100 : 0;
    summary.dailyKekurangan = Math.max(0, summary.dailyTarget - summary.dailyActual);
    summary.dailyPercent = summary.dailyTarget > 0 ? (summary.dailyActual / summary.dailyTarget) * 100 : 0;
    
    // ====================================================
    // 4. RETURN RESPONSE JSON
    // ====================================================
    var responseData = {
      status: "success",
      store: summary.storeName,
      branchCode: summary.branchCode,
      location: summary.location,
      updatedAt: new Date().toISOString(),
      summary: summary,
      departments: departments,
      smts: smts
    };
    
    return ContentService.createTextOutput(JSON.stringify(responseData))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  // Support POST webhook triggers
  return doGet(e);
}

function onEdit(e) {
  Logger.log("Spreadsheet Informa Juanda diedit pada: " + new Date());
}`;

  const copyAppsScript = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-[#151515] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Pusat Integrasi &amp; Deploy Google Sheets
                <span className="px-2 py-0.5 rounded text-[10px] bg-[#FFD700] text-black font-extrabold uppercase">
                  Informa Juanda
                </span>
              </h3>
              <p className="text-[11px] text-white/50">
                Sinkronisasi Spreadsheet Real-Time, Google Apps Script API, dan Panduan Deploy Web
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-black/40 px-6 gap-2 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'sync'
                ? 'border-[#FFD700] text-[#FFD700] bg-white/5'
                : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Database className="w-4 h-4" />
            1. Koneksi &amp; Tarik Data Live
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('appscript')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'appscript'
                ? 'border-purple-400 text-purple-400 bg-white/5'
                : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Code2 className="w-4 h-4" />
            2. Google Apps Script Web App
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('deploy')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'deploy'
                ? 'border-blue-400 text-blue-400 bg-white/5'
                : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Rocket className="w-4 h-4" />
            3. Cara Deploy Website
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('structure')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'structure'
                ? 'border-emerald-400 text-emerald-400 bg-white/5'
                : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-4 h-4" />
            4. Format Database &amp; Foto Drive
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 text-xs">
          {/* Notification Alert Message */}
          {importStatus && (
            <div className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
              importStatus.startsWith('✅') 
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' 
                : 'bg-amber-500/20 border-amber-500/30 text-amber-300'
            }`}>
              <div className="flex items-center gap-2">
                {importStatus.startsWith('✅') ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{importStatus}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setImportStatus(null)}
                className="text-white/40 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* TAB 1: SYNC & TARIK DATA LIVE */}
          {activeTab === 'sync' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-emerald-400 text-xs">
                    Koneksi Cloud Siap Sinkronisasi
                  </div>
                  <p className="text-[11px] text-white/60 mt-0.5 leading-relaxed">
                    Masukkan link Google Sheets publik Anda atau URL Google Apps Script Web App (/exec) di bawah untuk menarik data target 20 departemen dan performa SMT secara real-time.
                  </p>
                </div>
              </div>

              {/* URL Input Box */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <label className="block text-xs font-bold text-white">
                  Google Sheets Share Link / Google Apps Script Web App URL
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1Rbc8N_-i2BYImnxUdvu1c2CsYRruBD5wpf5kmpwzGDs/edit?usp=sharing"
                    className="flex-1 px-3.5 py-2.5 rounded-lg bg-black/70 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#FFD700] font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleFetchFromLiveSheet}
                    disabled={isLoadingFetch}
                    className="px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shrink-0 shadow-lg disabled:opacity-50"
                    title="Tarik data terkini dari spreadsheet"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingFetch ? 'animate-spin' : ''}`} />
                    {isLoadingFetch ? 'Mengambil Data...' : 'Tarik Data Sekarang'}
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-white/50 gap-2">
                  <span>
                    💡 Pastikan akses Spreadsheet diatur ke: <strong>&quot;Anyone with the link can view&quot;</strong>.
                  </span>
                  <a
                    href={sheetUrl.includes('http') ? sheetUrl : 'https://docs.google.com/spreadsheets'}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#FFD700] hover:underline flex items-center gap-1 shrink-0 font-medium"
                  >
                    Buka Google Sheets di Tab Baru
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Auto Sync Settings */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <h4 className="font-bold text-white text-xs flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 text-[#FFD700]" />
                  Pengaturan Auto-Sync Real-Time
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2.5 p-3 rounded-lg bg-black/40 border border-white/5">
                    <input
                      type="checkbox"
                      id="autoSyncCheck"
                      checked={autoSync}
                      onChange={(e) => setAutoSync(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#FFD700] bg-black/60 border-white/20 cursor-pointer"
                    />
                    <label htmlFor="autoSyncCheck" className="text-xs font-semibold text-white/90 cursor-pointer">
                      Aktifkan Auto-Sync Otomatis
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-xs text-white/60">Interval Refresh:</span>
                    <select
                      value={syncInterval}
                      onChange={(e) => setSyncInterval(Number(e.target.value))}
                      className="px-3 py-1.5 rounded-lg bg-black border border-white/20 text-xs font-bold text-[#FFD700] focus:outline-none focus:border-[#FFD700]"
                    >
                      <option value={10}>Setiap 10 Detik (Live POS)</option>
                      <option value={30}>Setiap 30 Detik</option>
                      <option value={60}>Setiap 1 Menit</option>
                      <option value={300}>Setiap 5 Menit</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Quick Actions: Download Template & Manual File Upload */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-white text-xs">Unduh Format Siap Pakai atau Upload File</div>
                  <div className="text-[11px] text-white/50">Dapat juga mengimpor file Excel (.xlsx) atau CSV secara offline</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-semibold text-xs flex items-center gap-1.5 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh Excel Template (.xlsx)
                  </button>
                  <div className="relative">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-[#FFD700]/10 hover:bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30 font-semibold text-xs flex items-center gap-1.5 transition-all"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Impor File Excel/CSV
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE APPS SCRIPT WEB APP */}
          {activeTab === 'appscript' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-purple-300 text-xs flex items-center gap-2">
                    <Code2 className="w-4 h-4" />
                    Google Apps Script API (Web App Endpoint)
                  </div>
                  <button
                    type="button"
                    onClick={copyAppsScript}
                    className="px-3 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-colors border border-purple-500/30"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Kode Tersalin!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Salin Seluruh Script
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  Dengan membuat Web App melalui Google Apps Script, Google Sheets Anda akan berfungsi sebagai REST API backend gratis dengan response format JSON ultra cepat tanpa hambatan CORS.
                </p>
              </div>

              {/* Step by step Deploy Guide */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                <h4 className="font-bold text-white text-xs flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-[#FFD700]" />
                  Langkah-Langkah Deploy Web App di Google Sheets:
                </h4>
                <ol className="space-y-2.5 text-[11px] text-white/80 list-decimal list-inside">
                  <li className="p-2 rounded bg-white/5 border border-white/5">
                    <strong>Buka Spreadsheet Anda</strong> &gt; Klik menu <strong>Extensions (Ekstensi)</strong> &gt; pilih <strong>Apps Script</strong>.
                  </li>
                  <li className="p-2 rounded bg-white/5 border border-white/5">
                    Hapus semua kode di dalam editor <code className="text-purple-300">Code.gs</code>, lalu <strong>Paste / Tempel kode script di bawah</strong>.
                  </li>
                  <li className="p-2 rounded bg-white/5 border border-white/5">
                    Klik tombol <strong>Save (Ikon Disket)</strong> di bilah menu Apps Script.
                  </li>
                  <li className="p-2 rounded bg-white/5 border border-white/5">
                    Klik tombol biru <strong>Deploy (Terapkan)</strong> di pojok kanan atas &gt; Pilih <strong>New deployment (Deployment baru)</strong>.
                  </li>
                  <li className="p-2 rounded bg-white/5 border border-white/5">
                    Klik ikon Gerigi (Select type) &gt; Pilih <strong>Web app</strong>. Konfigurasikan:
                    <div className="ml-4 mt-1 space-y-1 font-mono text-[10px] text-[#FFD700]">
                      <div>• Description: Informa Juanda Live API</div>
                      <div>• Execute as: Me (email akun Anda)</div>
                      <div className="text-emerald-400 font-bold">• Who has access: Anyone (Siapa saja)  ← WAJIB PILIH INI</div>
                    </div>
                  </li>
                  <li className="p-2 rounded bg-white/5 border border-white/5">
                    Klik <strong>Deploy</strong> &gt; Berikan izin akses (Authorize access) jika muncul pop-up Google.
                  </li>
                  <li className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-bold">
                    Salin <strong>Web App URL</strong> yang dihasilkan (berakhiran <code className="text-white">/exec</code>) lalu tempel ke tab &quot;1. Koneksi &amp; Tarik Data Live&quot; pada dashboard ini!
                  </li>
                </ol>
              </div>

              {/* Code Viewer */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-white/60 flex items-center justify-between">
                  <span>Source Code: Code.gs</span>
                  <span>JavaScript / Google Apps Script</span>
                </div>
                <pre className="p-3.5 rounded-xl bg-black border border-white/10 text-[11px] text-emerald-400 font-mono overflow-x-auto max-h-56 custom-scrollbar leading-relaxed">
                  {appsScriptCode}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: CARA DEPLOY WEBSITE */}
          {activeTab === 'deploy' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-2">
                <div className="font-bold text-blue-300 text-xs flex items-center gap-2">
                  <Rocket className="w-4 h-4" />
                  Panduan Deploy Aplikasi Web Informa Juanda
                </div>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  Aplikasi ini merupakan single-page dashboard full-stack yang dapat di-deploy secara online agar dapat diakses dari HP, Tablet, Laptop Store Manager, dan Smart TV Display toko secara bersamaan.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Method 1: Google AI Studio Share / Cloud Run */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <Share2 className="w-4 h-4" />
                    Opsi 1: Google AI Studio / Cloud Run (Paling Cepat)
                  </div>
                  <p className="text-[11px] text-white/60">
                    Aplikasi ini sudah berjalan di Google Cloud Run container.
                  </p>
                  <ol className="text-[11px] text-white/80 space-y-1.5 list-decimal list-inside pl-1">
                    <li>Klik menu <strong>Share / Bagikan</strong> di pojok kanan atas tampilan AI Studio.</li>
                    <li>Pilih <strong>Publish / Create Public Link</strong>.</li>
                    <li>Anda akan mendapatkan URL Web resmi (misal: <code className="text-emerald-300">https://ais-pre-...run.app</code>) yang dapat dibuka oleh seluruh tim.</li>
                  </ol>
                </div>

                {/* Method 2: Vercel / Netlify / GitHub */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                    <Globe className="w-4 h-4" />
                    Opsi 2: Deploy ke Vercel / Netlify (Custom Domain)
                  </div>
                  <p className="text-[11px] text-white/60">
                    Untuk menggunakan domain toko khusus (contoh: <code className="text-blue-200">informa-juanda.com</code>).
                  </p>
                  <ol className="text-[11px] text-white/80 space-y-1.5 list-decimal list-inside pl-1">
                    <li>Export project ke <strong>GitHub</strong> atau unduh file <strong>ZIP</strong> dari menu Settings.</li>
                    <li>Buka <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-blue-300 underline">Vercel.com</a> atau Netlify &gt; Klik <strong>Add New Project</strong>.</li>
                    <li>Build Command: <code className="text-white font-mono bg-black px-1.5 py-0.5 rounded">npm run build</code></li>
                    <li>Output Directory: <code className="text-white font-mono bg-black px-1.5 py-0.5 rounded">dist</code></li>
                    <li>Klik <strong>Deploy</strong> (Siap dalam 30 detik).</li>
                  </ol>
                </div>
              </div>

              {/* Display Smart TV Guide */}
              <div className="p-4 rounded-xl bg-[#FFD700]/10 border border-[#FFD700]/20 space-y-2">
                <div className="font-bold text-[#FFD700] text-xs flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Tips: Tampilan Display TV Toko Informa Juanda
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  Buka link website yang sudah di-deploy pada browser Smart TV di area kasir atau customer lounge, tekan tombol <strong>F11 (Fullscreen)</strong>, dan aktifkan <strong>Auto-POS Simulation</strong> atau <strong>Auto-Sync 10 detik</strong> agar leaderboard SMT &amp; target toko berputar otomatis secara interaktif.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: FORMAT DATABASE & LINK DRIVE */}
          {activeTab === 'structure' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent border border-[#FFD700]/20 space-y-3">
                <div className="flex items-center gap-2 text-[#FFD700] font-bold text-xs">
                  <Sparkles className="w-4 h-4" />
                  Struktur 3 Database Spreadsheet, Ringkasan Toko &amp; Foto Drive
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                  {/* Box 1: Ringkasan Toko Sheet */}
                  <div className="p-3 rounded-lg bg-black/40 border border-amber-500/20 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-amber-300">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                      Sheet 1: &quot;Ringkasan Toko&quot;
                    </div>
                    <p className="text-white/60 leading-relaxed">
                      Format Parameter Toko (Key-Value):
                    </p>
                    <div className="p-2 rounded bg-black/60 font-mono text-[10px] text-amber-200/90 space-y-0.5">
                      <div>• Kode Toko | Lokasi | Tanggal</div>
                      <div>• Target MTD | Actual MTD</div>
                      <div>• Kekurangan MTD | Pencapaian MTD</div>
                      <div>• Target Harian | Actual Harian</div>
                      <div>• Comser | Polis | Lolos Insentif</div>
                    </div>
                  </div>

                  {/* Box 2: Dept Sheet */}
                  <div className="p-3 rounded-lg bg-black/40 border border-emerald-500/20 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      Sheet 2: &quot;Kontribusi 20 Departemen&quot;
                    </div>
                    <p className="text-white/60 leading-relaxed">
                      Susunan kolom yang dibaca:
                    </p>
                    <div className="p-2 rounded bg-black/60 font-mono text-[10px] text-emerald-300/90 space-y-0.5">
                      <div>A. No | B. Nama Departemen</div>
                      <div>C. Kategori (Furniture/Accessories)</div>
                      <div>D. Nama PS (Product Specialist)</div>
                      <div>E. Target MTD | F. Actual Sales MTD</div>
                      <div>G. Target Harian | H. Actual Harian</div>
                    </div>
                  </div>

                  {/* Box 3: SMT Sheet */}
                  <div className="p-3 rounded-lg bg-black/40 border border-blue-500/20 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-blue-300">
                      <Image className="w-3.5 h-3.5 text-blue-400" />
                      Sheet 3: &quot;Performa SMT &amp; Insentif&quot;
                    </div>
                    <p className="text-white/60 leading-relaxed">
                      Susunan kolom yang dibaca:
                    </p>
                    <div className="p-2 rounded bg-black/60 font-mono text-[10px] text-[#FFD700]/90 space-y-0.5">
                      <div>A. NIK | B. Nama SMT</div>
                      <div className="text-blue-300 font-bold">C. Link Foto Google Drive</div>
                      <div>D. Target Furn | E. Actual Furn</div>
                      <div>G. Target Acc | H. Actual Acc</div>
                      <div>I. Comser | J. Polis | K. Catatan</div>
                    </div>
                  </div>
                </div>

                {/* Google Drive Photo Instruction */}
                <div className="p-3.5 rounded-lg bg-blue-500/10 border border-blue-500/20 space-y-2 text-[11px]">
                  <div className="font-bold text-blue-300 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    Cara Memasang Link Foto SMT dari Google Drive:
                  </div>
                  <ol className="list-decimal list-inside text-white/70 space-y-1 pl-1">
                    <li>Upload foto SMT ke folder Google Drive toko Anda.</li>
                    <li>Klik kanan foto &gt; <strong>Bagikan (Share)</strong> &gt; Ubah Akses Umum menjadi <strong>&quot;Siapa saja yang memiliki link dapat melihat&quot; (Anyone with the link can view)</strong>.</li>
                    <li>Klik <strong>Salin Link (Copy Link)</strong> (Contoh: <code className="text-blue-200">https://drive.google.com/file/d/1ABCXYZ.../view?usp=sharing</code>).</li>
                    <li>Tempelkan link ke kolom <strong>&quot;Link Foto Google Drive&quot;</strong> (Kolom C) di Spreadsheet. Dashboard secara otomatis mengonversi link menjadi foto profil jernih!</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#151515] border-t border-white/10 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              handleFetchFromLiveSheet();
            }}
            className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 font-medium text-xs flex items-center gap-2 border border-white/10 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#FFD700]" />
            Tarik Data Spreadsheet
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 font-medium text-xs border border-white/10 transition-colors"
            >
              Tutup
            </button>
            <button
              type="button"
              id="btn-save-sheets-config"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg bg-[#FFD700] hover:bg-[#ffe234] text-black font-bold text-xs shadow transition-colors"
            >
              Simpan &amp; Hubungkan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
