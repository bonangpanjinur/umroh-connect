import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppReminderRequest {
  phone: string;
  message: string;
  type: 'payment' | 'departure' | 'document' | 'general';
}

// Format phone number for WhatsApp (ensure +62 format)
const formatPhoneNumber = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  
  return cleaned;
};

// Generate WhatsApp deep link URL
const generateWhatsAppUrl = (phone: string, message: string): string => {
  const formattedPhone = formatPhoneNumber(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
};

// Message templates
const messageTemplates = {
  payment: (data: { packageName: string; amount: string; dueDate: string; bookingCode: string }) => 
`🕌 *ARAH UMROH - Pengingat Pembayaran*

Assalamu'alaikum Wr. Wb.

Kami ingin mengingatkan pembayaran untuk:
📦 *Paket:* ${data.packageName}
💰 *Nominal:* ${data.amount}
📅 *Jatuh Tempo:* ${data.dueDate}
🎫 *Kode Booking:* ${data.bookingCode}

Mohon segera melakukan pembayaran sebelum jatuh tempo.

Jazakallahu Khairan 🤲

_Pesan ini dikirim otomatis oleh Arah Umroh_`,

  departure: (data: { packageName: string; departureDate: string; daysLeft: number }) =>
`✈️ *ARAH UMROH - Pengingat Keberangkatan*

Assalamu'alaikum Wr. Wb.

🕋 *${data.daysLeft === 0 ? 'HARI INI BERANGKAT!' : data.daysLeft === 1 ? 'BESOK BERANGKAT!' : `${data.daysLeft} HARI LAGI!`}*

📦 *Paket:* ${data.packageName}
📅 *Tanggal:* ${data.departureDate}

Pastikan semua persiapan sudah lengkap:
✅ Paspor & Visa
✅ Tiket Pesawat
✅ Kain Ihram
✅ Perlengkapan Ibadah
✅ Obat-obatan pribadi

Semoga perjalanan umroh Anda berkah dan lancar. Aamiin 🤲

_Pesan ini dikirim otomatis oleh Arah Umroh_`,

  document: (data: { documentType: string; deadline?: string }) =>
`📋 *ARAH UMROH - Pengingat Dokumen*

Assalamu'alaikum Wr. Wb.

Mohon segera melengkapi dokumen:
📄 *${data.documentType}*
${data.deadline ? `⏰ *Batas Waktu:* ${data.deadline}` : ''}

Dokumen lengkap memastikan kelancaran perjalanan umroh Anda.

Jazakallahu Khairan 🤲

_Pesan ini dikirim otomatis oleh Arah Umroh_`,

  general: (data: { title: string; body: string }) =>
`🕌 *ARAH UMROH*

Assalamu'alaikum Wr. Wb.

*${data.title}*

${data.body}

Jazakallahu Khairan 🤲

_Pesan ini dikirim otomatis oleh Arah Umroh_`,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { phone, message, type, templateData } = body;
    
    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    let finalMessage = message;
    
    // Use template if templateData is provided
    if (templateData && type && messageTemplates[type as keyof typeof messageTemplates]) {
      const templateFn = messageTemplates[type as keyof typeof messageTemplates];
      finalMessage = templateFn(templateData);
    }
    
    if (!finalMessage) {
      return new Response(
        JSON.stringify({ error: 'Message content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Generate WhatsApp URL
    const whatsappUrl = generateWhatsAppUrl(phone, finalMessage);
    
    console.log(`Generated WhatsApp URL for ${phone}, type: ${type}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        whatsapp_url: whatsappUrl,
        formatted_phone: formatPhoneNumber(phone),
        message_preview: finalMessage.substring(0, 100) + '...',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating WhatsApp reminder:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
