import * as XLSX from 'xlsx';
import { Department, SMTPerformance, StoreSummary } from '../types';
import { getGoogleDriveDirectImageUrl } from './formatters';

export interface SyncResult {
  departments?: Department[];
  smts?: SMTPerformance[];
  summary?: Partial<StoreSummary>;
  source: string;
}

/**
 * Parse an Excel/Sheets workbook into structured Informa Juanda datasets
 */
export function parseWorkbookData(workbook: XLSX.WorkBook): {
  parsedDepts: Department[];
  parsedSMTs: SMTPerformance[];
  parsedSummary: Partial<StoreSummary> | null;
} {
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
  ) || (workbook.SheetNames.length > 1 ? workbook.SheetNames[1] : undefined);

  if (deptSheetName && workbook.Sheets[deptSheetName]) {
    const deptSheet = workbook.Sheets[deptSheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(deptSheet, { header: 1 });
    
    if (rows.length > 1) {
      const header = rows[0] || [];
      const nameIdx = header.findIndex((h: any) => /nama|departemen|dept/i.test(String(h)));
      const catIdx = header.findIndex((h: any) => /kategori|category/i.test(String(h)));
      const psIdx = header.findIndex((h: any) => /ps|person|pic|spv/i.test(String(h)));
      const targetIdx = header.findIndex((h: any) => /target mtd|target/i.test(String(h)));
      const actIdx = header.findIndex((h: any) => /actual|realisasi|act/i.test(String(h)));
      const dailyTarIdx = header.findIndex((h: any) => /target harian|daily target/i.test(String(h)));
      const dailyActIdx = header.findIndex((h: any) => /actual harian|daily act/i.test(String(h)));

      parsedDepts = rows.slice(1).map((r, i) => {
        if (!r || r.length === 0 || (!r[0] && !r[1])) return null;
        
        const rawName = nameIdx !== -1 ? r[nameIdx] : r[1];
        const rawCat = catIdx !== -1 ? r[catIdx] : r[2];
        const rawPs = psIdx !== -1 ? r[psIdx] : r[3];
        const rawTarget = targetIdx !== -1 ? Number(r[targetIdx]) : (Number(r[4]) || 0);
        const rawAct = actIdx !== -1 ? Number(r[actIdx]) : (Number(r[5]) || 0);
        const rawDailyTar = dailyTarIdx !== -1 ? Number(r[dailyTarIdx]) : (Number(r[8]) || Number(r[6]) || Math.round(rawTarget / 30));
        const rawDailyAct = dailyActIdx !== -1 ? Number(r[dailyActIdx]) : (Number(r[9]) || Number(r[7]) || 0);

        return {
          id: `dept-${i + 1}`,
          name: String(rawName || `Dept ${i + 1}`).trim(),
          category: (rawCat as any) || 'Furniture',
          target: Math.round(Number(rawTarget) || 0),
          actual: Math.round(Number(rawAct) || 0),
          psName: String(rawPs || '-').trim(),
          dailyTarget: Math.round(Number(rawDailyTar) || Math.round(Number(rawTarget) / 30)),
          dailyActual: Math.round(Number(rawDailyAct) || 0),
        };
      }).filter((d): d is Department => d !== null && d.name.length > 0);
    }
  }

  // 3. Detect SMT Sheet
  const smtSheetName = workbook.SheetNames.find(name => 
    name.toLowerCase().includes('smt') || 
    name.toLowerCase().includes('sales') ||
    name.toLowerCase().includes('insentif')
  ) || workbook.SheetNames[0];

  if (smtSheetName && workbook.Sheets[smtSheetName]) {
    const smtSheet = workbook.Sheets[smtSheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(smtSheet, { header: 1 });
    
    if (rows.length > 1) {
      const header = rows[0] || [];
      const nikIdx = header.findIndex((h: any) => /nik/i.test(String(h)));
      const nameIdx = header.findIndex((h: any) => /nama|smt/i.test(String(h)));
      const photoIdx = header.findIndex((h: any) => /foto|drive|photo|image|gambar/i.test(String(h)));
      const targetFurnIdx = header.findIndex((h: any) => /target furn/i.test(String(h)));
      const actFurnIdx = header.findIndex((h: any) => /act.*furn|real.*furn/i.test(String(h)));
      const targetAccIdx = header.findIndex((h: any) => /target acc/i.test(String(h)));
      const actAccIdx = header.findIndex((h: any) => /act.*acc|real.*acc/i.test(String(h)));
      const comserIdx = header.findIndex((h: any) => /comser/i.test(String(h)));
      const polisIdx = header.findIndex((h: any) => /polis/i.test(String(h)));
      const notesIdx = header.findIndex((h: any) => /catatan|notes|status/i.test(String(h)));

      parsedSMTs = rows.slice(1).map((r, i) => {
        if (!r || r.length === 0 || (!r[0] && !r[1])) return null;

        const rawNik = String(nikIdx !== -1 ? r[nikIdx] : r[0] || `NIK-${1000 + i}`).trim();
        const rawName = String(nameIdx !== -1 ? r[nameIdx] : r[1] || `SMT ${i + 1}`).trim();
        const rawPhoto = String(photoIdx !== -1 ? r[photoIdx] : r[2] || '').trim();
        const rawTargetFurn = targetFurnIdx !== -1 ? Number(r[targetFurnIdx]) : (Number(r[3]) || 0);
        const rawActFurn = actFurnIdx !== -1 ? Number(r[actFurnIdx]) : (Number(r[4]) || 0);
        const rawTargetAcc = targetAccIdx !== -1 ? Number(r[targetAccIdx]) : (Number(r[6]) || 0);
        const rawActAcc = actAccIdx !== -1 ? Number(r[actAccIdx]) : (Number(r[7]) || 0);
        
        const rawComser = comserIdx !== -1 ? Number(r[comserIdx]) : (Number(r[13]) || Number(r[8]) || 0);
        const rawPolis = polisIdx !== -1 ? Number(r[polisIdx]) : (Number(r[14]) || Number(r[9]) || 0);
        const rawNotes = notesIdx !== -1 ? String(r[notesIdx] || '') : String(r[15] || r[10] || '');

        const item: SMTPerformance = {
          id: `smt-${i + 1}`,
          nik: rawNik,
          name: rawName,
          photoUrl: getGoogleDriveDirectImageUrl(rawPhoto, rawName),
          targetFurniture: Math.round(Number(rawTargetFurn) || 0),
          actualFurniture: Math.round(Number(rawActFurn) || 0),
          targetAccessories: Math.round(Number(rawTargetAcc) || 0),
          actualAccessories: Math.round(Number(rawActAcc) || 0),
          comser: Math.round(Number(rawComser) || 0),
          polis: Math.round(Number(rawPolis) || 0),
          notes: rawNotes,
        };
        return item;
      }).filter((s): s is SMTPerformance => s !== null && Boolean(s.name && s.name.length > 0));
    }
  }

  return { parsedDepts, parsedSMTs, parsedSummary };
}

/**
 * Fetch and synchronize data from Google Sheets or Apps Script Web App
 */
export async function fetchLiveDatabase(url: string): Promise<SyncResult> {
  const trimmedUrl = url.trim();
  const cacheBuster = `_t=${Date.now()}`;

  // 1. Google Apps Script Web App URL
  if (trimmedUrl.includes('script.google.com') && (trimmedUrl.includes('/exec') || trimmedUrl.includes('/dev'))) {
    const separator = trimmedUrl.includes('?') ? '&' : '?';
    const fetchUrl = `${trimmedUrl}${separator}${cacheBuster}`;
    const res = await fetch(fetchUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    if (!res.ok) throw new Error('Gagal menghubungi Web App Google Apps Script.');
    const json = await res.json();

    if (json && (json.departments || json.smts || json.summary)) {
      const fetchedDepts = (json.departments || []).map((d: any, idx: number) => ({
        id: d.id || `dept-${idx + 1}`,
        name: d.name || `Dept ${idx + 1}`,
        category: d.category || 'Furniture',
        target: Math.round(Number(d.target) || 0),
        actual: Math.round(Number(d.actual) || 0),
        psName: d.psName || '-',
        dailyTarget: Math.round(Number(d.dailyTarget) || Math.round((Number(d.target) || 0) / 30)),
        dailyActual: Math.round(Number(d.dailyActual) || 0),
      }));

      const fetchedSMTs = (json.smts || []).map((s: any, idx: number) => ({
        id: s.id || `smt-${idx + 1}`,
        nik: s.nik || `NIK-${1000 + idx}`,
        name: s.name || `SMT ${idx + 1}`,
        photoUrl: getGoogleDriveDirectImageUrl(s.photoUrl || s.photo, s.name),
        targetFurniture: Math.round(Number(s.targetFurniture) || 0),
        actualFurniture: Math.round(Number(s.actualFurniture) || 0),
        targetAccessories: Math.round(Number(s.targetAccessories) || 0),
        actualAccessories: Math.round(Number(s.actualAccessories) || 0),
        comser: Math.round(Number(s.comser) || 0),
        polis: Math.round(Number(s.polis) || 0),
        notes: s.notes || '',
      }));

      return {
        departments: fetchedDepts,
        smts: fetchedSMTs,
        summary: json.summary,
        source: 'Google Apps Script Web App'
      };
    }
  }

  // 2. Google Sheets URL via XLSX export (with cache buster)
  const match = trimmedUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
  const sheetId = match ? match[1] : null;

  if (sheetId) {
    const xlsxUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx&${cacheBuster}`;
    const response = await fetch(xlsxUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
      const { parsedDepts, parsedSMTs, parsedSummary } = parseWorkbookData(workbook);

      if (parsedDepts.length > 0 || parsedSMTs.length > 0 || parsedSummary) {
        return {
          departments: parsedDepts.length > 0 ? parsedDepts : undefined,
          smts: parsedSMTs.length > 0 ? parsedSMTs : undefined,
          summary: parsedSummary || undefined,
          source: 'Google Sheets XLSX Live'
        };
      }
    }
  }

  throw new Error('Tidak dapat mengekstrak data dari Google Sheets. Pastikan akses spreadsheet bersifat publik ("Anyone with the link can view") atau deploy Web App Google Apps Script.');
}
