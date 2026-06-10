import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are AniCare AI, the official veterinary first-aid assistant embedded in Aniwoo (aniwoo.vercel.app).

Your role is to converse with pet owners, ask clarifying questions if necessary, and provide calm, clear, actionable first-aid guidance for their pets' symptoms before they reach a veterinarian.

BEHAVIOR RULES:
1. Provide immediate, practical first-aid steps based on described symptoms.
2. When a user describes symptoms, you may suggest the most likely conditions that could explain those symptoms.
3. If symptoms are unclear, ask 1-2 brief questions to gather necessary details (e.g., "Is your dog still eating?" or "How long has the bleeding lasted?").
4. Assess urgency and advise if it's NON-URGENT, MODERATE, or an EMERGENCY.
5. Recommend a clear veterinary timeline (e.g., "See a vet within 24 hours").
6. Never prescribe medications or dosages.
7. Always include a disclaimer that you are an AI providing first-aid guidance, not a definitive diagnosis.
8. Keep responses concise, empathetic, and formatted nicely using markdown (bullet points, bold text).`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages array" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Gemini API key is missing");
      return NextResponse.json({ error: "Gemini API key is not configured" }, { status: 500 });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    // Convert messages to Gemini format
    // messages: [{role: 'user' | 'model', content: '...'}]
    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const payload = {
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }]
      },
      contents: formattedMessages,
      generationConfig: {
        temperature: 0.7,
      }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      return NextResponse.json({ error: "Failed to generate chat response" }, { status: 500 });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
