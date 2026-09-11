import { createClient } from "@supabase/supabase-js";

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local and restart.",
    );
  }

  return createClient(url, key);
}

export async function listTweets() {
  const { data, error } = await getClient()
    .from("tweets")
    .select("id, text, created_at")
    .order("id", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export async function saveTweet(text) {
  const client = getClient();

  const { data: existing, error: lookupError } = await client
    .from("tweets")
    .select("id, text, created_at")
    .eq("text", text)
    .maybeSingle();

  if (lookupError) {
    throw new Error(lookupError.message);
  }

  if (existing) {
    return existing;
  }

  const { data, error } = await client
    .from("tweets")
    .insert({ text })
    .select("id, text, created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteTweet(id) {
  const { error } = await getClient().from("tweets").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
