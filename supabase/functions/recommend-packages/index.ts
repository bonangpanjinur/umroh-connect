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

// Simple scoring function
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

// Generate reasoning
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
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

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
