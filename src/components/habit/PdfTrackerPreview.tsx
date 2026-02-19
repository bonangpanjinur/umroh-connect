import { useMemo } from 'react';
import type { TrackerType, TrackerPeriod, TrackerTheme } from '@/utils/generateHabitPdf';
import { starterPackHabits } from '@/data/defaultHabits';

interface PdfTrackerPreviewProps {
  type: TrackerType;
  period: TrackerPeriod;
  theme: TrackerTheme;
  userName?: string;
}

const themeColorMap: Record<TrackerTheme, { primary: string; secondary: string; headerText: string }> = {
  green: { primary: '#228B22', secondary: '#E6F5E6', headerText: '#FFFFFF' },
  blue: { primary: '#2962FF', secondary: '#E6F0FF', headerText: '#FFFFFF' },
  gold: { primary: '#B28620', secondary: '#FFF8E1', headerText: '#FFFFFF' },
  custom: { primary: '#6366F1', secondary: '#EEF2FF', headerText: '#FFFFFF' },
};

export const PdfTrackerPreview = ({ type, period, theme, userName }: PdfTrackerPreviewProps) => {
  const colors = themeColorMap[theme];
  const days = period === 'weekly' ? 7 : 30;
  const displayDays = Math.min(days, 12); // show max 12 cols in preview

  const rows = useMemo(() => {
    if (type === 'ibadah' || type === 'all-in-one') {
      try {
        const saved = JSON.parse(localStorage.getItem('habit_tracker_habits') || '[]');
        if (Array.isArray(saved) && saved.length > 0) return saved.map((h: any) => h.name || h.id).slice(0, 6);
      } catch {}
      return starterPackHabits.map(h => h.name).slice(0, 6);
    }
    if (type === 'olahraga') return ['Tanggal', 'Jenis', 'Durasi', 'Intensitas', 'Catatan'];
    if (type === 'makanan') return ['Tanggal', 'Sahur', 'Berbuka', 'Air', 'Catatan'];
    if (type === 'sedekah') return ['Tanggal', 'Jenis', 'Nominal', 'Penerima', 'Catatan'];
    if (type === 'tadarus') return ['Tanggal', 'Surah', 'Dari', 'Sampai', 'Juz', 'Catatan'];
    return [];
  }, [type]);

  const titleMap: Record<TrackerType, string> = {
    ibadah: '📿 TRACKER IBADAH',
    olahraga: '🏃 TRACKER OLAHRAGA',
    makanan: '🍽️ TRACKER MAKANAN',
    sedekah: '💝 TRACKER SEDEKAH',
    tadarus: '📖 TRACKER TADARUS',
    'all-in-one': '📿 ALL-IN-ONE',
  };

  const isChecklist = type === 'ibadah' || type === 'all-in-one';

  return (
    <div className="border rounded-lg overflow-hidden shadow-sm bg-white text-[8px] leading-tight select-none" style={{ aspectRatio: '210/297' }}>
      {/* Header */}
      <div className="px-2 py-1.5" style={{ backgroundColor: colors.primary, color: colors.headerText }}>
        <p className="font-bold text-[9px]">{titleMap[type]}</p>
        <p className="text-[6px] opacity-80">
          Nama: {userName || '___________'} &bull; Februari 2026
        </p>
      </div>

      {/* Body */}
      <div className="p-1.5">
        {isChecklist ? (
          /* Checklist Grid */
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left px-0.5 w-[40%]" style={{ color: colors.primary, fontSize: '6px' }}></th>
                {Array.from({ length: displayDays }, (_, i) => (
                  <th key={i} className="text-center px-0" style={{ color: colors.primary, fontSize: '5px', width: `${60 / displayDays}%` }}>
                    {i + 1}
                  </th>
                ))}
                {days > displayDays && <th className="text-center" style={{ fontSize: '5px', color: '#999' }}>…</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} style={{ backgroundColor: ri % 2 === 0 ? colors.secondary : 'transparent' }}>
                  <td className="px-0.5 py-[1px] truncate" style={{ fontSize: '5.5px', color: '#333' }}>{row}</td>
                  {Array.from({ length: displayDays }, (_, i) => (
                    <td key={i} className="border" style={{ borderColor: '#ddd', height: '8px' }}></td>
                  ))}
                  {days > displayDays && <td className="text-center" style={{ fontSize: '5px', color: '#ccc' }}>…</td>}
                </tr>
              ))}
            </tbody>
          </table>
        ) : type === 'tadarus' ? (
          /* Tadarus: Juz Grid + Table */
          <div className="space-y-1.5">
            <p className="font-bold" style={{ color: colors.primary, fontSize: '6px' }}>Progress Khatam (30 Juz)</p>
            <div className="grid grid-cols-10 gap-[2px]">
              {Array.from({ length: 30 }, (_, i) => (
                <div key={i} className="rounded-[2px] text-center border flex items-center justify-center"
                  style={{ backgroundColor: colors.secondary, borderColor: '#ddd', fontSize: '5px', color: '#777', height: '10px' }}>
                  {i + 1}
                </div>
              ))}
            </div>
            <p className="font-bold mt-1" style={{ color: colors.primary, fontSize: '6px' }}>Log Harian</p>
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ backgroundColor: colors.primary }}>
                  {rows.map((col, i) => (
                    <th key={i} className="text-left px-0.5 py-[1px]" style={{ color: '#fff', fontSize: '5px' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 4 }, (_, ri) => (
                  <tr key={ri} style={{ backgroundColor: ri % 2 === 0 ? colors.secondary : 'transparent' }}>
                    {rows.map((_, ci) => (
                      <td key={ci} className="border px-0.5" style={{ borderColor: '#ddd', height: '7px' }}></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Table Grid (olahraga, makanan, sedekah) */
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ backgroundColor: colors.primary }}>
                {rows.map((col, i) => (
                  <th key={i} className="text-left px-0.5 py-[1px]" style={{ color: '#fff', fontSize: '5px' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: Math.min(days, 8) }, (_, ri) => (
                <tr key={ri} style={{ backgroundColor: ri % 2 === 0 ? colors.secondary : 'transparent' }}>
                  {rows.map((_, ci) => (
                    <td key={ci} className="border px-0.5" style={{ borderColor: '#ddd', height: '7px' }}></td>
                  ))}
                </tr>
              ))}
              {days > 8 && (
                <tr><td colSpan={rows.length} className="text-center py-[1px]" style={{ fontSize: '5px', color: '#999' }}>… {days - 8} baris lagi</td></tr>
              )}
            </tbody>
          </table>
        )}

        {/* Notes section */}
        <div className="mt-1.5 space-y-[2px]">
          <p style={{ fontSize: '5.5px', color: '#666', fontWeight: 600 }}>Catatan:</p>
          {[1, 2].map(i => (
            <div key={i} className="border-b" style={{ borderColor: '#ddd', height: '6px' }} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-0.5" style={{ fontSize: '5px', color: '#aaa' }}>
        UmrohConnect • Printable Habit Tracker
      </div>
    </div>
  );
};

export default PdfTrackerPreview;
