const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, apikey, Content-Type, X-Application-Name',
};

type QuizType = 'multiple_choice' | 'multiple_select' | 'true_false' | 'match' | 'organize' | 'rewrite';

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
  correctAnswer?: string;
}

interface QuizQuestion {
  id: string;
  type: QuizType;
  question: string;
  options: QuizOption[];
  correctAnswer?: string;
  explanation?: string;
}

function buildPrompt(instructions: string, num: number, defaultType: QuizType): string {
  const formatByType: Record<QuizType, string> = {
    multiple_choice: `{"question":"Which sentence uses Present Simple correctly?","options":[{"text":"She go to school","isCorrect":false},{"text":"She goes to school","isCorrect":true},{"text":"She going to school","isCorrect":false},{"text":"She gone to school","isCorrect":false}],"explanation":"Use -s/es for he/she/it in Present Simple."}`,
    multiple_select: `{"question":"Which sentences are correct?","options":[{"text":"She goes to school","isCorrect":true},{"text":"He run fast","isCorrect":false},{"text":"They play football","isCorrect":true},{"text":"I am goes","isCorrect":false}],"explanation":"Present Simple for he/she/it adds -s."}`,
    true_false: `{"question":"In Present Simple, we add -s to the verb for he/she/it.","options":[{"text":"True","isCorrect":true},{"text":"False","isCorrect":false}],"explanation":"Yes, he goes, she runs, it works."}`,
    match: `{"question":"Match each letter with its pronunciation.","pairs":[{"left":"A","right":"eɪ"},{"left":"B","right":"biː"},{"left":"C","right":"siː"},{"left":"D","right":"diː"}],"explanation":"These are the standard English alphabet pronunciations."}`,
    organize: `{"question":"Organize the words to form a correct sentence.","scrambled":"school every to goes she day","answer":"She goes to school every day.","explanation":"Subject + Verb + Object + Frequency + Time."}`,
    rewrite: `{"question":"Correct the mistake in the sentence.","scrambled":"She don't likes coffee","answer":"She doesn't like coffee.","explanation":"Use doesn't (not don't) for he/she/it in negative Present Simple."}`,
  };

  return `You are an expert English teacher creating quiz activities for English language learners.

TEACHER INSTRUCTIONS:
"""
${instructions}
"""

TASK:
- Read the teacher instructions carefully.
- If a number of questions is mentioned, use exactly that number. Otherwise generate ${num}.
- If a question type is mentioned (multiple choice, true/false, match, organize, correct/rewrite), use it. Otherwise use "${defaultType}".
- If vocabulary, sentences or reference text is provided, base ALL questions on that content.
- Write questions and all answers IN ENGLISH.
- Each question must test something different (don't repeat the same concept).
- Explanations should be 1-2 sentences, educational and clear.

OUTPUT FORMAT — respond with ONLY this JSON structure, nothing else:
{
  "questions": [
    ${formatByType[defaultType]},
    ...repeat for each question
  ]
}

Generate ${num} questions now:`;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callGeminiWithRetry(prompt: string, apiKey: string, maxRetries = 3): Promise<string> {
  const model = 'gemini-2.5-flash';
  let lastError = '';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[quiz-ai] Attempt ${attempt}/${maxRetries} with ${model}...`);

      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
          }),
        }
      );

      if (resp.status === 503) {
        lastError = `Modelo ocupado (intento ${attempt}/${maxRetries})`;
        console.warn(`[quiz-ai] 503 on attempt ${attempt}, waiting before retry...`);
        if (attempt < maxRetries) {
          await sleep(3000 * attempt); // 3s, 6s, 9s
          continue;
        }
        throw new Error(lastError);
      }

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        const msg = (errData as Record<string, Record<string, string>>)?.error?.message ?? resp.statusText;
        throw new Error(`HTTP ${resp.status}: ${msg}`);
      }

      const data = await resp.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text as string;
      if (!text) throw new Error('Respuesta vacía del modelo');

      console.log(`[quiz-ai] ✅ Success on attempt ${attempt}`);
      return text;

    } catch (e) {
      lastError = String(e);
      if (!lastError.includes('ocupado') && !lastError.includes('503')) {
        // Non-retryable error
        throw e;
      }
      if (attempt === maxRetries) throw new Error(`Modelo no disponible después de ${maxRetries} intentos. Intenta en unos segundos.`);
    }
  }

  throw new Error(lastError || 'Error desconocido');
}

function parseResponse(text: string, type: QuizType, num: number): QuizQuestion[] {
  let cleaned = text.trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  if (!cleaned.startsWith('{')) {
    const match = cleaned.match(/\{[\s\S]*"questions"[\s\S]*\}/);
    if (match) cleaned = match[0];
  }

  let parsed: { questions: unknown[] };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const partialMatch = cleaned.match(/\{[\s\S]*?"questions"\s*:\s*\[[\s\S]*\]/);
    if (!partialMatch) throw new Error(`Cannot parse JSON response. Preview: ${cleaned.slice(0, 300)}`);
    try {
      parsed = JSON.parse(partialMatch[0] + '}');
    } catch {
      throw new Error(`Malformed JSON from model. Preview: ${cleaned.slice(0, 300)}`);
    }
  }

  if (!Array.isArray(parsed.questions)) throw new Error('Missing questions array in response');

  return parsed.questions.slice(0, num).map((q: unknown, i: number): QuizQuestion => {
    const qObj = q as Record<string, unknown>;
    const id = `q-ai-${Date.now()}-${i}`;

    if (type === 'match') {
      const pairs = (qObj.pairs as Array<{ left: string; right: string }>) ?? [];
      return {
        id, type: 'match',
        question: String(qObj.question ?? 'Match the elements'),
        options: pairs.map((p, pi) => ({
          id: `opt-${id}-${pi}`,
          text: String(p.left ?? ''),
          isCorrect: true,
          correctAnswer: String(p.right ?? ''),
        })),
        explanation: String(qObj.explanation ?? ''),
      };
    }

    if (type === 'organize' || type === 'rewrite') {
      return {
        id, type,
        question: String(qObj.question ?? (type === 'organize' ? 'Organize the words' : 'Correct the sentence')),
        options: [{ id: `opt-${id}-0`, text: String(qObj.scrambled ?? ''), isCorrect: true }],
        correctAnswer: String(qObj.answer ?? ''),
        explanation: String(qObj.explanation ?? ''),
      };
    }

    const rawOptions = (qObj.options as Array<{ text: string; isCorrect: boolean }>) ?? [];
    return {
      id, type,
      question: String(qObj.question ?? ''),
      options: rawOptions.map((o, oi) => ({
        id: `opt-${id}-${oi}`,
        text: String(o.text ?? ''),
        isCorrect: Boolean(o.isCorrect),
      })),
      explanation: String(qObj.explanation ?? ''),
    };
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json();
    const { instructions, topic, exercises, num_questions = 5, quiz_type = 'multiple_choice' } = body;

    // Support both new (instructions) and legacy (topic+exercises) format
    let instructionsText: string;
    if (instructions && String(instructions).trim()) {
      instructionsText = String(instructions).trim();
    } else if (topic && String(topic).trim()) {
      instructionsText = exercises
        ? `${num_questions} questions of type ${quiz_type} about: ${topic}\n\nReference:\n${exercises}`
        : `${num_questions} ${quiz_type} questions about: ${topic}`;
    } else {
      return new Response(JSON.stringify({ error: 'Escribe instrucciones para generar el quiz.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      });
    }

    const GEMINI_API_KEY = (Deno.env.get('GEMINI_API_KEY') ?? '').trim();
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({
        error: 'No hay GEMINI_API_KEY configurada. Ve a Ajustes → Configuración IA.',
        questions: [],
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    const prompt = buildPrompt(instructionsText, num_questions, quiz_type as QuizType);

    const rawText = await callGeminiWithRetry(prompt, GEMINI_API_KEY);
    const questions = parseResponse(rawText, quiz_type as QuizType, num_questions);

    return new Response(JSON.stringify({ questions, source: 'gemini-2.5-flash' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });

  } catch (err) {
    const msg = String(err);
    console.error('[quiz-ai] Final error:', msg);

    const userMsg = msg.includes('ocupado') || msg.includes('503') || msg.includes('disponible')
      ? 'El servicio de IA está muy ocupado ahora mismo. Espera unos segundos e intenta de nuevo. 🔄'
      : `Error al generar el quiz: ${msg.slice(0, 200)}`;

    return new Response(JSON.stringify({ error: userMsg, questions: [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });
  }
});
