const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, apikey, Content-Type, X-Application-Name',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const key = Deno.env.get('GEMINI_API_KEY') ?? '';
  const keyTrimmed = key.trim();
  
  // Test the key with a minimal Gemini request
  let geminiStatus = 'not tested';
  let geminiError = '';
  
  if (keyTrimmed) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${keyTrimmed}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Say "OK" only.' }] }],
            generationConfig: { maxOutputTokens: 10 },
          }),
        }
      );
      if (res.ok) {
        geminiStatus = '✅ KEY VÁLIDA - Gemini funciona correctamente';
      } else {
        const errJson = await res.json().catch(() => ({}));
        geminiStatus = `❌ KEY INVÁLIDA (HTTP ${res.status})`;
        geminiError = errJson?.error?.message ?? res.statusText;
      }
    } catch (e) {
      geminiStatus = `❌ Error de red: ${String(e)}`;
    }
  }

  return new Response(JSON.stringify({
    key_found: !!keyTrimmed,
    key_length: keyTrimmed.length,
    key_starts_with: keyTrimmed.substring(0, 6),
    key_ends_with: keyTrimmed.substring(keyTrimmed.length - 4),
    has_spaces: key !== keyTrimmed,
    gemini_status: geminiStatus,
    gemini_error: geminiError,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });
});
