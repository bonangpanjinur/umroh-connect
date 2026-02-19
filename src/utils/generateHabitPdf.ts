import jsPDF from 'jspdf';

export interface PdfReportConfig {
  dateRange: { start: string; end: string };
  theme: 'green' | 'blue' | 'gold' | 'custom';
  customColor?: string;
  userName: string;
  tagline?: string;
  logoBase64?: string;
  whitelabel: boolean;
  orientation: 'portrait' | 'landscape';
}

interface HabitStats {
  totalCompleted: number;
  totalHabits: number;
  streak: number;
  weeklyRate: number;
}

interface OlahragaStats {
  totalMinutes: number;
  totalSessions: number;
  types: string[];
}

interface SedekahStats {
  totalAmount: number;
  totalCount: number;
  types: string[];
}

interface MealStats {
  totalDays: number;
  avgWater: number;
}

interface TadarusStats {
  totalAyat: number;
  totalJuz: number;
  khatamProgress: number;
}

export interface PdfReportData {
  habits: HabitStats;
  olahraga: OlahragaStats;
  sedekah: SedekahStats;
  meals: MealStats;
  tadarus: TadarusStats;
}

const themeColors: Record<string, { primary: number[]; secondary: number[]; accent: number[] }> = {
  green: { primary: [34, 139, 34], secondary: [144, 238, 144], accent: [0, 100, 0] },
  blue: { primary: [41, 98, 255], secondary: [173, 216, 230], accent: [0, 0, 139] },
  gold: { primary: [218, 165, 32], secondary: [255, 223, 0], accent: [139, 119, 42] },
  custom: { primary: [99, 102, 241], secondary: [199, 210, 254], accent: [67, 56, 202] },
};

export function collectHabitData(startDate: string, endDate: string): PdfReportData {
  // Collect from localStorage
  const getLocalData = (key: string) => {
    try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; }
  };

  // Habit stats from local tracking
  const habitLogs = getLocalData('local_habit_tracking');
  let totalCompleted = 0;
  let totalDays = 0;
  Object.keys(habitLogs).forEach(date => {
    if (date >= startDate && date <= endDate) {
      const dayData = habitLogs[date] || {};
      totalCompleted += Object.values(dayData).filter(Boolean).length;
      totalDays++;
    }
  });

  const habits: HabitStats = {
    totalCompleted,
    totalHabits: totalDays * 5, // approximate
    streak: Number(localStorage.getItem('habit_streak') || '0'),
    weeklyRate: totalDays > 0 ? Math.round((totalCompleted / Math.max(totalDays * 5, 1)) * 100) : 0,
  };

  // Olahraga
  const olahragaLogs = getLocalData('local_olahraga_logs');
  let olahragaMinutes = 0;
  let olahragaSessions = 0;
  const olahragaTypes = new Set<string>();
  Object.keys(olahragaLogs).forEach(date => {
    if (date >= startDate && date <= endDate) {
      const entries = olahragaLogs[date] || [];
      if (Array.isArray(entries)) {
        entries.forEach((e: any) => {
          olahragaMinutes += e.duration || 0;
          olahragaSessions++;
          if (e.type) olahragaTypes.add(e.type);
        });
      }
    }
  });

  // Sedekah
  const sedekahLogs = getLocalData('local_sedekah_logs');
  let sedekahTotal = 0;
  let sedekahCount = 0;
  const sedekahTypes = new Set<string>();
  Object.keys(sedekahLogs).forEach(date => {
    if (date >= startDate && date <= endDate) {
      const entries = sedekahLogs[date] || [];
      if (Array.isArray(entries)) {
        entries.forEach((e: any) => {
          sedekahTotal += e.amount || 0;
          sedekahCount++;
          if (e.type) sedekahTypes.add(e.type);
        });
      }
    }
  });

  // Meals
  const mealLogs = getLocalData('meal_tracking');
  let mealDays = 0;
  let totalWater = 0;
  Object.keys(mealLogs).forEach(date => {
    if (date >= startDate && date <= endDate) {
      mealDays++;
      totalWater += mealLogs[date]?.water || 0;
    }
  });

  // Tadarus
  const tadarusLogs = getLocalData('local_tadarus_logs');
  let totalAyat = 0;
  let totalJuz = 0;
  Object.keys(tadarusLogs).forEach(date => {
    if (date >= startDate && date <= endDate) {
      const entry = tadarusLogs[date];
      if (entry) {
        totalAyat += entry.ayat || 0;
        totalJuz += entry.juz || 0;
      }
    }
  });

  const khatamTarget = Number(localStorage.getItem('khatam_target_juz') || '30');
  const khatamProgress = khatamTarget > 0 ? Math.min(100, Math.round((totalJuz / khatamTarget) * 100)) : 0;

  return {
    habits,
    olahraga: { totalMinutes: olahragaMinutes, totalSessions: olahragaSessions, types: [...olahragaTypes] },
    sedekah: { totalAmount: sedekahTotal, totalCount: sedekahCount, types: [...sedekahTypes] },
    meals: { totalDays: mealDays, avgWater: mealDays > 0 ? Math.round(totalWater / mealDays) : 0 },
    tadarus: { totalAyat, totalJuz, khatamProgress },
  };
}

export function generateHabitPdf(config: PdfReportConfig, data: PdfReportData): void {
  const doc = new jsPDF({ orientation: config.orientation, unit: 'mm', format: 'a4' });
  const colors = themeColors[config.theme] || themeColors.green;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  
  // Background
  doc.setFillColor(250, 250, 252);
  doc.rect(0, 0, pageW, pageH, 'F');

  // Header bar
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, pageW, 35, 'F');

  // Logo or branding
  let headerY = 14;
  if (config.logoBase64) {
    try {
      doc.addImage(config.logoBase64, 'PNG', 10, 5, 25, 25);
      headerY = 14;
    } catch { /* ignore */ }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const titleX = config.logoBase64 ? 40 : 10;
  doc.text(config.whitelabel ? (config.tagline || 'Laporan Ibadah') : 'Laporan Ibadah', titleX, headerY);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${config.userName} • ${config.dateRange.start} s/d ${config.dateRange.end}`, titleX, headerY + 7);

  if (!config.whitelabel) {
    doc.setFontSize(8);
    doc.text('UmrohConnect', pageW - 10, 8, { align: 'right' });
  }

  let y = 45;

  // Helper to draw stat card
  const drawCard = (x: number, y: number, w: number, h: number, title: string, items: [string, string][]) => {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, w, h, 3, 3, 'F');
    doc.setDrawColor(230, 230, 235);
    doc.roundedRect(x, y, w, h, 3, 3, 'S');

    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(title, x + 5, y + 8);

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    items.forEach(([label, value], i) => {
      const itemY = y + 16 + i * 7;
      doc.text(label, x + 5, itemY);
      doc.setFont('helvetica', 'bold');
      doc.text(value, x + w - 5, itemY, { align: 'right' });
      doc.setFont('helvetica', 'normal');
    });
  };

  const cardW = (pageW - 30) / 2;

  // Ibadah
  drawCard(10, y, cardW, 40, '🕌 Ibadah', [
    ['Habit Selesai', `${data.habits.totalCompleted}`],
    ['Streak', `${data.habits.streak} hari`],
    ['Rate Mingguan', `${data.habits.weeklyRate}%`],
  ]);

  // Olahraga
  drawCard(15 + cardW, y, cardW, 40, '🏃 Olahraga', [
    ['Total Sesi', `${data.olahraga.totalSessions}`],
    ['Total Menit', `${data.olahraga.totalMinutes}`],
    ['Jenis', data.olahraga.types.length > 0 ? data.olahraga.types.slice(0, 3).join(', ') : '-'],
  ]);

  y += 48;

  // Makanan
  drawCard(10, y, cardW, 40, '🍽️ Makanan', [
    ['Hari Tercatat', `${data.meals.totalDays}`],
    ['Rata-rata Air', `${data.meals.avgWater} gelas`],
    ['Konsistensi', data.meals.totalDays > 0 ? 'Aktif' : '-'],
  ]);

  // Sedekah
  const fmtRp = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;
  drawCard(15 + cardW, y, cardW, 40, '💝 Sedekah', [
    ['Total Nominal', fmtRp(data.sedekah.totalAmount)],
    ['Frekuensi', `${data.sedekah.totalCount}x`],
    ['Jenis', data.sedekah.types.length > 0 ? data.sedekah.types.slice(0, 3).join(', ') : '-'],
  ]);

  y += 48;

  // Tadarus
  drawCard(10, y, cardW, 40, '📖 Tadarus', [
    ['Total Ayat', `${data.tadarus.totalAyat}`],
    ['Total Juz', `${data.tadarus.totalJuz}`],
    ['Khatam Progress', `${data.tadarus.khatamProgress}%`],
  ]);

  // Summary
  drawCard(15 + cardW, y, cardW, 40, '📊 Ringkasan', [
    ['Total Aktivitas', `${data.habits.totalCompleted + data.olahraga.totalSessions + data.sedekah.totalCount}`],
    ['Hari Aktif', `${data.meals.totalDays}`],
    ['Konsistensi', `${data.habits.weeklyRate}%`],
  ]);

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  doc.text(
    config.whitelabel
      ? `Digenerate pada ${new Date().toLocaleDateString('id-ID')}`
      : `Digenerate oleh UmrohConnect pada ${new Date().toLocaleDateString('id-ID')}`,
    pageW / 2,
    pageH - 8,
    { align: 'center' }
  );

  doc.save(`laporan-ibadah-${config.dateRange.start}.pdf`);
}
