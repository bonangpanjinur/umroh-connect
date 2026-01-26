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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { preferences } = await req.json() as { preferences: PackagePreferences };
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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

    if (pkgError) throw pkgError;

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

    // Call AI Gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit tercapai, silakan coba lagi nanti." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Kuota AI habis, silakan hubungi admin." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";

    // Parse AI response (extract JSON from response)
    let recommendations;
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in AI response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiContent);
      // Fallback: return top packages by rating
      recommendations = {
        recommendations: filteredPackages.slice(0, 3).map((pkg: any, idx: number) => ({
          packageIndex: idx + 1,
          matchScore: 80 - idx * 10,
          reasoning: `Paket ini sesuai dengan budget dan durasi yang Anda inginkan.`
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
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
