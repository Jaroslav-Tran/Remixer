const STYLES = {
  punchier:
    "Rewrite this so it is punchier and more vivid. Keep the meaning. Do not add new claims.",
  casual:
    "Rewrite this in a casual, conversational voice. Keep the meaning. Do not add new claims.",
  formal:
    "Rewrite this in a clear, professional voice. Keep the meaning. Do not add new claims.",
  shorter:
    "Rewrite this so it is shorter and tighter. Keep the core meaning. Do not add new claims.",
  tweet: tweetPrompt,
  poetic:
    "Rewrite this as a poem in the style of Rudyard Kipling: strong meter, vivid imagery, a clear refrain or moral, and the cadence of verses like If— or Gunga Din. Keep the meaning of the original. Do not add new claims. Return only the poem.",
};

function tweetCountFor(text) {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.min(8, Math.max(3, Math.ceil(words / 120)));
}

function tweetPrompt(text) {
  const count = tweetCountFor(text);
  return `Rewrite this as ${count} separate tweets, each under 280 characters. Cover different angles from the source. Keep the meaning. Do not add hashtags unless they are already in the text. Return only the tweets, separated by a line that contains only ---. No numbering, no intro.`;
}

function splitTweets(remix) {
  return remix
    .split(/\s*\n\s*---\s*\n\s*/)
    .map((tweet) => tweet.trim())
    .filter(Boolean);
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  const style = STYLES[body.style] ? body.style : "";

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

  const instruction =
    typeof STYLES[style] === "function" ? STYLES[style](text) : STYLES[style];

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5",
      max_tokens: style === "tweet" ? 2048 : 1024,
      system:
        "You rewrite text. Return only the rewritten text, with no preamble, quotes, or explanation.",
      messages: [
        {
          role: "user",
          content: `${instruction}\n\nSOURCE TEXT:\n${text}`,
        },
      ],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return Response.json(
      { error: data.error?.message || "Claude API request failed." },
      { status: response.status },
    );
  }

  const remix = (data.content || [])
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  if (!remix) {
    return Response.json({ error: "Claude returned an empty remix." }, { status: 502 });
  }

  if (style === "tweet") {
    const tweets = splitTweets(remix);
    if (tweets.length === 0) {
      return Response.json({ error: "Claude returned an empty remix." }, { status: 502 });
    }
    return Response.json({ tweets });
  }

  return Response.json({ remix });
}
