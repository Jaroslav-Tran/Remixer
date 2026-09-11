import { listTweets, saveTweet } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    return Response.json({ tweets: await listTweets() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";

  if (!text) {
    return Response.json({ error: "Nothing to save." }, { status: 400 });
  }

  try {
    const tweet = await saveTweet(text);
    return Response.json({ tweet });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
