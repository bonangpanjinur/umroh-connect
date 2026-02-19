import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const API_BASE = 'https://api.alquran.cloud/v1'

function delay(ms: number ) {
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

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin only' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { mode = 'full', surah_number, start_surah = 1, end_surah = 114 } = await req.json()

    const { data: logEntry, error: logError } = await supabase
      .from('quran_sync_logs')
      .insert({
        sync_type: mode === 'full' ? 'full' : 'partial',
        status: 'running',
        error_message: mode === 'full' ? `Syncing surahs ${start_surah} to ${end_surah}` : `Syncing surah ${surah_number}`,
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
      : Array.from({ length: end_surah - start_surah + 1 }, (_, i) => start_surah + i)

    try {
      for (const num of surahsToSync) {
        const [arabicRes, transRes] = await Promise.all([
          fetch(`${API_BASE}/surah/${num}`),
          fetch(`${API_BASE}/surah/${num}/id.indonesian`)
        ])

        if (!arabicRes.ok || !transRes.ok) throw new Error(`Failed to fetch surah ${num}`)
        
        const [arabicData, transData] = await Promise.all([arabicRes.json(), transRes.json()])
        const surahInfo = arabicData.data
        const transInfo = transData.data

        await supabase.from('quran_surahs').update({
          revelation_type: surahInfo.revelationType === 'Meccan' ? 'Makkiyah' : 'Madaniyah',
          english_name: surahInfo.englishName,
          translation_name: surahInfo.englishNameTranslation,
        }).eq('number', num)

        const ayahRows = surahInfo.ayahs.map((ayah: any, idx: number) => ({
          surah_number: num,
          ayah_number: ayah.numberInSurah,
          ayah_global: ayah.number,
          arabic_text: ayah.text,
          translation_id: transInfo.ayahs[idx]?.text || '',
          juz: ayah.juz,
          page: ayah.page,
        }))

        const { error: upsertError } = await supabase.from('quran_ayahs').upsert(ayahRows, { onConflict: 'surah_number,ayah_number' })
        if (upsertError) throw new Error(`Upsert failed: ${upsertError.message}`)

        totalAyahs += ayahRows.length
        totalSurahs++
        if (surahsToSync.length > 5) await delay(50)
      }

      await supabase.from('quran_sync_logs').update({
        status: 'completed',
        surahs_synced: totalSurahs,
        ayahs_synced: totalAyahs,
        completed_at: new Date().toISOString(),
        error_message: null
      }).eq('id', logId)

      return new Response(JSON.stringify({ success: true, surahs_synced: totalSurahs, ayahs_synced: totalAyahs }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    } catch (syncError: any) {
      await supabase.from('quran_sync_logs').update({ status: 'failed', error_message: syncError.message, completed_at: new Date().toISOString() }).eq('id', logId)
      return new Response(JSON.stringify({ error: syncError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
