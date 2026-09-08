"use client";

import { useState } from "react";

const STYLES = [
  { id: "punchier", label: "Punchier", color: "bg-rose-600 enabled:hover:bg-rose-700" },
  { id: "casual", label: "Casual", color: "bg-amber-500 enabled:hover:bg-amber-600" },
  { id: "formal", label: "Formal", color: "bg-blue-950 enabled:hover:bg-blue-900" },
  { id: "shorter", label: "Shorter", color: "bg-emerald-600 enabled:hover:bg-emerald-700" },
  { id: "tweet", label: "Tweet", color: "bg-[#1DA1F2] enabled:hover:bg-[#1a8cd8]" },
  { id: "poetic", label: "Poetic", color: "bg-violet-700 enabled:hover:bg-violet-800" },
];

export default function Home() {
  const [text, setText] = useState("");
  const [output, setOutput] = useState("");
  const [tweets, setTweets] = useState([]);
  const [activeStyle, setActiveStyle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function tweetUrl(tweet) {
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`;
  }

  async function remix(style) {
    if (!text.trim() || loading) return;

    setLoading(true);
    setActiveStyle(style);
    setError("");
    setCopied(false);
    setOutput("");
    setTweets([]);

    try {
      const response = await fetch("/api/remix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, style }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Remix failed.");
      }

      if (data.tweets) {
        setTweets(data.tweets);
      } else {
        setOutput(data.remix);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function copyOutput() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-12 sm:py-16">
      <header className="mb-10">
        <p className="mb-2 text-xs font-medium tracking-[0.2em] text-stone-500 uppercase">
          Claude remix
        </p>
        <h1 className="font-serif text-5xl tracking-tight text-stone-900">
          Remixer
        </h1>
        <p className="mt-3 max-w-md text-stone-600">
          Paste text, pick a remix, and get a new version back.
        </p>
      </header>

      <section className="rounded-2xl border border-stone-200 bg-[#fffdf8] p-5 shadow-sm sm:p-6">
        <label htmlFor="source" className="mb-2 block text-sm font-medium text-stone-700">
          Your text
        </label>
        <textarea
          id="source"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Paste the text you want to remix…"
          rows={8}
          className="w-full resize-y rounded-xl border border-stone-200 bg-white px-3.5 py-3 text-stone-900 outline-none placeholder:text-stone-400 focus:border-orange-700"
        />

        <div className="mt-4 flex flex-wrap gap-2">
          {STYLES.map((style) => (
            <button
              key={style.id}
              type="button"
              disabled={!text.trim() || loading}
              onClick={() => remix(style.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${style.color}`}
            >
              {loading && activeStyle === style.id ? "Remixing…" : style.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-stone-200 bg-[#fffdf8] p-5 shadow-sm sm:p-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-stone-700">Remix</h2>
          {tweets.length === 0 && (
            <button
              type="button"
              onClick={copyOutput}
              disabled={!output}
              className="text-sm text-stone-500 transition enabled:hover:text-orange-800 disabled:opacity-40"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          )}
        </div>

        {error ? (
          <p className="text-red-700">{error}</p>
        ) : tweets.length > 0 ? (
          <div className="space-y-3">
            {tweets.map((tweet, index) => (
              <article
                key={index}
                className="rounded-xl border border-stone-200 bg-white px-3.5 py-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium tracking-wide text-[#1DA1F2] uppercase">
                    Tweet {index + 1}
                  </p>
                  <a
                    href={tweetUrl(tweet)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-[#1DA1F2] px-3 py-1 text-sm font-medium text-white transition hover:bg-[#1a8cd8]"
                  >
                    Tweet
                  </a>
                </div>
                <p className="whitespace-pre-wrap text-stone-900">{tweet}</p>
              </article>
            ))}
          </div>
        ) : output ? (
          <div className="min-h-40 whitespace-pre-wrap rounded-xl border border-stone-200 bg-white px-3.5 py-3 text-stone-900">
            {output}
          </div>
        ) : (
          <div className="min-h-40 rounded-xl border border-stone-200 bg-white px-3.5 py-3">
            <p className="text-stone-400">
              Your remixed text will show up here.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
