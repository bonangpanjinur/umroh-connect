import { OpenAI } from 'openai';

// Initialize OpenAI client using the environment variable provided in the sandbox
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true // Necessary for client-side usage in this context
});

export async function generateAIContent(prompt: string, context: string = ''): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini", // Using the available model in the environment
      messages: [
        {
          role: "system",
          content: "Anda adalah asisten konten profesional untuk travel umroh. Tugas Anda adalah membantu membuat judul promosi, subtitle, atau deskripsi paket yang menarik, islami, dan persuasif (copywriting)."
        },
        {
          role: "user",
          content: `Konteks: ${context}\n\nPermintaan: ${prompt}`
        }
      ],
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error generating AI content:', error);
    throw new Error('Gagal menghasilkan konten AI. Pastikan API Key sudah terkonfigurasi.');
  }
}
