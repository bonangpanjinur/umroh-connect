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

// Generate packing list
const generatePackingList = (gender: 'male' | 'female', duration: number, weather: WeatherData) => {
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
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { departureDate, returnDate, gender, duration } = await req.json() as PackingListRequest;
    
    console.log('Generating packing list for:', { departureDate, returnDate, gender, duration });
    
    // Get weather data
    const depDate = new Date(departureDate);
    const weather = getSeasonalWeather(depDate);
    
    const packingList = generatePackingList(gender, duration, weather);
    
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
