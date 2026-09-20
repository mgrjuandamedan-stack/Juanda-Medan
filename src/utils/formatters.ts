import { Department, SMTPerformance, ComputedDepartment, ComputedSMT, StoreSummary } from '../types';

/**
 * Format currency in Indonesian Rupiah WITHOUT any decimal places.
 * Example: Rp 12.500.000
 */
export function formatRupiah(amount: number): string {
  const rounded = Math.round(Number(amount) || 0);
  const formatted = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.abs(rounded));
  
  if (rounded < 0) {
    return `-Rp ${formatted}`;
  }
  return `Rp ${formatted}`;
}

/**
 * Convert any Google Drive sharing link, thumbnail URL, or ID into a direct image URL for <img> tags.
 * Supports:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 * - https://lh3.googleusercontent.com/d/FILE_ID
 * - Raw Google Drive File ID
 */
export function getGoogleDriveDirectImageUrl(urlOrId?: string, fallbackName = 'SMT'): string {
  if (!urlOrId || !urlOrId.trim()) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=ffd700&color=000000&bold=true`;
  }

  const str = urlOrId.trim();

  // If already standard non-drive image url
  if (!str.includes('drive.google.com') && !str.includes('googleusercontent.com')) {
    if (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('data:')) {
      return str;
    }
  }

  // Extract Drive File ID from various sharing formats
  let driveId = '';
  const fileDMatch = str.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  const idParamMatch = str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  const lh3Match = str.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  const ucMatch = str.match(/\/d\/([a-zA-Z0-9_-]+)/);

  if (fileDMatch && fileDMatch[1]) {
    driveId = fileDMatch[1];
  } else if (idParamMatch && idParamMatch[1]) {
    driveId = idParamMatch[1];
  } else if (lh3Match && lh3Match[1]) {
    driveId = lh3Match[1];
  } else if (ucMatch && ucMatch[1]) {
    driveId = ucMatch[1];
  } else if (/^[a-zA-Z0-9_-]{25,}$/.test(str)) {
    // Raw Drive ID
    driveId = str;
  }

  if (driveId) {
    // lh3.googleusercontent.com/d/ID is the fastest, high-availability direct CDN endpoint for Google Drive shared photos
    return `https://lh3.googleusercontent.com/d/${driveId}`;
  }

  return str;
}

/**
 * Format integer/number WITHOUT any decimal places.
 * Example: 1.250 or 18
 */
export function formatInteger(val: number): string {
  const rounded = Math.round(Number(val) || 0);
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(rounded);
}

/**
 * Format percentage with EXACTLY 2 decimal places.
 * Example: 85.50% or 100.00%
 */
export function formatPercent(val: number): string {
  const num = Number(val) || 0;
  return `${num.toFixed(2)}%`;
}

/**
 * Compute Department metrics including Kekurangan (Target - Actual) and MTD %.
 */
export function computeDepartmentMetrics(dept: Department): ComputedDepartment {
  const target = Math.max(0, Math.round(dept.target));
  const actual = Math.max(0, Math.round(dept.actual));
  const diff = target - actual;
  const kekurangan = diff > 0 ? diff : 0;
  const surplus = diff < 0 ? Math.abs(diff) : 0;
  const mtdPercent = target > 0 ? (actual / target) * 100 : 0;

  const dailyTarget = Math.max(0, Math.round(dept.dailyTarget || 0));
  const dailyActual = Math.max(0, Math.round(dept.dailyActual || 0));
  const dailyDiff = dailyTarget - dailyActual;
  const dailyKekurangan = dailyDiff > 0 ? dailyDiff : 0;
  const dailyPercent = dailyTarget > 0 ? (dailyActual / dailyTarget) * 100 : 0;

  let status: 'achieved' | 'on_track' | 'warning' | 'critical' = 'warning';
  if (mtdPercent >= 100) {
    status = 'achieved';
  } else if (mtdPercent >= 85) {
    status = 'on_track';
  } else if (mtdPercent >= 65) {
    status = 'warning';
  } else {
    status = 'critical';
  }

  return {
    ...dept,
    target,
    actual,
    kekurangan,
    surplus,
    mtdPercent,
    dailyTarget,
    dailyActual,
    dailyKekurangan,
    dailyPercent,
    status,
  };
}

/**
 * Compute SMT Performance metrics according to business rules:
 * - Kekurangan Furniture = Target Furniture - Actual Furniture
 * - Kekurangan Accessories = Target Accessories - Actual Accessories
 * - MTD % = Overall (Total Actual / Total Target * 100)
 * - Insentif is granted ONLY IF actualFurniture >= targetFurniture AND actualAccessories >= targetAccessories
 */
export function computeSMTMetrics(smt: SMTPerformance): ComputedSMT {
  const targetFurniture = Math.max(0, Math.round(smt.targetFurniture));
  const actualFurniture = Math.max(0, Math.round(smt.actualFurniture));
  const targetAccessories = Math.max(0, Math.round(smt.targetAccessories));
  const actualAccessories = Math.max(0, Math.round(smt.actualAccessories));

  const kekuranganFurniture = Math.max(0, targetFurniture - actualFurniture);
  const kekuranganAccessories = Math.max(0, targetAccessories - actualAccessories);

  const totalTarget = targetFurniture + targetAccessories;
  const totalActual = actualFurniture + actualAccessories;

  const mtdPercentFurniture = targetFurniture > 0 ? (actualFurniture / targetFurniture) * 100 : 0;
  const mtdPercentAccessories = targetAccessories > 0 ? (actualAccessories / targetAccessories) * 100 : 0;
  const mtdPercent = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;

  const isFurnitureAchieved = targetFurniture > 0 ? actualFurniture >= targetFurniture : true;
  const isAccessoriesAchieved = targetAccessories > 0 ? actualAccessories >= targetAccessories : true;
  const isInsentifQualified = isFurnitureAchieved && isAccessoriesAchieved && totalTarget > 0;

  // Estimated incentive formula (Base reward Rp 2.500.000 + 1.5% of total sales + Comser bonus + Polis bonus)
  let insentifEstimated = 0;
  if (isInsentifQualified) {
    const baseIncentive = 2500000;
    const performanceBonus = Math.round(totalActual * 0.015);
    const comserBonus = Math.round((smt.comser || 0) * 0.05);
    const polisBonus = Math.round((smt.polis || 0) * 50000);
    insentifEstimated = baseIncentive + performanceBonus + comserBonus + polisBonus;
  }

  let statusReason = '';
  if (isInsentifQualified) {
    statusReason = 'Berhak Mendapat Insentif (100% Furniture & Accessories)';
  } else if (!isFurnitureAchieved && !isAccessoriesAchieved) {
    statusReason = 'Kekurangan Furniture & Accessories';
  } else if (!isFurnitureAchieved) {
    statusReason = 'Kekurangan Target Furniture';
  } else {
    statusReason = 'Kekurangan Target Accessories';
  }

  return {
    ...smt,
    targetFurniture,
    actualFurniture,
    targetAccessories,
    actualAccessories,
    kekuranganFurniture,
    kekuranganAccessories,
    totalTarget,
    totalActual,
    mtdPercentFurniture,
    mtdPercentAccessories,
    mtdPercent,
    isFurnitureAchieved,
    isAccessoriesAchieved,
    isInsentifQualified,
    insentifEstimated,
    statusReason,
  };
}

/**
 * Get comprehensive running date information based on current date (WIB / Asia/Jakarta).
 */
export function getRunningDateInfo(refDate?: Date | string) {
  const date = refDate ? new Date(refDate) : new Date();

  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  let dayOfWeek = date.getDay();
  let dayNumber = date.getDate();
  let monthIndex = date.getMonth();
  let year = date.getFullYear();

  try {
    const formatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const parts = formatter.formatToParts(date);
    const partObj: Record<string, string> = {};
    parts.forEach((p) => {
      partObj[p.type] = p.value;
    });

    if (partObj.day) dayNumber = parseInt(partObj.day, 10);
    if (partObj.year) year = parseInt(partObj.year, 10);
    if (partObj.weekday) {
      const idx = dayNames.findIndex((d) => d.toLowerCase() === partObj.weekday.toLowerCase());
      if (idx !== -1) dayOfWeek = idx;
    }
    if (partObj.month) {
      const mIdx = monthNames.findIndex((m) => m.toLowerCase() === partObj.month.toLowerCase());
      if (mIdx !== -1) monthIndex = mIdx;
    }
  } catch (e) {
    // fallback to local date properties
  }

  const dayName = dayNames[dayOfWeek] || 'Hari';
  const monthName = monthNames[monthIndex] || 'Bulan';
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const daysElapsed = Math.min(dayNumber, daysInMonth);
  const daysRemaining = Math.max(0, daysInMonth - daysElapsed);

  // Full date with day name: e.g. "Minggu, 20 September 2026"
  const formattedFull = `${dayName}, ${dayNumber} ${monthName} ${year}`;
  // Short date: e.g. "20 September 2026"
  const formattedShort = `${dayNumber} ${monthName} ${year}`;

  return {
    dayName,
    dayNumber,
    monthName,
    monthIndex,
    year,
    daysInMonth,
    daysElapsed,
    daysRemaining,
    formattedFull,
    formattedShort,
  };
}

/**
 * Compute overall store summary
 */
export function computeStoreSummary(
  depts: ComputedDepartment[],
  smts: ComputedSMT[]
): StoreSummary {
  const totalTargetMTD = depts.reduce((acc, d) => acc + d.target, 0);
  const totalActualMTD = depts.reduce((acc, d) => acc + d.actual, 0);
  const kekuranganMTD = Math.max(0, totalTargetMTD - totalActualMTD);
  const mtdPercent = totalTargetMTD > 0 ? (totalActualMTD / totalTargetMTD) * 100 : 0;

  const dailyTarget = depts.reduce((acc, d) => acc + d.dailyTarget, 0);
  const dailyActual = depts.reduce((acc, d) => acc + d.dailyActual, 0);
  const dailyKekurangan = Math.max(0, dailyTarget - dailyActual);
  const dailyPercent = dailyTarget > 0 ? (dailyActual / dailyTarget) * 100 : 0;

  const targetFurnitureMTD = smts.reduce((acc, s) => acc + s.targetFurniture, 0);
  const actualFurnitureMTD = smts.reduce((acc, s) => acc + s.actualFurniture, 0);
  const targetAccessoriesMTD = smts.reduce((acc, s) => acc + s.targetAccessories, 0);
  const actualAccessoriesMTD = smts.reduce((acc, s) => acc + s.actualAccessories, 0);

  const totalComser = smts.reduce((acc, s) => acc + (s.comser || 0), 0);
  const totalPolis = smts.reduce((acc, s) => acc + (s.polis || 0), 0);
  const totalQualifiedSMT = smts.filter((s) => s.isInsentifQualified).length;

  const dateInfo = getRunningDateInfo();

  return {
    storeName: 'INFORMA JUANDA MEDAN',
    branchCode: 'INF-JMD-042',
    location: 'Jl. Ir. H. Juanda No. 36, Medan, Sumatera Utara',
    currentDate: dateInfo.formattedFull,
    dayName: dateInfo.dayName,
    monthName: dateInfo.monthName,
    year: dateInfo.year,
    daysElapsed: dateInfo.daysElapsed,
    daysInMonth: dateInfo.daysInMonth,
    daysRemaining: dateInfo.daysRemaining,
    totalTargetMTD,
    totalActualMTD,
    kekuranganMTD,
    mtdPercent,
    dailyTarget,
    dailyActual,
    dailyKekurangan,
    dailyPercent,
    targetFurnitureMTD,
    actualFurnitureMTD,
    targetAccessoriesMTD,
    actualAccessoriesMTD,
    totalComser,
    totalPolis,
    totalQualifiedSMT,
  };
}
