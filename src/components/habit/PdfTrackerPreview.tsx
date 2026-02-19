import { useState, useMemo } from 'react';
import type { TrackerType, TrackerPeriod, TrackerTheme } from '@/utils/generateHabitPdf';
import { starterPackHabits } from '@/data/defaultHabits';

interface PdfTrackerPreviewProps {
  type: TrackerType;
  period: TrackerPeriod;
  theme: TrackerTheme;
  userName?: string;
  whitelabel?: boolean;
  tagline?: string;
}

const themeColorMap: Record<TrackerTheme, { 
  primary: string; primaryLight: string; secondary: string; 
  accent: string; gradientEnd: string; decorative: string;
}> = {
  green: { primary: '#10783C', primaryLight: '#22AA5A', secondary: '#E6F8EB', accent: '#F5C344', gradientEnd: '#085028', decorative: '#B4E6C3' },
  blue: { primary: '#1946A0', primaryLight: '#376EDC', secondary: '#E6F0FF', accent: '#FFB432', gradientEnd: '#0F2864', decorative: '#B4D2FA' },
  gold: { primary: '#8C6414', primaryLight: '#C39628', secondary: '#FFFAE6', accent: '#B4321E', gradientEnd: '#5A410A', decorative: '#F0DCAA' },
  custom: { primary: '#503290', primaryLight: '#7850C8', secondary: '#F0EBFF', accent: '#F08246', gradientEnd: '#321959', decorative: '#C8B4F0' },
};

const titleMap: Record<TrackerType, { title: string; subtitle: string; emoji: string }> = {
  ibadah: { title: 'TRACKER IBADAH', subtitle: 'Checklist Harian Sholat, Dzikir & Tilawah', emoji: '📿' },
  olahraga: { title: 'TRACKER OLAHRAGA', subtitle: 'Log Jenis, Durasi & Intensitas', emoji: '🏃' },
  makanan: { title: 'TRACKER MAKANAN', subtitle: 'Catatan Sahur, Berbuka & Hidrasi', emoji: '🍽️' },
  sedekah: { title: 'TRACKER SEDEKAH', subtitle: 'Jenis, Nominal & Penerima', emoji: '💝' },
  tadarus: { title: 'TRACKER TADARUS', subtitle: 'Progress Khatam 30 Juz', emoji: '📖' },
  'all-in-one': { title: 'ALL-IN-ONE', subtitle: 'Ibadah • Olahraga • Sedekah', emoji: '⭐' },
};

export const PdfTrackerPreview = ({ type, period, theme, userName, whitelabel, tagline }: PdfTrackerPreviewProps) => {
  const [page, setPage] = useState<'cover' | 'content'>('cover');
  const colors = themeColorMap[theme];
  const info = titleMap[type];
  const days = period === 'weekly' ? 7 : 30;
  const displayDays = Math.min(days, 10);

  const rows = useMemo(() => {
    if (type === 'ibadah' || type === 'all-in-one') {
      try {
        const saved = JSON.parse(localStorage.getItem('habit_tracker_habits') || '[]');
        if (Array.isArray(saved) && saved.length > 0) return saved.map((h: any) => h.name || h.id).slice(0, 5);
      } catch {}
      return starterPackHabits.map(h => h.name).slice(0, 5);
    }
    if (type === 'olahraga') return ['Tanggal', 'Jenis', 'Durasi', 'Intensitas', 'Catatan'];
    if (type === 'makanan') return ['Tanggal', 'Sahur', 'Berbuka', 'Air', 'Catatan'];
    if (type === 'sedekah') return ['Tanggal', 'Jenis', 'Nominal', 'Penerima', 'Catatan'];
    if (type === 'tadarus') return ['Tanggal', 'Surah', 'Dari', 'Sampai', 'Juz'];
    return [];
  }, [type]);

  const isChecklist = type === 'ibadah' || type === 'all-in-one';
  const periodLabel = period === 'weekly' ? '7 HARI' : '30 HARI';

  return (
    <div className="space-y-2">
      {/* Page toggle */}
      <div className="flex gap-1 justify-center">
        <button
          onClick={() => setPage('cover')}
          className={`text-[9px] px-2 py-0.5 rounded-full border transition-all ${page === 'cover' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'}`}
        >
          Cover
        </button>
        <button
          onClick={() => setPage('content')}
          className={`text-[9px] px-2 py-0.5 rounded-full border transition-all ${page === 'content' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'}`}
        >
          Isi
        </button>
      </div>

      <div className="rounded-lg overflow-hidden shadow-md select-none" style={{ aspectRatio: '210/297' }}>
        {page === 'cover' ? (
          /* ===== COVER PAGE ===== */
          <div className="w-full h-full relative flex flex-col items-center justify-between py-4 px-3"
            style={{ background: `linear-gradient(160deg, ${colors.primary}, ${colors.gradientEnd})` }}>
            
            {/* Top border accent */}
            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: colors.accent }} />
            <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ backgroundColor: colors.accent }} />
            <div className="absolute top-0 left-0 bottom-0 w-[3px]" style={{ backgroundColor: colors.primary }} />
            <div className="absolute top-0 right-0 bottom-0 w-[3px]" style={{ backgroundColor: colors.primary }} />
            
            {/* Inner border */}
            <div className="absolute inset-[4px] border rounded-sm" style={{ borderColor: colors.accent }} />

            {/* Decorative circles */}
            <div className="absolute top-[10%] right-[5%] w-16 h-16 rounded-full" style={{ backgroundColor: colors.primaryLight, opacity: 0.15 }} />
            <div className="absolute bottom-[15%] left-[5%] w-12 h-12 rounded-full" style={{ backgroundColor: colors.primaryLight, opacity: 0.1 }} />

            {/* Top area */}
            <div className="text-center z-10 mt-3">
              {/* Decorative ring */}
              <div className="mx-auto w-10 h-10 rounded-full border-2 flex items-center justify-center mb-1" style={{ borderColor: colors.decorative }}>
                <div className="w-7 h-7 rounded-full border flex items-center justify-center" style={{ borderColor: colors.decorative }}>
                  <span className="text-[10px]">{info.emoji}</span>
                </div>
              </div>
            </div>

            {/* Main title */}
            <div className="text-center z-10 -mt-2">
              <p className="text-[14px] font-bold text-white leading-tight tracking-wide">{info.title}</p>
              <p className="text-[6px] mt-0.5" style={{ color: colors.decorative }}>{info.subtitle}</p>
              
              {/* Period badge */}
              <div className="mt-1.5 inline-block px-3 py-0.5 rounded-full" style={{ backgroundColor: colors.accent }}>
                <span className="text-[7px] font-bold text-white">{periodLabel}</span>
              </div>
            </div>

            {/* Name box */}
            <div className="w-[80%] z-10 rounded px-2 py-1.5" style={{ backgroundColor: `${colors.primaryLight}50` }}>
              <p className="text-[5px] text-white/70">Nama:</p>
              <p className="text-[7px] font-bold text-white">{userName || '________________________________'}</p>
            </div>

            {/* Footer */}
            <div className="text-center z-10 mb-1">
              <p className="text-[5px]" style={{ color: colors.decorative }}>
                {whitelabel ? (tagline || '') : 'UmrohConnect • Printable Habit Tracker'}
              </p>
            </div>
          </div>
        ) : (
          /* ===== CONTENT PAGE ===== */
          <div className="w-full h-full bg-white flex flex-col text-[6px]">
            {/* Header bar */}
            <div className="px-2 py-1.5 flex items-center gap-1" style={{ backgroundColor: colors.primary }}>
              <div className="flex-1">
                <p className="font-bold text-[8px] text-white">{info.emoji} {info.title}</p>
                <p className="text-[5px] text-white/80">
                  {userName || '___________'} • Februari 2026
                </p>
              </div>
              {!whitelabel && <span className="text-[4px] text-white/60">UmrohConnect</span>}
            </div>
            {/* Accent stripe */}
            <div className="h-[1.5px]" style={{ backgroundColor: colors.accent }} />

            {/* Body */}
            <div className="flex-1 p-1.5 overflow-hidden">
              {isChecklist ? (
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left px-0.5 w-[35%]" style={{ fontSize: '5px' }}></th>
                      {Array.from({ length: displayDays }, (_, i) => (
                        <th key={i} className="text-center" style={{ color: colors.primary, fontSize: '4px' }}>{i + 1}</th>
                      ))}
                      {days > displayDays && <th style={{ fontSize: '4px', color: '#aaa' }}>…</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, ri) => (
                      <tr key={ri}>
                        <td className="px-0.5 py-[1px] truncate" style={{ 
                          fontSize: '4.5px', color: '#333',
                          backgroundColor: ri % 2 === 0 ? colors.secondary : 'transparent',
                          borderLeft: `1.5px solid ${colors.primary}`
                        }}>{row}</td>
                        {Array.from({ length: displayDays }, (_, i) => (
                          <td key={i} className="border" style={{ 
                            borderColor: colors.decorative, height: '6px',
                            backgroundColor: ri % 2 === 0 ? colors.secondary : 'transparent'
                          }}></td>
                        ))}
                        {days > displayDays && <td className="text-center" style={{ fontSize: '4px', color: '#ccc' }}>…</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : type === 'tadarus' ? (
                <div className="space-y-1">
                  <div className="px-1 py-0.5 rounded text-white inline-block" style={{ backgroundColor: colors.primary, fontSize: '4.5px' }}>📖 Progress Khatam</div>
                  <div className="grid grid-cols-10 gap-[1px]">
                    {Array.from({ length: 30 }, (_, i) => (
                      <div key={i} className="rounded-[1px] text-center border flex items-center justify-center"
                        style={{ backgroundColor: colors.secondary, borderColor: colors.decorative, fontSize: '3.5px', color: colors.primary, height: '7px', fontWeight: 600 }}>
                        {i + 1}
                      </div>
                    ))}
                  </div>
                  <div className="px-1 py-0.5 rounded text-white inline-block" style={{ backgroundColor: colors.primary, fontSize: '4.5px' }}>📝 Log Harian</div>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        {rows.map((col, i) => (
                          <th key={i} className="text-left px-0.5 py-[0.5px] text-white" style={{ backgroundColor: colors.primary, fontSize: '3.5px' }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 3 }, (_, ri) => (
                        <tr key={ri}>
                          {rows.map((_, ci) => (
                            <td key={ci} className="border" style={{ borderColor: colors.decorative, height: '5px', backgroundColor: ri % 2 === 0 ? colors.secondary : 'transparent' }}></td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {rows.map((col, i) => (
                        <th key={i} className="text-left px-0.5 py-[0.5px] text-white rounded-t-sm" style={{ backgroundColor: colors.primary, fontSize: '4px' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: Math.min(days, 6) }, (_, ri) => (
                      <tr key={ri}>
                        {rows.map((_, ci) => (
                          <td key={ci} className="border px-0.5" style={{ borderColor: colors.decorative, height: '6px', backgroundColor: ri % 2 === 0 ? colors.secondary : 'transparent' }}></td>
                        ))}
                      </tr>
                    ))}
                    {days > 6 && (
                      <tr><td colSpan={rows.length} className="text-center py-[1px]" style={{ fontSize: '4px', color: '#999' }}>… {days - 6} baris lagi</td></tr>
                    )}
                  </tbody>
                </table>
              )}

              {/* Notes preview */}
              <div className="mt-1.5">
                <div className="inline-block px-1 py-0.5 rounded text-white mb-0.5" style={{ backgroundColor: colors.primary, fontSize: '4px' }}>📝 Catatan</div>
                <div className="rounded p-1 space-y-[2px]" style={{ backgroundColor: colors.secondary }}>
                  {[1, 2].map(i => <div key={i} className="border-b" style={{ borderColor: colors.decorative, height: '4px' }} />)}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="py-0.5 mx-1.5 rounded-t text-center text-white" style={{ backgroundColor: colors.primary, fontSize: '3.5px' }}>
              {whitelabel ? (tagline || 'Printable Habit Tracker') : 'UmrohConnect • Printable Habit Tracker'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfTrackerPreview;
