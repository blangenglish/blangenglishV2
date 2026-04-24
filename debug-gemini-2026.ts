const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, apikey, Content-Type, X-Application-Name',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const rawKey = Deno.env.get('GEMINI_API_KEY') ?? '';
  const key = rawKey.trim();

  const results: Record<string, string> = {
    key_found: key.length > 0 ? 'yes' : 'NO KEY',
    key_length: String(key.length),
    key_prefix: key.slice(0, 8),
    key_suffix: key.slice(-4),
  };

  const models = [
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-2.0-flash-lite',
  ];

  const prompt = 'Reply with valid JSON only: {"questions":[{"question":"What color is the sky?","options":[{"text":"Blue","isCorrect":true},{"text":"Red","isCorrect":false}],"explanation":"The sky is blue."}]}';

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 512 },
        }),
      });

      const statusCode = resp.status;

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        const errMsg = (errData as Record<string, Record<string, string>>)?.error?.message ?? 'unknown';
        results[model] = `❌ HTTP ${statusCode}: ${errMsg.slice(0, 120)}`;
        continue;
      }

      const data = await resp.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text as string;
      if (text) {
        results[model] = `✅ OK — response length: ${text.length}, preview: ${text.slice(0, 80)}`;
      } else {
        results[model] = `⚠️ HTTP ${statusCode} but empty text — full: ${JSON.stringify(data).slice(0, 200)}`;
      }
    } catch (e) {
      results[model] = `💥 Exception: ${String(e).slice(0, 120)}`;
    }
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });
});
