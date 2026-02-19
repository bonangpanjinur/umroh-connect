import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const API_BASE = 'https://api.alquran.cloud/v1'

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin only' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { mode = 'full', surah_number } = await req.json()

    // Create sync log
    const { data: logEntry, error: logError } = await supabase
      .from('quran_sync_logs')
      .insert({
        sync_type: mode === 'full' ? 'full' : 'partial',
        status: 'running',
      })
      .select()
      .single()

    if (logError) {
      return new Response(JSON.stringify({ error: logError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const logId = logEntry.id
    let totalAyahs = 0
    let totalSurahs = 0

    const surahsToSync = mode === 'surah' && surah_number
      ? [surah_number]
      : Array.from({ length: 114 }, (_, i) => i + 1)

    try {
      for (const num of surahsToSync) {
        // Fetch Arabic
        const arabicRes = await fetch(`${API_BASE}/surah/${num}`)
        if (!arabicRes.ok) throw new Error(`Failed to fetch surah ${num} arabic`)
        const arabicData = await (arabicRes.json())

        // Fetch Indonesian translation
        const transRes = await fetch(`${API_BASE}/surah/${num}/id.indonesian`)
        if (!transRes.ok) throw new Error(`Failed to fetch surah ${num} translation`)
        const transData = await (transRes.json())

        const surahInfo = arabicData.data
        const transInfo = transData.data

        // Update quran_surahs metadata
        await supabase
          .from('quran_surahs')
          .update({
            revelation_type: surahInfo.revelationType === 'Meccan' ? 'Makkiyah' : 'Madaniyah',
            english_name: surahInfo.englishName,
            translation_name: surahInfo.englishNameTranslation,
          })
          .eq('number', num)

        // Upsert ayahs
        const ayahRows = surahInfo.ayahs.map((ayah: any, idx: number) => ({
          surah_number: num,
          ayah_number: ayah.numberInSurah,
          ayah_global: ayah.number,
          arabic_text: ayah.text,
          translation_id: transInfo.ayahs[idx]?.text || '',
          juz: ayah.juz,
          page: ayah.page,
        }))

        const { error: upsertError } = await supabase
          .from('quran_ayahs')
          .upsert(ayahRows, { onConflict: 'surah_number,ayah_number' })

        if (upsertError) throw new Error(`Upsert failed for surah ${num}: ${upsertError.message}`)

        totalAyahs += ayahRows.length
        totalSurahs++

        // Rate limit - reduced to 100ms to prevent timeouts
        if (surahsToSync.length > 1) await delay(100)
      }

      // Update log success
      await supabase
        .from('quran_sync_logs')
        .update({
          status: 'completed',
          surahs_synced: totalSurahs,
          ayahs_synced: totalAyahs,
          completed_at: new Date().toISOString(),
        })
        .eq('id', logId)

      return new Response(JSON.stringify({
        success: true,
        surahs_synced: totalSurahs,
        ayahs_synced: totalAyahs,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    } catch (syncError: any) {
      await supabase
        .from('quran_sync_logs')
        .update({
          status: 'failed',
          error_message: syncError.message,
          surahs_synced: totalSurahs,
          ayahs_synced: totalAyahs,
          completed_at: new Date().toISOString(),
        })
        .eq('id', logId)

      return new Response(JSON.stringify({ error: syncError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
