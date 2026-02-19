import jsPDF from 'jspdf';
import { starterPackHabits } from '@/data/defaultHabits';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export type TrackerType = 'ibadah' | 'olahraga' | 'makanan' | 'sedekah' | 'tadarus' | 'all-in-one';
export type TrackerPeriod = 'weekly' | 'monthly';
export type TrackerTheme = 'green' | 'blue' | 'gold' | 'custom';

export interface TrackerConfig {
  type: TrackerType;
  period: TrackerPeriod;
  theme: TrackerTheme;
  customColor?: string;
  orientation: 'portrait' | 'landscape';
  userName?: string;
  monthYear?: string;
  logoBase64?: string;
  whitelabel: boolean;
  tagline?: string;
  customHabits?: string[];
}

const themeColors: Record<string, { primary: number[]; secondary: number[]; headerText: number[] }> = {
  green: { primary: [34, 139, 34], secondary: [230, 245, 230], headerText: [255, 255, 255] },
  blue: { primary: [41, 98, 255], secondary: [230, 240, 255], headerText: [255, 255, 255] },
  gold: { primary: [178, 134, 32], secondary: [255, 248, 225], headerText: [255, 255, 255] },
  custom: { primary: [99, 102, 241], secondary: [238, 242, 255], headerText: [255, 255, 255] },
};

function getColors(config: TrackerConfig) {
  return themeColors[config.theme] || themeColors.green;
}

function getDayCount(period: TrackerPeriod): number {
  return period === 'weekly' ? 7 : 30;
}

function drawHeader(doc: jsPDF, config: TrackerConfig, title: string) {
  const colors = getColors(config);
  const pageW = doc.internal.pageSize.getWidth();

  // Header bar
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, pageW, 28, 'F');

  let titleX = 10;
  if (config.logoBase64) {
    try {
      doc.addImage(config.logoBase64, 'PNG', 8, 3, 22, 22);
      titleX = 34;
    } catch { /* ignore */ }
  }

  doc.setTextColor(colors.headerText[0], colors.headerText[1], colors.headerText[2]);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, titleX, 13);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const subtitle = [
    config.userName ? `Nama: ${config.userName}` : 'Nama: _______________',
    config.monthYear || format(new Date(), 'MMMM yyyy', { locale: idLocale }),
  ].join('  •  ');
  doc.text(subtitle, titleX, 21);

  if (!config.whitelabel) {
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text('UmrohConnect', pageW - 8, 8, { align: 'right' });
  }
}

function drawFooter(doc: jsPDF, config: TrackerConfig) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  const footerText = config.whitelabel
    ? (config.tagline || 'Printable Habit Tracker')
    : 'UmrohConnect • Printable Habit Tracker';
  doc.text(footerText, pageW / 2, pageH - 6, { align: 'center' });
}

function drawChecklistGrid(
  doc: jsPDF, config: TrackerConfig, startY: number,
  rows: string[], dayCount: number
): number {
  const colors = getColors(config);
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 8;
  const labelW = config.orientation === 'landscape' ? 55 : 45;
  const availW = pageW - margin * 2 - labelW;
  const cellW = Math.min(availW / dayCount, 8);
  const cellH = 7;
  const gridW = labelW + cellW * dayCount;

  let y = startY;

  // Column headers (day numbers)
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  for (let d = 1; d <= dayCount; d++) {
    doc.text(String(d), margin + labelW + (d - 1) * cellW + cellW / 2, y, { align: 'center' });
  }
  y += 3;

  // Draw rows
  rows.forEach((label, rowIdx) => {
    const rowY = y + rowIdx * cellH;
    // Alternate row bg
    if (rowIdx % 2 === 0) {
      doc.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
      doc.rect(margin, rowY, gridW, cellH, 'F');
    }

    // Label
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    doc.text(label, margin + 2, rowY + cellH / 2 + 1.5);

    // Cells
    doc.setDrawColor(200, 200, 200);
    for (let d = 0; d < dayCount; d++) {
      doc.rect(margin + labelW + d * cellW, rowY, cellW, cellH, 'S');
    }
  });

  // Border around grid
  doc.setDrawColor(180, 180, 180);
  doc.rect(margin, y, gridW, rows.length * cellH, 'S');

  return y + rows.length * cellH + 5;
}

function drawTableGrid(
  doc: jsPDF, config: TrackerConfig, startY: number,
  columns: { label: string; width: number }[], rowCount: number
): number {
  const colors = getColors(config);
  const margin = 8;
  const cellH = 7;
  let y = startY;

  // Header row
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  let totalW = columns.reduce((s, c) => s + c.width, 0);
  doc.rect(margin, y, totalW, cellH, 'F');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  let cx = margin;
  columns.forEach(col => {
    doc.text(col.label, cx + 2, y + cellH / 2 + 1.5);
    cx += col.width;
  });
  y += cellH;

  // Data rows (empty)
  for (let r = 0; r < rowCount; r++) {
    const rowY = y + r * cellH;
    if (r % 2 === 0) {
      doc.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
      doc.rect(margin, rowY, totalW, cellH, 'F');
    }
    doc.setDrawColor(200, 200, 200);
    cx = margin;
    columns.forEach(col => {
      doc.rect(cx, rowY, col.width, cellH, 'S');
      cx += col.width;
    });
  }

  doc.setDrawColor(180, 180, 180);
  doc.rect(margin, startY, totalW, (rowCount + 1) * cellH, 'S');

  return y + rowCount * cellH + 5;
}

function drawNotesSection(doc: jsPDF, y: number): number {
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 8;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text('Catatan:', margin, y + 4);
  y += 7;
  doc.setDrawColor(200, 200, 200);
  for (let i = 0; i < 4; i++) {
    const lineY = y + i * 7;
    doc.line(margin, lineY, pageW - margin, lineY);
  }
  return y + 28;
}

function getDefaultIbadahRows(config: TrackerConfig): string[] {
  if (config.customHabits && config.customHabits.length > 0) {
    return config.customHabits;
  }
  // Try localStorage habits
  try {
    const saved = JSON.parse(localStorage.getItem('habit_tracker_habits') || '[]');
    if (Array.isArray(saved) && saved.length > 0) {
      return saved.map((h: any) => h.name || h.id).slice(0, 15);
    }
  } catch { /* */ }
  // Fallback to starter pack
  return starterPackHabits.map(h => h.name);
}

// ===== Generator Functions =====

export function generateBlankIbadahTracker(config: TrackerConfig): void {
  const doc = new jsPDF({ orientation: config.orientation, unit: 'mm', format: 'a4' });
  const days = getDayCount(config.period);
  const rows = getDefaultIbadahRows(config);

  drawHeader(doc, config, `📿 TRACKER IBADAH - ${config.period === 'weekly' ? 'Mingguan' : 'Bulanan'}`);
  let y = 34;
  y = drawChecklistGrid(doc, config, y, rows, days);
  y = drawNotesSection(doc, y);
  drawFooter(doc, config);

  doc.save(`tracker-ibadah-${config.period}.pdf`);
}

export function generateBlankOlahragaTracker(config: TrackerConfig): void {
  const doc = new jsPDF({ orientation: config.orientation, unit: 'mm', format: 'a4' });
  const rowCount = getDayCount(config.period);
  const colW = config.orientation === 'landscape' ? 56 : 42;

  drawHeader(doc, config, `🏃 TRACKER OLAHRAGA - ${config.period === 'weekly' ? 'Mingguan' : 'Bulanan'}`);
  let y = 34;
  y = drawTableGrid(doc, config, y, [
    { label: 'Tanggal', width: colW * 0.7 },
    { label: 'Jenis Olahraga', width: colW },
    { label: 'Durasi (menit)', width: colW * 0.8 },
    { label: 'Intensitas', width: colW * 0.7 },
    { label: 'Catatan', width: colW },
  ], rowCount);
  y = drawNotesSection(doc, y);
  drawFooter(doc, config);

  doc.save(`tracker-olahraga-${config.period}.pdf`);
}

export function generateBlankMealTracker(config: TrackerConfig): void {
  const doc = new jsPDF({ orientation: config.orientation, unit: 'mm', format: 'a4' });
  const rowCount = getDayCount(config.period);
  const colW = config.orientation === 'landscape' ? 52 : 38;

  drawHeader(doc, config, `🍽️ TRACKER MAKANAN - ${config.period === 'weekly' ? 'Mingguan' : 'Bulanan'}`);
  let y = 34;
  y = drawTableGrid(doc, config, y, [
    { label: 'Tanggal', width: colW * 0.7 },
    { label: 'Menu Sahur', width: colW * 1.2 },
    { label: 'Menu Berbuka', width: colW * 1.2 },
    { label: 'Air (gelas)', width: colW * 0.6 },
    { label: 'Catatan', width: colW },
  ], rowCount);
  drawFooter(doc, config);

  doc.save(`tracker-makanan-${config.period}.pdf`);
}

export function generateBlankSedekahTracker(config: TrackerConfig): void {
  const doc = new jsPDF({ orientation: config.orientation, unit: 'mm', format: 'a4' });
  const rowCount = getDayCount(config.period);
  const colW = config.orientation === 'landscape' ? 52 : 38;

  drawHeader(doc, config, `💝 TRACKER SEDEKAH - ${config.period === 'weekly' ? 'Mingguan' : 'Bulanan'}`);
  let y = 34;
  y = drawTableGrid(doc, config, y, [
    { label: 'Tanggal', width: colW * 0.7 },
    { label: 'Jenis Sedekah', width: colW * 1.1 },
    { label: 'Nominal (Rp)', width: colW * 0.9 },
    { label: 'Penerima', width: colW * 0.9 },
    { label: 'Catatan', width: colW },
  ], rowCount);
  drawFooter(doc, config);

  doc.save(`tracker-sedekah-${config.period}.pdf`);
}

export function generateBlankTadarusTracker(config: TrackerConfig): void {
  const doc = new jsPDF({ orientation: config.orientation, unit: 'mm', format: 'a4' });
  const colors = getColors(config);
  const margin = 8;

  drawHeader(doc, config, '📖 TRACKER TADARUS & KHATAM');
  let y = 34;

  // Juz Grid (6x5 = 30 boxes)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text('Progress Khatam (30 Juz)', margin, y + 4);
  y += 7;

  const boxSize = 12;
  const cols = 10;
  for (let j = 0; j < 30; j++) {
    const col = j % cols;
    const row = Math.floor(j / cols);
    const bx = margin + col * (boxSize + 2);
    const by = y + row * (boxSize + 2);
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    doc.roundedRect(bx, by, boxSize, boxSize, 1, 1, 'FD');
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(String(j + 1), bx + boxSize / 2, by + boxSize / 2 + 1.5, { align: 'center' });
  }
  y += Math.ceil(30 / cols) * (boxSize + 2) + 8;

  // Daily log table
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text('Log Harian Tadarus', margin, y + 4);
  y += 7;

  const colW = config.orientation === 'landscape' ? 48 : 35;
  const rowCount = config.period === 'weekly' ? 7 : 15;
  y = drawTableGrid(doc, config, y, [
    { label: 'Tanggal', width: colW * 0.7 },
    { label: 'Surah', width: colW },
    { label: 'Dari Ayat', width: colW * 0.7 },
    { label: 'Sampai Ayat', width: colW * 0.7 },
    { label: 'Juz', width: colW * 0.5 },
    { label: 'Catatan', width: colW },
  ], rowCount);

  drawFooter(doc, config);
  doc.save(`tracker-tadarus.pdf`);
}

export function generateAllInOneTracker(config: TrackerConfig): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const days = getDayCount(config.period);
  const pageH = doc.internal.pageSize.getHeight();

  // Page 1: Ibadah checklist (compact)
  drawHeader(doc, { ...config, orientation: 'landscape' }, '📿 ALL-IN-ONE TRACKER');
  const ibadahRows = getDefaultIbadahRows(config).slice(0, 8);
  let y = 34;
  y = drawChecklistGrid({ ...doc, internal: doc.internal } as any, { ...config, orientation: 'landscape' }, y, ibadahRows, days);

  // Olahraga mini table
  if (y + 50 < pageH) {
    const colW = 40;
    y = drawTableGrid(doc, { ...config, orientation: 'landscape' }, y, [
      { label: 'Tgl', width: colW * 0.5 },
      { label: 'Olahraga', width: colW },
      { label: 'Durasi', width: colW * 0.6 },
      { label: 'Sedekah (Rp)', width: colW * 0.8 },
      { label: 'Air', width: colW * 0.4 },
      { label: 'Tadarus', width: colW * 0.7 },
    ], Math.min(days, 10));
  }

  drawFooter(doc, { ...config, orientation: 'landscape' });
  doc.save(`tracker-all-in-one-${config.period}.pdf`);
}

// Main dispatch
export function generateTracker(config: TrackerConfig): void {
  switch (config.type) {
    case 'ibadah': return generateBlankIbadahTracker(config);
    case 'olahraga': return generateBlankOlahragaTracker(config);
    case 'makanan': return generateBlankMealTracker(config);
    case 'sedekah': return generateBlankSedekahTracker(config);
    case 'tadarus': return generateBlankTadarusTracker(config);
    case 'all-in-one': return generateAllInOneTracker(config);
  }
}
