/**
 * TADARUS INTEGRATION LOGIC
 * Framework: JavaScript/TypeScript with Supabase
 */

// 1. DASHBOARD: Mengambil data untuk Tab Tadarus
async function getTadarusStats(userId) {
  const { data, error } = await supabase
    .from('v_tadarus_dashboard')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) return console.error('Error fetching stats:', error);
  
  return {
    totalAyat: data.total_ayat || 0,
    hariTadarus: data.hari_tadarus || 0,
    progressKhatam: `${data.progress_juz || 0}/30 Juz`,
    totalSurat: data.total_surat || 0
  };
}

// 2. TOMBOL TAMBAH: Logika saat klik "+ Tambah" di Dashboard
async function handleAddTadarus(userId, navigation) {
  // Ambil posisi terakhir baca
  const { data: lastRead } = await supabase
    .from('quran_last_read')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (lastRead) {
    // Arahkan ke Al-Quran di ayat terakhir
    navigation.navigate('QuranReader', { 
      surah: lastRead.surah_number, 
      ayah: lastRead.ayah_number 
    });
  } else {
    // Jika belum pernah baca, arahkan ke Al-Fatihah
    navigation.navigate('QuranReader', { surah: 1, ayah: 1 });
  }
}

// 3. QURAN READER: Simpan Progres & Log saat user selesai membaca
async function saveReadingProgress(userId, sessionData) {
  /**
   * sessionData = {
   *   surahStart, ayahStart,
   *   surahEnd, ayahEnd,
   *   totalVerses, juzEnd
   * }
   */
  
  // A. Update Terakhir Baca
  const { error: lrError } = await supabase
    .from('quran_last_read')
    .upsert({
      user_id: userId,
      surah_number: sessionData.surahEnd,
      ayah_number: sessionData.ayahEnd,
      juz_number: sessionData.juzEnd,
      updated_at: new Date()
    });

  // B. Simpan ke Log Tadarus (untuk statistik dashboard)
  const { error: logError } = await supabase
    .from('quran_tadarus_logs')
    .insert({
      user_id: userId,
      surah_start: sessionData.surahStart,
      ayah_start: sessionData.ayahStart,
      surah_end: sessionData.surahEnd,
      ayah_end: sessionData.ayahEnd,
      total_verses: sessionData.totalVerses,
      juz_start: sessionData.juzStart,
      juz_end: sessionData.juzEnd
    });

  if (!lrError && !logError) {
    console.log('Progress saved and log updated!');
  }
}

// 4. BOOKMARK: Simpan Ayat
async function toggleBookmark(userId, surah, ayah, surahName) {
  const { data: existing } = await supabase
    .from('quran_bookmarks')
    .select('id')
    .match({ user_id: userId, surah_number: surah, ayah_number: ayah })
    .single();

  if (existing) {
    // Hapus jika sudah ada
    await supabase.from('quran_bookmarks').delete().eq('id', existing.id);
  } else {
    // Tambah jika belum ada
    await supabase.from('quran_bookmarks').insert({
      user_id: userId,
      surah_number: surah,
      ayah_number: ayah,
      surah_name_id: surahName
    });
  }
}
