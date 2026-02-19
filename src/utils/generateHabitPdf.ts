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
  orientation: 'portrait' | 'landscape';
  userName?: string;
  monthYear?: string;
  logoBase64?: string;
  whitelabel: boolean;
  tagline?: string;
  customHabits?: string[];
}

interface ThemeColors {
  primary: number[];
  primaryLight: number[];
  secondary: number[];
  accent: number[];
  headerText: number[];
  gradientEnd: number[];
  decorative: number[];
}

const themeColors: Record<string, ThemeColors> = {
  green: {
    primary: [16, 120, 60],
    primaryLight: [34, 170, 90],
    secondary: [230, 248, 235],
    accent: [245, 195, 68],
    headerText: [255, 255, 255],
    gradientEnd: [8, 80, 40],
    decorative: [180, 230, 195],
  },
  blue: {
    primary: [25, 70, 160],
    primaryLight: [55, 110, 220],
    secondary: [230, 240, 255],
    accent: [255, 180, 50],
    headerText: [255, 255, 255],
    gradientEnd: [15, 40, 100],
    decorative: [180, 210, 250],
  },
  gold: {
    primary: [140, 100, 20],
    primaryLight: [195, 150, 40],
    secondary: [255, 250, 230],
    accent: [180, 50, 30],
    headerText: [255, 255, 255],
    gradientEnd: [90, 65, 10],
    decorative: [240, 220, 170],
  },
  custom: {
    primary: [80, 50, 140],
    primaryLight: [120, 80, 200],
    secondary: [240, 235, 255],
    accent: [240, 130, 70],
    headerText: [255, 255, 255],
    gradientEnd: [50, 25, 90],
    decorative: [200, 180, 240],
  },
};

function getColors(config: TrackerConfig): ThemeColors {
  return themeColors[config.theme] || themeColors.green;
}

function getDayCount(period: TrackerPeriod): number {
  return period === 'weekly' ? 7 : 30;
}

// ===== Decorative Helpers =====

function drawIslamicBorderPattern(doc: jsPDF, colors: ThemeColors) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const borderW = 6;

  // Top & bottom decorative bars
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, pageW, borderW, 'F');
  doc.rect(0, pageH - borderW, pageW, borderW, 'F');

  // Inner accent line
  doc.setFillColor(colors.accent[0], colors.accent[1], colors.accent[2]);
  doc.rect(0, borderW, pageW, 1.5, 'F');
  doc.rect(0, pageH - borderW - 1.5, pageW, 1.5, 'F');

  // Side accents
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, borderW, pageH, 'F');
  doc.rect(pageW - borderW, 0, borderW, pageH, 'F');

  doc.setFillColor(colors.accent[0], colors.accent[1], colors.accent[2]);
  doc.rect(borderW, borderW, 1.5, pageH - borderW * 2, 'F');
  doc.rect(pageW - borderW - 1.5, borderW, 1.5, pageH - borderW * 2, 'F');

  // Corner diamonds
  const cornerSize = 4;
  [
    [borderW + 3, borderW + 3],
    [pageW - borderW - 3, borderW + 3],
    [borderW + 3, pageH - borderW - 3],
    [pageW - borderW - 3, pageH - borderW - 3],
  ].forEach(([cx, cy]) => {
    doc.setFillColor(colors.accent[0], colors.accent[1], colors.accent[2]);
    // Diamond shape using triangle pairs
    doc.triangle(cx, cy - cornerSize, cx + cornerSize, cy, cx, cy + cornerSize, 'F');
    doc.triangle(cx, cy - cornerSize, cx - cornerSize, cy, cx, cy + cornerSize, 'F');
  });
}

function drawCirclePattern(doc: jsPDF, cx: number, cy: number, r: number, colors: ThemeColors) {
  // Decorative concentric arcs
  for (let i = 0; i < 4; i++) {
    const radius = r - i * 6;
    if (radius <= 0) break;
    doc.setDrawColor(colors.decorative[0], colors.decorative[1], colors.decorative[2]);
    doc.setLineWidth(0.3);
    doc.circle(cx, cy, radius, 'S');
  }
}

// ===== Cover Page =====

function drawCoverPage(doc: jsPDF, config: TrackerConfig, title: string, subtitle: string, emoji: string) {
  const colors = getColors(config);
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Full background gradient effect (simulated with rects)
  const steps = 20;
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const r = Math.round(colors.primary[0] * (1 - t * 0.4) + colors.gradientEnd[0] * t * 0.4);
    const g = Math.round(colors.primary[1] * (1 - t * 0.4) + colors.gradientEnd[1] * t * 0.4);
    const b = Math.round(colors.primary[2] * (1 - t * 0.4) + colors.gradientEnd[2] * t * 0.4);
    doc.setFillColor(r, g, b);
    doc.rect(0, (pageH / steps) * i, pageW, pageH / steps + 1, 'F');
  }

  // Decorative circles in background (light tint)
  doc.setFillColor(
    Math.min(255, colors.primary[0] + 30),
    Math.min(255, colors.primary[1] + 30),
    Math.min(255, colors.primary[2] + 30)
  );
  doc.circle(pageW * 0.8, pageH * 0.2, 60, 'F');
  doc.circle(pageW * 0.15, pageH * 0.75, 45, 'F');
  doc.circle(pageW * 0.9, pageH * 0.85, 30, 'F');

  // Decorative border
  drawIslamicBorderPattern(doc, colors);

  // Top decorative ornament
  drawCirclePattern(doc, pageW / 2, pageH * 0.18, 30, colors);

  // Logo or brand area
  let brandY = pageH * 0.32;
  if (config.logoBase64 && config.whitelabel) {
    try {
      doc.addImage(config.logoBase64, 'PNG', pageW / 2 - 20, brandY - 20, 40, 40);
      brandY += 28;
    } catch { /* ignore */ }
  }

  // Main title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageW / 2, brandY + 10, { align: 'center' });

  // Emoji accent
  doc.setFontSize(48);
  doc.text(emoji, pageW / 2, brandY - 18, { align: 'center' });

  // Subtitle
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 220, 220);
  doc.text(subtitle, pageW / 2, brandY + 24, { align: 'center' });

  // Period badge
  const periodLabel = config.period === 'weekly' ? '7 HARI' : '30 HARI';
  const badgeW = 50;
  const badgeH = 12;
  const badgeX = pageW / 2 - badgeW / 2;
  const badgeY = brandY + 34;
  doc.setFillColor(colors.accent[0], colors.accent[1], colors.accent[2]);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(periodLabel, pageW / 2, badgeY + badgeH / 2 + 3, { align: 'center' });

  // User name area (light tinted box)
  const infoY = pageH * 0.62;
  doc.setFillColor(
    Math.min(255, colors.primary[0] + 40),
    Math.min(255, colors.primary[1] + 40),
    Math.min(255, colors.primary[2] + 40)
  );
  doc.roundedRect(pageW * 0.15, infoY, pageW * 0.7, 30, 4, 4, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Nama:', pageW * 0.2, infoY + 12);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(
    config.userName || '________________________________',
    pageW * 0.2, infoY + 23
  );

  // Month/year
  const dateStr = config.monthYear || format(new Date(), 'MMMM yyyy', { locale: idLocale });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(dateStr, pageW * 0.8, infoY + 12, { align: 'right' });

  // Bottom branding
  const footerY = pageH - 22;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  doc.setTextColor(200, 200, 200);
  if (config.whitelabel) {
    doc.text(config.tagline || '', pageW / 2, footerY, { align: 'center' });
  } else {
    doc.text('UmrohConnect', pageW / 2, footerY, { align: 'center' });
    doc.setFontSize(7);
    doc.text('Printable Habit Tracker • www.umrohconnect.com', pageW / 2, footerY + 6, { align: 'center' });
  }

  // Bottom ornament
  drawCirclePattern(doc, pageW / 2, pageH * 0.88, 18, colors);
}

// ===== Content Page Header =====

function drawPageHeader(doc: jsPDF, config: TrackerConfig, title: string) {
  const colors = getColors(config);
  const pageW = doc.internal.pageSize.getWidth();

  // Header banner
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.roundedRect(8, 8, pageW - 16, 22, 3, 3, 'F');

  // Accent stripe
  doc.setFillColor(colors.accent[0], colors.accent[1], colors.accent[2]);
  doc.rect(8, 28, pageW - 16, 2, 'F');

  let titleX = 14;
  if (config.logoBase64 && config.whitelabel) {
    try {
      doc.addImage(config.logoBase64, 'PNG', 12, 10, 18, 18);
      titleX = 34;
    } catch { /* ignore */ }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, titleX, 18);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const sub = [
    config.userName ? `Nama: ${config.userName}` : 'Nama: _______________',
    config.monthYear || format(new Date(), 'MMMM yyyy', { locale: idLocale }),
  ].join('  •  ');
  doc.text(sub, titleX, 25);

  if (!config.whitelabel) {
    doc.setFontSize(7);
    doc.text('UmrohConnect', pageW - 14, 15, { align: 'right' });
  }
}

function drawPageFooter(doc: jsPDF, config: TrackerConfig) {
  const colors = getColors(config);
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Footer bar
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(8, pageH - 12, pageW - 16, 6, 'F');

  doc.setFontSize(6);
  doc.setTextColor(255, 255, 255);
  const footerText = config.whitelabel
    ? (config.tagline || 'Printable Habit Tracker')
    : 'UmrohConnect • Printable Habit Tracker';
  doc.text(footerText, pageW / 2, pageH - 8, { align: 'center' });
}

// ===== Grid Drawing =====

function drawChecklistGrid(
  doc: jsPDF, config: TrackerConfig, startY: number,
  rows: string[], dayCount: number
): number {
  const colors = getColors(config);
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 10;
  const labelW = config.orientation === 'landscape' ? 55 : 48;
  const availW = pageW - margin * 2 - labelW;
  const cellW = Math.min(availW / dayCount, 8);
  const cellH = 8;

  let y = startY;

  // Section title decoration
  doc.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  doc.roundedRect(margin, y - 2, labelW + cellW * dayCount, cellH + 2, 2, 2, 'F');

  // Column headers
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  for (let d = 1; d <= dayCount; d++) {
    doc.text(String(d), margin + labelW + (d - 1) * cellW + cellW / 2, y + 4, { align: 'center' });
  }
  y += cellH;

  // Draw rows
  rows.forEach((label, rowIdx) => {
    const rowY = y + rowIdx * cellH;

    if (rowIdx % 2 === 0) {
      doc.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.rect(margin, rowY, labelW + cellW * dayCount, cellH, 'F');

    // Label with accent left border
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(margin, rowY, 2, cellH, 'F');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    doc.text(label, margin + 5, rowY + cellH / 2 + 2);

    // Cells with rounded inner style
    doc.setDrawColor(colors.decorative[0], colors.decorative[1], colors.decorative[2]);
    doc.setLineWidth(0.3);
    for (let d = 0; d < dayCount; d++) {
      const cx = margin + labelW + d * cellW;
      doc.rect(cx, rowY, cellW, cellH, 'S');
    }
  });

  // Outer border
  doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setLineWidth(0.5);
  doc.rect(margin, startY + cellH - 2, labelW + cellW * dayCount, rows.length * cellH + 2, 'S');

  return y + rows.length * cellH + 8;
}

function drawTableGrid(
  doc: jsPDF, config: TrackerConfig, startY: number,
  columns: { label: string; width: number }[], rowCount: number
): number {
  const colors = getColors(config);
  const margin = 10;
  const cellH = 8;
  let y = startY;

  const totalW = columns.reduce((s, c) => s + c.width, 0);

  // Header row with rounded top
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.roundedRect(margin, y, totalW, cellH + 1, 2, 2, 'F');
  // Fill bottom part to remove bottom rounding
  doc.rect(margin, y + 4, totalW, cellH - 3, 'F');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  let cx = margin;
  columns.forEach(col => {
    doc.text(col.label, cx + 3, y + cellH / 2 + 2);
    cx += col.width;
  });
  y += cellH + 1;

  // Data rows
  for (let r = 0; r < rowCount; r++) {
    const rowY = y + r * cellH;
    if (r % 2 === 0) {
      doc.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.rect(margin, rowY, totalW, cellH, 'F');

    doc.setDrawColor(colors.decorative[0], colors.decorative[1], colors.decorative[2]);
    doc.setLineWidth(0.3);
    cx = margin;
    columns.forEach(col => {
      doc.rect(cx, rowY, col.width, cellH, 'S');
      cx += col.width;
    });
  }

  // Outer border
  doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setLineWidth(0.5);
  doc.rect(margin, startY, totalW, (rowCount + 1) * cellH + 1, 'S');

  return y + rowCount * cellH + 8;
}

function drawNotesSection(doc: jsPDF, config: TrackerConfig, y: number): number {
  const colors = getColors(config);
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 10;

  doc.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  doc.roundedRect(margin, y, pageW - margin * 2, 32, 3, 3, 'F');

  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.roundedRect(margin, y, 40, 8, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('📝 Catatan', margin + 4, y + 5.5);

  y += 12;
  doc.setDrawColor(colors.decorative[0], colors.decorative[1], colors.decorative[2]);
  doc.setLineWidth(0.3);
  for (let i = 0; i < 3; i++) {
    const lineY = y + i * 7;
    doc.line(margin + 4, lineY, pageW - margin - 4, lineY);
  }
  return y + 24;
}

function drawMotivationalQuote(doc: jsPDF, config: TrackerConfig, y: number): number {
  const colors = getColors(config);
  const pageW = doc.internal.pageSize.getWidth();

  const quotes = [
    '"Sebaik-baik amal adalah yang dilakukan secara konsisten, meskipun sedikit." — HR. Bukhari',
    '"Sesungguhnya Allah menyukai bila seseorang melakukan pekerjaan dengan tekun." — HR. Baihaqi',
    '"Barangsiapa yang menempuh jalan untuk mencari ilmu, Allah mudahkan baginya jalan menuju surga." — HR. Muslim',
  ];
  const quote = quotes[Math.floor(Math.random() * quotes.length)];

  // Light tinted accent background for quote
  doc.setFillColor(
    Math.round(colors.accent[0] * 0.12 + 255 * 0.88),
    Math.round(colors.accent[1] * 0.12 + 255 * 0.88),
    Math.round(colors.accent[2] * 0.12 + 255 * 0.88)
  );
  doc.roundedRect(20, y, pageW - 40, 16, 3, 3, 'F');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text(quote, pageW / 2, y + 10, { align: 'center', maxWidth: pageW - 50 });

  return y + 22;
}

// ===== Habit Data =====

function getDefaultIbadahRows(config: TrackerConfig): string[] {
  if (config.customHabits && config.customHabits.length > 0) return config.customHabits;
  try {
    const saved = JSON.parse(localStorage.getItem('habit_tracker_habits') || '[]');
    if (Array.isArray(saved) && saved.length > 0) return saved.map((h: any) => h.name || h.id).slice(0, 15);
  } catch { /* */ }
  return starterPackHabits.map(h => h.name);
}

// ===== Generators =====

export function generateBlankIbadahTracker(config: TrackerConfig): void {
  const doc = new jsPDF({ orientation: config.orientation, unit: 'mm', format: 'a4' });
  const days = getDayCount(config.period);
  const rows = getDefaultIbadahRows(config);

  // Cover page
  drawCoverPage(doc, config, 'TRACKER IBADAH', 'Checklist Harian Sholat, Dzikir & Tilawah', '📿');

  // Content page
  doc.addPage(undefined, config.orientation);
  drawPageHeader(doc, config, `📿 TRACKER IBADAH — ${config.period === 'weekly' ? 'Mingguan' : 'Bulanan'}`);
  let y = 36;
  y = drawChecklistGrid(doc, config, y, rows, days);
  y = drawNotesSection(doc, config, y);
  y = drawMotivationalQuote(doc, config, y);
  drawPageFooter(doc, config);

  doc.save(`tracker-ibadah-${config.period}.pdf`);
}

export function generateBlankOlahragaTracker(config: TrackerConfig): void {
  const doc = new jsPDF({ orientation: config.orientation, unit: 'mm', format: 'a4' });
  const rowCount = getDayCount(config.period);
  const colW = config.orientation === 'landscape' ? 52 : 38;

  drawCoverPage(doc, config, 'TRACKER OLAHRAGA', 'Log Jenis, Durasi & Intensitas Latihan', '🏃');

  doc.addPage(undefined, config.orientation);
  drawPageHeader(doc, config, `🏃 TRACKER OLAHRAGA — ${config.period === 'weekly' ? 'Mingguan' : 'Bulanan'}`);
  let y = 36;
  y = drawTableGrid(doc, config, y, [
    { label: 'Tanggal', width: colW * 0.7 },
    { label: 'Jenis Olahraga', width: colW },
    { label: 'Durasi (mnt)', width: colW * 0.7 },
    { label: 'Intensitas', width: colW * 0.7 },
    { label: 'Catatan', width: colW },
  ], rowCount);
  y = drawNotesSection(doc, config, y);
  drawPageFooter(doc, config);

  doc.save(`tracker-olahraga-${config.period}.pdf`);
}

export function generateBlankMealTracker(config: TrackerConfig): void {
  const doc = new jsPDF({ orientation: config.orientation, unit: 'mm', format: 'a4' });
  const rowCount = getDayCount(config.period);
  const colW = config.orientation === 'landscape' ? 52 : 38;

  drawCoverPage(doc, config, 'TRACKER MAKANAN', 'Catatan Menu Sahur, Berbuka & Hidrasi', '🍽️');

  doc.addPage(undefined, config.orientation);
  drawPageHeader(doc, config, `🍽️ TRACKER MAKANAN — ${config.period === 'weekly' ? 'Mingguan' : 'Bulanan'}`);
  let y = 36;
  y = drawTableGrid(doc, config, y, [
    { label: 'Tanggal', width: colW * 0.7 },
    { label: 'Menu Sahur', width: colW * 1.2 },
    { label: 'Menu Berbuka', width: colW * 1.2 },
    { label: 'Air (gelas)', width: colW * 0.6 },
    { label: 'Catatan', width: colW },
  ], rowCount);
  drawPageFooter(doc, config);

  doc.save(`tracker-makanan-${config.period}.pdf`);
}

export function generateBlankSedekahTracker(config: TrackerConfig): void {
  const doc = new jsPDF({ orientation: config.orientation, unit: 'mm', format: 'a4' });
  const rowCount = getDayCount(config.period);
  const colW = config.orientation === 'landscape' ? 52 : 38;

  drawCoverPage(doc, config, 'TRACKER SEDEKAH', 'Catatan Jenis, Nominal & Penerima Sedekah', '💝');

  doc.addPage(undefined, config.orientation);
  drawPageHeader(doc, config, `💝 TRACKER SEDEKAH — ${config.period === 'weekly' ? 'Mingguan' : 'Bulanan'}`);
  let y = 36;
  y = drawTableGrid(doc, config, y, [
    { label: 'Tanggal', width: colW * 0.7 },
    { label: 'Jenis Sedekah', width: colW * 1.1 },
    { label: 'Nominal (Rp)', width: colW * 0.9 },
    { label: 'Penerima', width: colW * 0.9 },
    { label: 'Catatan', width: colW },
  ], rowCount);
  drawPageFooter(doc, config);

  doc.save(`tracker-sedekah-${config.period}.pdf`);
}

export function generateBlankTadarusTracker(config: TrackerConfig): void {
  const doc = new jsPDF({ orientation: config.orientation, unit: 'mm', format: 'a4' });
  const colors = getColors(config);
  const margin = 10;

  drawCoverPage(doc, config, 'TRACKER TADARUS', 'Progress Khatam 30 Juz & Log Ayat Harian', '📖');

  doc.addPage(undefined, config.orientation);
  drawPageHeader(doc, config, '📖 TRACKER TADARUS & KHATAM');
  let y = 36;

  // Juz grid section title
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.roundedRect(margin, y, 62, 7, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('📖 Progress Khatam (30 Juz)', margin + 3, y + 5);
  y += 10;

  // Juz grid (10x3)
  const boxSize = 14;
  const gap = 2;
  const cols = 10;
  for (let j = 0; j < 30; j++) {
    const col = j % cols;
    const row = Math.floor(j / cols);
    const bx = margin + col * (boxSize + gap);
    const by = y + row * (boxSize + gap);

    doc.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    doc.setDrawColor(colors.decorative[0], colors.decorative[1], colors.decorative[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(bx, by, boxSize, boxSize, 2, 2, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text(`Juz ${j + 1}`, bx + boxSize / 2, by + boxSize / 2 + 1, { align: 'center' });

    // Small checkbox
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(colors.decorative[0], colors.decorative[1], colors.decorative[2]);
    doc.rect(bx + boxSize - 4.5, by + 1, 3.5, 3.5, 'FD');
  }
  y += Math.ceil(30 / cols) * (boxSize + gap) + 8;

  // Daily log
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.roundedRect(margin, y, 45, 7, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('📝 Log Harian Tadarus', margin + 3, y + 5);
  y += 10;

  const colW = config.orientation === 'landscape' ? 45 : 32;
  const rowCount = config.period === 'weekly' ? 7 : 15;
  y = drawTableGrid(doc, config, y, [
    { label: 'Tanggal', width: colW * 0.7 },
    { label: 'Surah', width: colW },
    { label: 'Dari Ayat', width: colW * 0.6 },
    { label: 'Sampai Ayat', width: colW * 0.6 },
    { label: 'Juz', width: colW * 0.4 },
    { label: 'Catatan', width: colW * 0.8 },
  ], rowCount);

  drawPageFooter(doc, config);
  doc.save(`tracker-tadarus.pdf`);
}

export function generateAllInOneTracker(config: TrackerConfig): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const days = getDayCount(config.period);
  const lConfig = { ...config, orientation: 'landscape' as const };

  drawCoverPage(doc, lConfig, 'ALL-IN-ONE TRACKER', 'Ibadah • Olahraga • Makanan • Sedekah • Tadarus', '⭐');

  doc.addPage(undefined, 'landscape');
  drawPageHeader(doc, lConfig, '⭐ ALL-IN-ONE TRACKER');
  const ibadahRows = getDefaultIbadahRows(config).slice(0, 8);
  let y = 36;
  y = drawChecklistGrid(doc, lConfig, y, ibadahRows, days);

  const pageH = doc.internal.pageSize.getHeight();
  if (y + 50 < pageH) {
    const colW = 38;
    y = drawTableGrid(doc, lConfig, y, [
      { label: 'Tgl', width: colW * 0.5 },
      { label: 'Olahraga', width: colW * 0.9 },
      { label: 'Durasi', width: colW * 0.5 },
      { label: 'Sedekah (Rp)', width: colW * 0.7 },
      { label: 'Air (gelas)', width: colW * 0.5 },
      { label: 'Tadarus (Juz)', width: colW * 0.6 },
      { label: 'Catatan', width: colW * 0.8 },
    ], Math.min(days, 10));
  }

  drawPageFooter(doc, lConfig);
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
