import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PackingListRequest {
  departureDate: string;
  returnDate: string;
  gender: 'male' | 'female';
  duration: number;
  preferences?: string[];
}

interface WeatherData {
  makkah: { temp: number; condition: string; humidity: number };
  madinah: { temp: number; condition: string; humidity: number };
}

// Approximate weather data for Makkah/Madinah based on month
const getSeasonalWeather = (date: Date): WeatherData => {
  const month = date.getMonth(); // 0-11
  
  // Makkah weather by season
  const makkahWeather: Record<number, { temp: number; condition: string; humidity: number }> = {
    0: { temp: 24, condition: 'Mild', humidity: 50 }, // Jan
    1: { temp: 25, condition: 'Mild', humidity: 45 },
    2: { temp: 28, condition: 'Warm', humidity: 40 },
    3: { temp: 32, condition: 'Hot', humidity: 35 },
    4: { temp: 37, condition: 'Very Hot', humidity: 30 },
    5: { temp: 40, condition: 'Extremely Hot', humidity: 25 },
    6: { temp: 42, condition: 'Extremely Hot', humidity: 30 },
    7: { temp: 41, condition: 'Extremely Hot', humidity: 35 },
    8: { temp: 38, condition: 'Very Hot', humidity: 40 },
    9: { temp: 34, condition: 'Hot', humidity: 45 },
    10: { temp: 29, condition: 'Warm', humidity: 50 },
    11: { temp: 25, condition: 'Mild', humidity: 55 },
  };
  
  // Madinah weather (slightly cooler)
  const madinahWeather: Record<number, { temp: number; condition: string; humidity: number }> = {
    0: { temp: 18, condition: 'Cool', humidity: 45 },
    1: { temp: 20, condition: 'Mild', humidity: 40 },
    2: { temp: 24, condition: 'Mild', humidity: 35 },
    3: { temp: 30, condition: 'Warm', humidity: 30 },
    4: { temp: 35, condition: 'Hot', humidity: 25 },
    5: { temp: 39, condition: 'Very Hot', humidity: 20 },
    6: { temp: 41, condition: 'Extremely Hot', humidity: 25 },
    7: { temp: 40, condition: 'Very Hot', humidity: 30 },
    8: { temp: 36, condition: 'Hot', humidity: 35 },
    9: { temp: 31, condition: 'Warm', humidity: 40 },
    10: { temp: 24, condition: 'Mild', humidity: 45 },
    11: { temp: 19, condition: 'Cool', humidity: 50 },
  };
  
  return {
    makkah: makkahWeather[month],
    madinah: madinahWeather[month],
  };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { departureDate, returnDate, gender, duration, preferences } = await req.json() as PackingListRequest;
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }
    
    // Get weather data
    const depDate = new Date(departureDate);
    const weather = getSeasonalWeather(depDate);
    
    // Build context for AI
    const weatherContext = `
Cuaca di Makkah: ${weather.makkah.temp}°C, ${weather.makkah.condition}, kelembaban ${weather.makkah.humidity}%
Cuaca di Madinah: ${weather.madinah.temp}°C, ${weather.madinah.condition}, kelembaban ${weather.madinah.humidity}%
    `.trim();
    
    const systemPrompt = `Anda adalah asisten persiapan umroh yang ahli. Buatkan daftar packing list yang lengkap dan terorganisir berdasarkan cuaca, durasi perjalanan, dan jenis kelamin jamaah. 

Berikan rekomendasi dalam bahasa Indonesia dengan format terstruktur. Fokus pada:
1. Pakaian sesuai cuaca dan ibadah
2. Perlengkapan ibadah wajib
3. Kebutuhan kesehatan dan kenyamanan
4. Dokumen penting
5. Elektronik dan aksesori

Berikan tips khusus berdasarkan kondisi cuaca saat keberangkatan.`;

    const userPrompt = `Buatkan packing list untuk:
- Jenis Kelamin: ${gender === 'male' ? 'Laki-laki' : 'Perempuan'}
- Durasi: ${duration} hari
- Tanggal Berangkat: ${departureDate}
- Tanggal Pulang: ${returnDate}
- ${weatherContext}
${preferences && preferences.length > 0 ? `- Preferensi khusus: ${preferences.join(', ')}` : ''}

Berikan dalam format JSON dengan struktur:
{
  "weather_summary": "ringkasan cuaca dan rekomendasi",
  "categories": [
    {
      "name": "nama kategori",
      "icon": "emoji icon",
      "items": [
        {
          "name": "nama item",
          "quantity": "jumlah",
          "priority": "high/medium/low",
          "weather_note": "catatan terkait cuaca jika ada"
        }
      ]
    }
  ],
  "tips": ["tip 1", "tip 2", ...]
}`;

    console.log('Generating packing list with AI...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '';
    
    // Parse JSON from response
    let packingList;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      packingList = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Return structured fallback
      packingList = {
        weather_summary: weatherContext,
        categories: [],
        tips: ['Tidak dapat menghasilkan rekomendasi. Silakan coba lagi.'],
        raw_response: content,
      };
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        weather: weather,
        packing_list: packingList,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating packing list:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
