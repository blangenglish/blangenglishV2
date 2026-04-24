const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, apikey, Content-Type, X-Application-Name',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const key = (Deno.env.get('GEMINI_API_KEY') ?? '').trim();

  // List available models
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
  );
  const data = await res.json();

  // Filter only models that support generateContent
  const models = (data.models ?? [])
    .filter((m: { supportedGenerationMethods?: string[] }) =>
      m.supportedGenerationMethods?.includes('generateContent')
    )
    .map((m: { name: string; displayName?: string }) => ({
      name: m.name,
      displayName: m.displayName,
    }));

  // Also try a quick test with gemini-2.0-flash
  let testResult = '';
  const testModels = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash-latest', 'gemini-1.5-pro-latest', 'gemini-pro'];
  for (const model of testModels) {
    const testRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Say OK' }] }],
          generationConfig: { maxOutputTokens: 5 },
        }),
      }
    );
    if (testRes.ok) {
      testResult = `✅ ${model} FUNCIONA`;
      break;
    } else {
      const e = await testRes.json().catch(() => ({}));
      testResult = `❌ ${model}: ${e?.error?.message ?? testRes.status}`;
    }
  }

  return new Response(JSON.stringify({
    available_models: models.slice(0, 20),
    first_working_model: testResult,
    http_status: res.status,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });
});
