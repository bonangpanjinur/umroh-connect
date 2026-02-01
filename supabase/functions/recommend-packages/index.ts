import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PackagePreferences {
  budget: {
    min: number;
    max: number;
  };
  duration: {
    min: number;
    max: number;
  };
  hotelStar: number;
  flightType?: 'direct' | 'transit' | 'any';
}

// Simple scoring function for fallback
const scorePackage = (pkg: any, preferences: PackagePreferences): number => {
  let score = 50; // Base score
  
  // Hotel star match
  if (pkg.hotel_star) {
    if (pkg.hotel_star >= preferences.hotelStar) {
      score += 20;
    } else {
      score -= (preferences.hotelStar - pkg.hotel_star) * 10;
    }
  }
  
  // Flight type match
  if (preferences.flightType && preferences.flightType !== 'any' && pkg.flight_type === preferences.flightType) {
    score += 15;
  }
  
  // Travel rating bonus
  if (pkg.travel?.rating) {
    score += pkg.travel.rating * 3;
  }
  
  // Verified travel bonus
  if (pkg.travel?.verified) {
    score += 10;
  }
  
  return Math.min(100, Math.max(0, score));
};

// Generate reasoning for fallback
const generateReasoning = (pkg: any, preferences: PackagePreferences): string => {
  const reasons: string[] = [];
  
  if (pkg.hotel_star >= preferences.hotelStar) {
    reasons.push(`Hotel ${pkg.hotel_star} bintang sesuai dengan preferensi Anda`);
  }
  
  if (pkg.travel?.verified) {
    reasons.push(`Travel agent terverifikasi`);
  }
  
  if (pkg.travel?.rating && pkg.travel.rating >= 4) {
    reasons.push(`Rating tinggi (${pkg.travel.rating}/5)`);
  }
  
  if (pkg.flight_type === 'direct') {
    reasons.push(`Penerbangan langsung`);
  }
  
  if (reasons.length === 0) {
    reasons.push(`Paket ini sesuai dengan budget dan durasi yang Anda inginkan`);
  }
  
  return reasons.join('. ') + '.';
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { preferences } = await req.json() as { preferences: PackagePreferences };
    
    console.log('Getting recommendations for preferences:', preferences);
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch packages with departures
    const { data: packages, error: pkgError } = await supabase
      .from("packages")
      .select(`
        id, name, description, duration_days, hotel_star, flight_type, 
        airline, hotel_makkah, hotel_madinah, facilities, package_type,
        travel:travels(id, name, logo_url, rating, verified),
        departures(id, departure_date, return_date, price, original_price, available_seats, status)
      `)
      .eq("is_active", true)
      .eq("package_type", "umroh")
      .order("created_at", { ascending: false });

    if (pkgError) {
      console.error('Error fetching packages:', pkgError);
      throw pkgError;
    }

    console.log(`Found ${packages?.length || 0} packages`);

    // Filter packages based on preferences
    const filteredPackages = (packages || []).filter((pkg: any) => {
      // Check duration
      if (pkg.duration_days < preferences.duration.min || pkg.duration_days > preferences.duration.max) {
        return false;
      }
      
      // Check hotel star
      if (preferences.hotelStar > 0 && pkg.hotel_star && pkg.hotel_star < preferences.hotelStar) {
        return false;
      }
      
      // Check flight type
      if (preferences.flightType && preferences.flightType !== 'any' && pkg.flight_type !== preferences.flightType) {
        return false;
      }
      
      // Check price range from departures
      const availableDepartures = (pkg.departures || []).filter(
        (d: any) => d.status !== 'full' && d.price >= preferences.budget.min && d.price <= preferences.budget.max
      );
      
      return availableDepartures.length > 0;
    });

    console.log(`Filtered to ${filteredPackages.length} packages`);

    if (filteredPackages.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          recommendations: [],
          summary: "Tidak ada paket yang sesuai dengan preferensi Anda. Coba ubah kriteria pencarian.",
          totalMatches: 0
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // If no API key, use fallback scoring
    if (!LOVABLE_API_KEY) {
      console.log('No LOVABLE_API_KEY, using fallback scoring');
      
      const scoredPackages = filteredPackages
        .map((pkg: any) => {
          const score = scorePackage(pkg, preferences);
          const cheapestDeparture = (pkg.departures || [])
            .filter((d: any) => d.status !== 'full')
            .sort((a: any, b: any) => a.price - b.price)[0];
          
          return {
            package: {
              ...pkg,
              departures: pkg.departures?.filter((d: any) => d.status !== 'full').slice(0, 3)
            },
            matchScore: score,
            reasoning: generateReasoning(pkg, preferences),
            lowestPrice: cheapestDeparture?.price
          };
        })
        .sort((a: any, b: any) => b.matchScore - a.matchScore)
        .slice(0, 3);

      return new Response(
        JSON.stringify({
          success: true,
          recommendations: scoredPackages,
          summary: "Berikut adalah paket-paket terbaik berdasarkan preferensi Anda.",
          totalMatches: filteredPackages.length
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare package summaries for AI
    const packageSummaries = filteredPackages.slice(0, 10).map((pkg: any, index: number) => {
      const cheapestDeparture = (pkg.departures || [])
        .filter((d: any) => d.status !== 'full')
        .sort((a: any, b: any) => a.price - b.price)[0];
      
      return `${index + 1}. ${pkg.name} (${pkg.travel?.name})
   - Durasi: ${pkg.duration_days} hari
   - Hotel: ${pkg.hotel_star}* (${pkg.hotel_makkah})
   - Airline: ${pkg.airline || 'N/A'} (${pkg.flight_type || 'N/A'})
   - Harga mulai: Rp ${cheapestDeparture?.price?.toLocaleString('id-ID') || 'N/A'}
   - Rating Travel: ${pkg.travel?.rating || 'N/A'}/5
   - Fasilitas: ${(pkg.facilities || []).slice(0, 3).join(', ')}`;
    }).join('\n\n');

    const systemPrompt = `Anda adalah asisten AI yang ahli dalam merekomendasikan paket umroh terbaik untuk calon jamaah Indonesia. 
Berdasarkan preferensi yang diberikan, analisis paket-paket yang tersedia dan berikan rekomendasi TOP 3 paket terbaik.

Format output HARUS dalam JSON dengan struktur:
{
  "recommendations": [
    {
      "packageIndex": number (1-based index),
      "matchScore": number (0-100),
      "reasoning": "penjelasan singkat mengapa paket ini cocok dalam Bahasa Indonesia"
    }
  ],
  "summary": "ringkasan singkat rekomendasi dalam Bahasa Indonesia"
}`;

    const userPrompt = `Preferensi Jamaah:
- Budget: Rp ${preferences.budget.min.toLocaleString('id-ID')} - Rp ${preferences.budget.max.toLocaleString('id-ID')}
- Durasi: ${preferences.duration.min} - ${preferences.duration.max} hari
- Minimal Bintang Hotel: ${preferences.hotelStar}*
- Preferensi Penerbangan: ${preferences.flightType || 'Tidak ada preferensi'}

Paket Tersedia:
${packageSummaries || 'Tidak ada paket yang tersedia sesuai kriteria.'}

Berikan rekomendasi TOP 3 paket terbaik berdasarkan preferensi di atas.`;

    console.log('Calling AI gateway...');
    
    // Call AI Gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI gateway error:', aiResponse.status);
      
      // Use fallback scoring on any AI error
      const scoredPackages = filteredPackages
        .map((pkg: any) => {
          const score = scorePackage(pkg, preferences);
          const cheapestDeparture = (pkg.departures || [])
            .filter((d: any) => d.status !== 'full')
            .sort((a: any, b: any) => a.price - b.price)[0];
          
          return {
            package: {
              ...pkg,
              departures: pkg.departures?.filter((d: any) => d.status !== 'full').slice(0, 3)
            },
            matchScore: score,
            reasoning: generateReasoning(pkg, preferences),
            lowestPrice: cheapestDeparture?.price
          };
        })
        .sort((a: any, b: any) => b.matchScore - a.matchScore)
        .slice(0, 3);

      return new Response(
        JSON.stringify({
          success: true,
          recommendations: scoredPackages,
          summary: "Berikut adalah paket-paket terbaik berdasarkan preferensi Anda.",
          totalMatches: filteredPackages.length
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";

    console.log('AI response received');

    // Parse AI response (extract JSON from response)
    let recommendations;
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiContent.match(/```json\s*([\s\S]*?)\s*```/) || aiContent.match(/```\s*([\s\S]*?)\s*```/) || aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        recommendations = JSON.parse(jsonStr);
      } else {
        throw new Error("No JSON found in AI response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response, using fallback");
      // Fallback: return top packages by rating
      recommendations = {
        recommendations: filteredPackages.slice(0, 3).map((pkg: any, idx: number) => ({
          packageIndex: idx + 1,
          matchScore: 85 - idx * 5,
          reasoning: generateReasoning(pkg, preferences)
        })),
        summary: "Berikut adalah paket-paket yang sesuai dengan preferensi Anda."
      };
    }

    // Map recommendations back to actual package data
    const recommendedPackages = (recommendations.recommendations || []).map((rec: any) => {
      const pkg = filteredPackages[rec.packageIndex - 1];
      if (!pkg) return null;
      
      const cheapestDeparture = (pkg.departures || [])
        .filter((d: any) => d.status !== 'full')
        .sort((a: any, b: any) => a.price - b.price)[0];
      
      return {
        package: {
          ...pkg,
          departures: pkg.departures?.filter((d: any) => d.status !== 'full').slice(0, 3)
        },
        matchScore: rec.matchScore,
        reasoning: rec.reasoning,
        lowestPrice: cheapestDeparture?.price
      };
    }).filter(Boolean);

    return new Response(
      JSON.stringify({
        success: true,
        recommendations: recommendedPackages,
        summary: recommendations.summary,
        totalMatches: filteredPackages.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Recommend packages error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        success: false,
        recommendations: [],
        summary: "Terjadi kesalahan. Silakan coba lagi."
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
