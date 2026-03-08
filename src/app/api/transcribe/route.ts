import { NextRequest, NextResponse } from "next/server";

// Language-specific prompts to force Whisper to output in that language
const LANGUAGE_PROMPTS: Record<string, string> = {
  tr: "Bu bir Türkçe konuşma kaydıdır. Lütfen Türkçe olarak yazıya dökün.",
  de: "Dies ist eine deutsche Sprachaufnahme. Bitte auf Deutsch transkribieren.",
  fr: "Ceci est un enregistrement vocal en français. Veuillez transcrire en français.",
  es: "Esta es una grabación de voz en español. Por favor, transcribir en español.",
  ja: "これは日本語の音声録音です。日本語で書き起こしてください。",
  ko: "이것은 한국어 음성 녹음입니다. 한국어로 전사해 주세요.",
  zh: "这是一段中文语音录音。请用中文转录。",
  pt: "Esta é uma gravação de voz em português. Por favor, transcreva em português.",
  it: "Questa è una registrazione vocale in italiano. Si prega di trascrivere in italiano.",
  ru: "Это запись голоса на русском языке. Пожалуйста, транскрибируйте на русском.",
  ar: "هذا تسجيل صوتي باللغة العربية. يرجى النسخ باللغة العربية.",
  en: "",
};

export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "GROQ_API_KEY not configured in .env.local" },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as Blob;
    const language = (formData.get("language") as string) || "en";
    const translateTo = (formData.get("translateTo") as string) || "";

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Convert blob to File for Groq API
    const audioBuffer = await audioFile.arrayBuffer();
    const file = new File([audioBuffer], "recording.webm", {
      type: "audio/webm",
    });

    const model = "whisper-large-v3";

    // Build form data for Groq Whisper
    const groqForm = new FormData();
    groqForm.append("file", file);
    groqForm.append("model", model);
    groqForm.append("language", language);
    groqForm.append("response_format", "verbose_json");
    groqForm.append("temperature", "0");

    // Add a language-specific prompt to force output in the correct language
    const prompt = LANGUAGE_PROMPTS[language] || "";
    if (prompt) {
      groqForm.append("prompt", prompt);
    }

    // Call Groq Whisper API - TRANSCRIPTIONS endpoint (keeps original language)
    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: groqForm,
      }
    );

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error("Groq Whisper error:", errorText);
      return NextResponse.json(
        { error: "Transcription failed", details: errorText },
        { status: groqResponse.status }
      );
    }

    const result = await groqResponse.json();
    const transcript = result.text || "";

    // Clean up filler words based on language
    const cleaned = cleanTranscript(transcript, language);

    // Translation (if requested)
    let translated = "";
    if (translateTo && translateTo !== language) {
      translated = await translateText(apiKey, cleaned, language, translateTo);
    }

    return NextResponse.json({
      raw: transcript,
      cleaned,
      translated,
      language,
      translateTo: translateTo || null,
      model: "Groq Whisper v3",
      confidence: 0.95,
      duration: result.duration || 0,
    });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Translate text using Groq LLM
async function translateText(
  apiKey: string,
  text: string,
  fromLang: string,
  toLang: string
): Promise<string> {
  const langNames: Record<string, string> = {
    en: "English",
    tr: "Turkish",
    de: "German",
    fr: "French",
    es: "Spanish",
    ja: "Japanese",
    ko: "Korean",
    zh: "Chinese",
    pt: "Portuguese",
    it: "Italian",
    ru: "Russian",
    ar: "Arabic",
  };

  const fromName = langNames[fromLang] || fromLang;
  const toName = langNames[toLang] || toLang;

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are a professional translator. Translate the following text from ${fromName} to ${toName}. Only output the translation, nothing else. Keep the same tone and style.`,
            },
            {
              role: "user",
              content: text,
            },
          ],
          temperature: 0.1,
          max_tokens: 2000,
        }),
      }
    );

    if (!response.ok) return "";

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || "";
  } catch {
    return "";
  }
}

// Language-specific filler word patterns
const FILLER_PATTERNS: Record<string, RegExp[]> = {
  en: [
    /\b(um|uh|erm|er|ah|like,?\s)/gi,
    /\b(you know,?\s)/gi,
    /\b(I mean,?\s)/gi,
    /\b(sort of|kind of)\s/gi,
    /\b(basically,?\s)/gi,
    /\b(actually,?\s)/gi,
    /\b(literally,?\s)/gi,
    /\b(right,?\s)/gi,
    /\b(so,?\s)(?=[a-z])/gi,
  ],
  tr: [
    /\b(ee+|aa+|şey,?\s)/gi,
    /\b(hani,?\s)/gi,
    /\b(yani,?\s)/gi,
    /\b(işte,?\s)/gi,
    /\b(aslında,?\s)/gi,
    /\b(mesela,?\s)(?=[a-zçğıöşü])/gi,
    /\b(bir nevi,?\s)/gi,
    /\b(nasıl diyeyim,?\s)/gi,
  ],
  de: [
    /\b(äh|ähm|em|hm,?\s)/gi,
    /\b(also,?\s)/gi,
    /\b(quasi,?\s)/gi,
    /\b(sozusagen,?\s)/gi,
    /\b(eigentlich,?\s)/gi,
  ],
  fr: [
    /\b(euh|bah|ben,?\s)/gi,
    /\b(en fait,?\s)/gi,
    /\b(genre,?\s)/gi,
    /\b(du coup,?\s)/gi,
    /\b(voilà,?\s)/gi,
  ],
  es: [
    /\b(eh|em|este,?\s)/gi,
    /\b(o sea,?\s)/gi,
    /\b(bueno,?\s)/gi,
    /\b(pues,?\s)/gi,
    /\b(en plan,?\s)/gi,
  ],
};

function cleanTranscript(text: string, language: string): string {
  if (!text) return "";

  let cleaned = text;

  // Apply language-specific filler patterns
  const patterns = FILLER_PATTERNS[language] || FILLER_PATTERNS.en || [];
  for (const pattern of patterns) {
    cleaned = cleaned.replace(pattern, "");
  }

  // Clean up double spaces
  cleaned = cleaned.replace(/\s{2,}/g, " ").trim();

  // Capitalize first letter
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  // Ensure ending punctuation
  if (cleaned && !/[.!?]$/.test(cleaned)) {
    cleaned += ".";
  }

  return cleaned;
}
