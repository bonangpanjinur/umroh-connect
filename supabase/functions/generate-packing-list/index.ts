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

// Generate packing list without AI as fallback
const generateFallbackPackingList = (gender: 'male' | 'female', duration: number, weather: WeatherData) => {
  const isHot = weather.makkah.temp > 35;
  
  const baseItems = {
    weather_summary: `Makkah: ${weather.makkah.temp}°C (${weather.makkah.condition}), Madinah: ${weather.madinah.temp}°C (${weather.madinah.condition})`,
    categories: [
      {
        name: 'Pakaian Ibadah',
        icon: '🕌',
        items: gender === 'male' ? [
          { name: 'Kain Ihram (2 helai)', quantity: '2 set', priority: 'high', weather_note: 'Wajib untuk umroh' },
          { name: 'Sabuk Ihram', quantity: '1', priority: 'high' },
          { name: 'Sandal Ihram', quantity: '1 pasang', priority: 'high' },
        ] : [
          { name: 'Mukena', quantity: '2', priority: 'high' },
          { name: 'Kerudung/Jilbab', quantity: `${Math.ceil(duration/3)}`, priority: 'high' },
          { name: 'Gamis/Abaya', quantity: `${Math.ceil(duration/2)}`, priority: 'high' },
        ]
      },
      {
        name: 'Pakaian Sehari-hari',
        icon: '👔',
        items: [
          { name: 'Baju Ganti', quantity: `${Math.ceil(duration/2)}`, priority: 'high', weather_note: isHot ? 'Pilih bahan ringan & menyerap keringat' : undefined },
          { name: 'Celana/Rok', quantity: `${Math.ceil(duration/3)}`, priority: 'high' },
          { name: 'Pakaian Dalam', quantity: `${duration}`, priority: 'high' },
          { name: 'Kaos Kaki', quantity: `${Math.ceil(duration/2)} pasang`, priority: 'medium' },
        ]
      },
      {
        name: 'Perlengkapan Ibadah',
        icon: '📿',
        items: [
          { name: 'Al-Quran Mini', quantity: '1', priority: 'high' },
          { name: 'Tasbih', quantity: '1', priority: 'medium' },
          { name: 'Buku Doa Umroh', quantity: '1', priority: 'high' },
          { name: 'Sajadah Lipat', quantity: '1', priority: 'medium' },
        ]
      },
      {
        name: 'Dokumen Penting',
        icon: '📄',
        items: [
          { name: 'Paspor (min 6 bulan valid)', quantity: '1', priority: 'high' },
          { name: 'Visa Umroh', quantity: '1', priority: 'high' },
          { name: 'Tiket Pesawat', quantity: '1', priority: 'high' },
          { name: 'Fotokopi Dokumen', quantity: '2 set', priority: 'high' },
          { name: 'Pas Foto 4x6', quantity: '4 lembar', priority: 'medium' },
        ]
      },
      {
        name: 'Kesehatan & Toiletries',
        icon: '💊',
        items: [
          { name: 'Obat Pribadi', quantity: 'secukupnya', priority: 'high' },
          { name: 'Masker', quantity: '10+', priority: 'high' },
          { name: 'Hand Sanitizer', quantity: '2', priority: 'high' },
          { name: 'Sunscreen SPF 50+', quantity: '1', priority: isHot ? 'high' : 'medium', weather_note: isHot ? 'WAJIB untuk cuaca panas' : undefined },
          { name: 'Lip Balm', quantity: '1', priority: 'medium' },
          { name: 'Lotion Pelembab', quantity: '1', priority: 'medium' },
        ]
      },
      {
        name: 'Elektronik',
        icon: '🔌',
        items: [
          { name: 'Handphone + Charger', quantity: '1 set', priority: 'high' },
          { name: 'Power Bank 20000mAh', quantity: '1', priority: 'high' },
          { name: 'Adapter Colokan (Type G)', quantity: '1', priority: 'high' },
          { name: 'Earphone', quantity: '1', priority: 'low' },
        ]
      },
      {
        name: 'Lain-lain',
        icon: '🎒',
        items: [
          { name: 'Tas Kecil untuk Thawaf', quantity: '1', priority: 'high' },
          { name: 'Botol Minum Lipat', quantity: '1', priority: 'high' },
          { name: 'Payung Lipat', quantity: '1', priority: isHot ? 'high' : 'medium', weather_note: isHot ? 'Penting untuk cuaca panas' : undefined },
          { name: 'Kacamata Hitam', quantity: '1', priority: 'medium' },
          { name: 'Gembok Koper', quantity: '2', priority: 'medium' },
        ]
      },
    ],
    tips: [
      isHot ? 'Cuaca panas! Bawa payung, sunscreen, dan minum air yang cukup.' : 'Cuaca cukup nyaman, tetap bawa sunscreen.',
      'Gunakan koper dengan roda 4 untuk kemudahan di bandara.',
      'Siapkan tas kecil berisi dokumen penting untuk dibawa saat beribadah.',
      'Bawa obat-obatan pribadi dalam kemasan asli.',
      `Untuk ${duration} hari, bawa pakaian secukupnya - bisa cuci di hotel.`,
    ],
  };
  
  return baseItems;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { departureDate, returnDate, gender, duration, preferences } = await req.json() as PackingListRequest;
    
    console.log('Generating packing list for:', { departureDate, returnDate, gender, duration });
    
    // Get weather data
    const depDate = new Date(departureDate);
    const weather = getSeasonalWeather(depDate);
    
    // Check for LOVABLE_API_KEY
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      console.log('LOVABLE_API_KEY not found, using fallback packing list');
      const fallbackList = generateFallbackPackingList(gender, duration, weather);
      return new Response(
        JSON.stringify({
          success: true,
          weather: weather,
          packing_list: fallbackList,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }
    
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

    console.log('Calling AI gateway...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('AI gateway error:', response.status);
      
      if (response.status === 429) {
        // Rate limit - use fallback
        console.log('Rate limited, using fallback');
        const fallbackList = generateFallbackPackingList(gender, duration, weather);
        return new Response(
          JSON.stringify({
            success: true,
            weather: weather,
            packing_list: fallbackList,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }
      
      if (response.status === 402) {
        console.log('Credits exhausted, using fallback');
        const fallbackList = generateFallbackPackingList(gender, duration, weather);
        return new Response(
          JSON.stringify({
            success: true,
            weather: weather,
            packing_list: fallbackList,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }
      
      // Other errors - use fallback
      const fallbackList = generateFallbackPackingList(gender, duration, weather);
      return new Response(
        JSON.stringify({
          success: true,
          weather: weather,
          packing_list: fallbackList,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '';
    
    console.log('AI response received');
    
    // Parse JSON from response
    let packingList;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      packingList = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response, using fallback');
      packingList = generateFallbackPackingList(gender, duration, weather);
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
    
    // Return fallback on any error
    try {
      const weather = getSeasonalWeather(new Date());
      const fallbackList = generateFallbackPackingList('male', 9, weather);
      return new Response(
        JSON.stringify({
          success: true,
          weather: weather,
          packing_list: fallbackList,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch {
      return new Response(
        JSON.stringify({ error: errorMessage }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
  }
});
