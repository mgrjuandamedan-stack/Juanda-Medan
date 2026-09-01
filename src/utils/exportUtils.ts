import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ComputedDepartment, ComputedSMT, StoreSummary } from '../types';
import { formatRupiah, formatPercent, formatInteger } from './formatters';

/**
 * Export full executive PDF report
 */
export function exportToPDF(
  summary: StoreSummary,
  departments: ComputedDepartment[],
  smts: ComputedSMT[]
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Primary Colors
  const primaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const accentColor: [number, number, number] = [245, 158, 11]; // Amber 500
  const grayColor: [number, number, number] = [100, 116, 139]; // Slate 500

  // 1. Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Title & Store Brand
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('INFORMA JUANDA MEDAN', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('LAPORAN KINERJA PENJUALAN REAL-TIME & EVALUASI SMT', 14, 18);
  doc.text(`Kode Toko: ${summary.branchCode} | Tanggal Cetak: ${summary.currentDate}`, 14, 23);

  // Status Badge in Header
  doc.setFillColor(...accentColor);
  doc.roundedRect(pageWidth - 55, 7, 45, 14, 2, 2, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('MTD ACHIEVEMENT', pageWidth - 52, 12);
  doc.setFontSize(11);
  doc.text(formatPercent(summary.mtdPercent), pageWidth - 52, 18);

  let currentY = 34;

  // 2. Executive Summary Metrics Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, pageWidth - 28, 24, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);

  // Column 1: Target MTD
  doc.text('TARGET MTD TOKO', 18, currentY + 7);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(formatRupiah(summary.totalTargetMTD), 18, currentY + 14);

  // Column 2: Actual Sales MTD
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('ACTUAL SALES MTD', 68, currentY + 7);
  doc.setFontSize(11);
  doc.setTextColor(16, 185, 129); // Emerald
  doc.text(formatRupiah(summary.totalActualMTD), 68, currentY + 14);

  // Column 3: Kekurangan MTD
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('KEKURANGAN MTD', 120, currentY + 7);
  doc.setFontSize(11);
  doc.setTextColor(225, 29, 72); // Rose
  doc.text(formatRupiah(summary.kekuranganMTD), 120, currentY + 14);

  // Column 4: SMT Insentif Qualified
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('SMT LOLOS INSENTIF', 165, currentY + 7);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${summary.totalQualifiedSMT} SMT (Dual 100%)`, 165, currentY + 14);

  currentY += 30;

  // 3. Best & Poor SMT Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('RINGKASAN RANKING SMT (BEST & POOR)', 14, currentY);
  currentY += 4;

  const sortedSMTs = [...smts].sort((a, b) => b.mtdPercent - a.mtdPercent);
  const best3 = sortedSMTs.slice(0, 3);
  const poor3 = [...sortedSMTs].reverse().slice(0, 3);

  const bestPoorRows = [
    [
      '🥇 BEST #1: ' + best3[0]?.name,
      formatPercent(best3[0]?.mtdPercent || 0),
      '🚨 POOR #1: ' + poor3[0]?.name,
      formatPercent(poor3[0]?.mtdPercent || 0),
    ],
    [
      '🥈 BEST #2: ' + best3[1]?.name,
      formatPercent(best3[1]?.mtdPercent || 0),
      '🚨 POOR #2: ' + poor3[1]?.name,
      formatPercent(poor3[1]?.mtdPercent || 0),
    ],
    [
      '🥉 BEST #3: ' + best3[2]?.name,
      formatPercent(best3[2]?.mtdPercent || 0),
      '🚨 POOR #3: ' + poor3[2]?.name,
      formatPercent(poor3[2]?.mtdPercent || 0),
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Top 3 SMT (Tertinggi)', 'MTD %', '3 Poor SMT (Terendah)', 'MTD %']],
    body: bestPoorRows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // 4. Table: Kontribusi 20 Departemen
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('KONTRIBUSI 20 DEPARTEMEN INFORMA JUANDA', 14, currentY);
  currentY += 4;

  const deptRows = departments.map((d, index) => [
    index + 1,
    d.name,
    d.psName,
    formatRupiah(d.target),
    formatRupiah(d.actual),
    d.mtdPercent >= 100 ? 'LUNAS (100%+)' : formatRupiah(d.kekurangan),
    formatPercent(d.mtdPercent),
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['No', 'Nama Departemen', 'Nama PS', 'Target MTD', 'Actual Sales', 'Kekurangan Dept', 'MTD %']],
    body: deptRows,
    theme: 'striped',
    styles: { fontSize: 7.5, cellPadding: 1.8 },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 50 },
      2: { cellWidth: 28 },
      3: { cellWidth: 28, halign: 'right' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 28, halign: 'right' },
      6: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  // Add new page for SMT Performance Table
  doc.addPage();

  // Page 2 Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('INFORMA JUANDA MEDAN - DETAIL PERFORMA SMT & INSENTIF', 14, 11);

  currentY = 25;

  const smtRows = smts.map((s) => [
    s.name + ` (${s.nik})`,
    s.isFurnitureAchieved ? 'Lunas' : formatRupiah(s.kekuranganFurniture),
    s.isAccessoriesAchieved ? 'Lunas' : formatRupiah(s.kekuranganAccessories),
    formatPercent(s.mtdPercent),
    s.isInsentifQualified ? 'QUALIFIED (Dual 100%)' : 'BELUM QUALIFIED',
    formatRupiah(s.comser || 0),
    formatInteger(s.polis || 0) + ' Polis',
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [
      [
        'Nama SMT & NIK',
        'Kekurangan Furniture',
        'Kekurangan Accessories',
        'MTD %',
        'Status Insentif',
        'Comser (Rp)',
        'Polis',
      ],
    ],
    body: smtRows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.2 },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold' },
      1: { cellWidth: 28, halign: 'right' },
      2: { cellWidth: 28, halign: 'right' },
      3: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 32, halign: 'center' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 14, halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 12;

  // Signatures Section
  if (finalY < 240) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);

    doc.text('Medan, ' + summary.currentDate, 140, finalY);
    doc.text('Mengetahui / Disetujui Oleh,', 140, finalY + 5);

    doc.text('Dibuat Oleh,', 20, finalY + 5);
    doc.text('Sales Admin / Cashier Leader', 20, finalY + 22);

    doc.text('Store Manager Informa Juanda', 140, finalY + 22);
    doc.line(140, finalY + 20, 185, finalY + 20);
    doc.line(20, finalY + 20, 65, finalY + 20);
  }

  // Save PDF
  const filename = `INFORMA_JUANDA_MEDAN_LAPORAN_PENJUALAN_${new Date()
    .toISOString()
    .slice(0, 10)}.pdf`;
  doc.save(filename);
}

/**
 * Export full Excel Workbook (.xlsx)
 */
export function exportToExcel(
  summary: StoreSummary,
  departments: ComputedDepartment[],
  smts: ComputedSMT[]
) {
  const wb = XLSX.utils.book_new();

  // 1. Sheet Ringkasan Toko
  const summaryData = [
    ['INFORMA JUANDA MEDAN - LAPORAN PENJUALAN REAL-TIME'],
    ['Tanggal', summary.currentDate],
    ['Kode Toko', summary.branchCode],
    ['Lokasi', summary.location],
    [],
    ['METRIK UTAMA TOKO', 'NILAI'],
    ['Target MTD Toko (Rp)', summary.totalTargetMTD],
    ['Actual Sales MTD (Rp)', summary.totalActualMTD],
    ['Kekurangan MTD (Rp)', summary.kekuranganMTD],
    ['Pencapaian MTD (%)', Number(summary.mtdPercent.toFixed(2))],
    ['Target Harian (Rp)', summary.dailyTarget],
    ['Actual Harian (Rp)', summary.dailyActual],
    ['Kekurangan Harian (Rp)', summary.dailyKekurangan],
    ['Pencapaian Harian (%)', Number(summary.dailyPercent.toFixed(2))],
    ['Total Comser (Rp)', summary.totalComser],
    ['Total Polis Perlindungan', summary.totalPolis],
    ['Total SMT Lolos Insentif', summary.totalQualifiedSMT],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Toko');

  // 2. Sheet Kontribusi 20 Departemen
  const deptHeader = [
    'No',
    'Nama Departemen',
    'Kategori',
    'Nama PS (Product Specialist)',
    'Target MTD (Rp)',
    'Actual Sales MTD (Rp)',
    'Kekurangan Dept (Rp)',
    'MTD (%)',
    'Target Harian (Rp)',
    'Actual Harian (Rp)',
  ];

  const deptRows = departments.map((d, i) => [
    i + 1,
    d.name,
    d.category,
    d.psName,
    d.target,
    d.actual,
    d.kekurangan,
    Number(d.mtdPercent.toFixed(2)),
    d.dailyTarget,
    d.dailyActual,
  ]);

  const wsDept = XLSX.utils.aoa_to_sheet([deptHeader, ...deptRows]);
  XLSX.utils.book_append_sheet(wb, wsDept, 'Kontribusi 20 Departemen');

  // 3. Sheet Performa SMT & Insentif (Database SMT Lengkap dengan Link Foto Google Drive)
  const smtHeader = [
    'NIK',
    'Nama SMT',
    'Link Foto Google Drive',
    'Target Furniture (Rp)',
    'Actual Furniture (Rp)',
    'Kekurangan Furniture (Rp)',
    'Target Accessories (Rp)',
    'Actual Accessories (Rp)',
    'Kekurangan Accessories (Rp)',
    'Total Target (Rp)',
    'Total Actual (Rp)',
    'MTD (%)',
    'Status Insentif (100% Dual)',
    'Comser (Rp)',
    'Polis (Angka)',
    'Catatan Evaluasi',
  ];

  const smtRows = smts.map((s) => [
    s.nik,
    s.name,
    s.photoUrl || '',
    s.targetFurniture,
    s.actualFurniture,
    s.kekuranganFurniture,
    s.targetAccessories,
    s.actualAccessories,
    s.kekuranganAccessories,
    s.totalTarget,
    s.totalActual,
    Number(s.mtdPercent.toFixed(2)),
    s.isInsentifQualified ? 'BERHAK INSENTIF' : 'BELUM BERHAK',
    s.comser || 0,
    s.polis || 0,
    s.notes || '',
  ]);

  const wsSMT = XLSX.utils.aoa_to_sheet([smtHeader, ...smtRows]);
  XLSX.utils.book_append_sheet(wb, wsSMT, 'Performa SMT & Insentif');

  // 4. Sheet Petunjuk Penggunaan Google Drive untuk Foto SMT
  const driveGuideData = [
    ['PANDUAN LINK FOTO GOOGLE DRIVE UNTUK SMT - INFORMA JUANDA MEDAN'],
    [],
    ['Langkah', 'Instruksi'],
    ['1. Upload Foto', 'Upload foto SMT ke Google Drive toko (format JPG/PNG, rasio 1:1 atau vertikal).'],
    ['2. Set Izin Akses', 'Klik kanan foto di Google Drive > Bagikan (Share) > Ubah Akses Umum menjadi "Siapa saja yang memiliki link dapat melihat" (Anyone with the link can view).'],
    ['3. Salin Link', 'Klik "Salin Link" (Copy Link). Contoh: https://drive.google.com/file/d/1ABC123xyz.../view?usp=sharing'],
    ['4. Tempel ke Kolom', 'Tempel link tersebut ke kolom "Link Foto Google Drive" pada sheet "Performa SMT & Insentif".'],
    ['5. Sinkronisasi', 'Dashboard Informa Juanda secara otomatis mendeteksi ID Google Drive dan menampilkan foto langsung dengan kualitas tajam.'],
  ];
  const wsGuide = XLSX.utils.aoa_to_sheet(driveGuideData);
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Petunjuk Foto Drive');

  // Write file
  const filename = `INFORMA_JUANDA_DATABASE_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Generate CSV template for Google Sheets import
 */
export function generateGoogleSheetsTemplateCSV(
  departments: ComputedDepartment[],
  smts: ComputedSMT[]
): string {
  let csv = 'TYPE,ID,NAME,CATEGORY_OR_NIK,TARGET_OR_TARGET_FURN,ACTUAL_OR_ACT_FURN,TARGET_ACC,ACTUAL_ACC,PS_NAME,COMSER,POLIS,PHOTO_URL_OR_DRIVE_LINK\n';

  departments.forEach((d) => {
    csv += `DEPT,${d.id},"${d.name}",${d.category},${d.target},${d.actual},0,0,"${d.psName}",0,0,""\n`;
  });

  smts.forEach((s) => {
    csv += `SMT,${s.id},"${s.name}",${s.nik},${s.targetFurniture},${s.actualFurniture},${s.targetAccessories},${s.actualAccessories},"",${s.comser || 0},${s.polis || 0},"${s.photoUrl || ''}"\n`;
  });

  return csv;
}
