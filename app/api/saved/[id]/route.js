import { deleteTweet } from "@/lib/db";

export const runtime = "nodejs";

export async function DELETE(_request, { params }) {
  const { id } = await params;
  const tweetId = Number(id);

  if (!Number.isInteger(tweetId) || tweetId < 1) {
    return Response.json({ error: "Invalid tweet id." }, { status: 400 });
  }

  try {
    await deleteTweet(tweetId);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
