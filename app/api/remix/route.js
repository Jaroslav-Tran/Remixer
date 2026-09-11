import { isStyle, remix } from "@/lib/remix-prompts";

export const runtime = "nodejs";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  const style = isStyle(body.style) ? body.style : "";

  if (!text) {
    return Response.json({ error: "Paste some text to remix." }, { status: 400 });
  }

  if (!style) {
    return Response.json({ error: "Pick a remix style." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "Missing ANTHROPIC_API_KEY. Add it to .env.local and restart." },
      { status: 500 },
    );
  }

  try {
    const result = await remix(text, style, apiKey);

    if (style === "tweet") {
      return Response.json({ tweets: result.tweets });
    }

    if (!result.remix) {
      return Response.json({ error: "Claude returned an empty remix." }, { status: 502 });
    }

    return Response.json({ remix: result.remix });
  } catch (error) {
    return Response.json(
      { error: error.message || "Claude API request failed." },
      { status: error.status || 502 },
    );
  }
}
