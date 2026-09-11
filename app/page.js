"use client";

import { useEffect, useState } from "react";

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
  const [saved, setSaved] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeStyle, setActiveStyle] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingText, setSavingText] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function tweetUrl(tweet) {
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`;
  }

  function isSaved(tweet) {
    return saved.some((item) => item.text === tweet);
  }

  useEffect(() => {
    fetch("/api/saved")
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data.tweets)) {
          setSaved(data.tweets);
        }
      })
      .catch(() => {});
  }, []);

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

  async function saveTweet(tweet) {
    if (!tweet || isSaved(tweet) || savingText) return;

    setSavingText(tweet);

    try {
      const response = await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: tweet }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save tweet.");
      }

      setSaved((current) => {
        if (current.some((item) => item.id === data.tweet.id)) {
          return current;
        }
        return [data.tweet, ...current];
      });
      setPanelOpen(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingText("");
    }
  }

  async function removeSaved(id) {
    const response = await fetch(`/api/saved/${id}`, { method: "DELETE" });
    if (!response.ok) return;
    setSaved((current) => current.filter((item) => item.id !== id));
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-12 sm:py-16">
      <header className="mb-10 flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-medium tracking-[0.2em] text-stone-500 uppercase">
            Claude remix
          </p>
          <h1 className="font-serif text-5xl tracking-tight text-stone-900">
            Remixer
          </h1>
          <p className="mt-3 max-w-md text-stone-600">
            Paste text, pick a remix, and get a new version back.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          className="shrink-0 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-[#1DA1F2] hover:text-[#1DA1F2]"
        >
          Saved{saved.length ? ` (${saved.length})` : ""}
        </button>
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
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-medium tracking-wide text-[#1DA1F2] uppercase">
                    Tweet {index + 1}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isSaved(tweet) || savingText === tweet}
                      onClick={() => saveTweet(tweet)}
                      className="rounded-full border border-stone-300 px-3 py-1 text-sm font-medium text-stone-700 transition hover:border-stone-900 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isSaved(tweet)
                        ? "Saved"
                        : savingText === tweet
                          ? "Saving…"
                          : "Save"}
                    </button>
                    <a
                      href={tweetUrl(tweet)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-[#1DA1F2] px-3 py-1 text-sm font-medium text-white transition hover:bg-[#1a8cd8]"
                    >
                      Tweet
                    </a>
                  </div>
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

      {panelOpen && (
        <button
          type="button"
          aria-label="Close saved tweets"
          onClick={() => setPanelOpen(false)}
          className="fixed inset-0 z-30 bg-stone-900/20"
        />
      )}

      <aside
        className={`fixed top-0 right-0 z-40 flex h-full w-full max-w-sm flex-col border-l border-stone-200 bg-[#fffdf8] shadow-xl transition-transform duration-200 ${
          panelOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <div>
            <h2 className="font-serif text-2xl text-stone-900">Saved tweets</h2>
            <p className="text-sm text-stone-500">
              {saved.length ? `${saved.length} ready to post later` : "Save tweets from a remix"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPanelOpen(false)}
            className="text-sm text-stone-500 transition hover:text-stone-900"
          >
            Close
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {saved.length === 0 ? (
            <p className="text-sm text-stone-500">
              Nothing saved yet. Generate tweets, then hit Save on the ones you like.
            </p>
          ) : (
            saved.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-stone-200 bg-white px-3.5 py-3"
              >
                <p className="whitespace-pre-wrap text-stone-900">{item.text}</p>
                <div className="mt-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => removeSaved(item.id)}
                    className="text-sm text-stone-500 transition hover:text-red-700"
                  >
                    Remove
                  </button>
                  <a
                    href={tweetUrl(item.text)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-[#1DA1F2] px-3 py-1 text-sm font-medium text-white transition hover:bg-[#1a8cd8]"
                  >
                    Tweet
                  </a>
                </div>
              </article>
            ))
          )}
        </div>
      </aside>
    </main>
  );
}
