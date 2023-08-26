import { bookmarks } from "db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "~/features/common/services/db.server";

interface QueueBody {
  type: string;
  url: string;
  slug: string;
}

export async function queue(batch: MessageBatch, env: Env): Promise<void> {
  console.log("queue", JSON.stringify(batch.messages));

  for (const message of batch.messages) {
    const { url, slug } = message.body as QueueBody;
    const { title, image } = await fetchOGP(url);
    const uploadedImage = await uploadImage(env, image);
    await updateBookmark(env, slug, title, uploadedImage);
  }
}

// NOTE: 適当なので数少ない幾つかのOGPにしか対応してない
const fetchOGP = async (url: string) => {
  const text = await fetch(url).then((res) => res.text());
  const titleMatched = text.match(/<title>(.*)<\/title>/);
  let title = titleMatched ? titleMatched[1] : "";
  let imageMatched = text.match(
    /<meta\s+(?:property=[\'"]?og:image[\'"]?\s+)?content=[\'"](https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*))?[\'"]\s*[\/]*>/i
  );

  let image = imageMatched ? imageMatched[1] : "";
  if (image == "") {
    imageMatched = text.match(
      /<meta\s+content=[\'"](https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*))?[\'"]\s+property=[\'"]og:image[\'"]\s*[\/]*>/i
    );
    image = imageMatched ? imageMatched[1] : "";
  }

  return { title, image };
};

const uploadImage = async (env: Env, image: string): Promise<string | null> => {
  if (!image) return null;
  const url = new URL(image);
  const key = `${url.pathname.slice(1)}`;
  const buf = await fetch(image).then((res) => res.arrayBuffer());
  try {
    console.log("r2 put start");
    await env.BUCKET.put(key, buf);
  } catch (e) {
    console.log("r2 put error", e);
  }
  console.log("r2 put done");
  return key;
};

const updateBookmark = async (
  env: Env,
  slug: string,
  title: string,
  image: string | null
) => {
  const db = createClient(env.DB);
  const updateBookmark: {
    title: string;
    imageKey?: string;
    isProcessed: boolean;
  } = {
    title: title,
    isProcessed: true,
  };
  if (image) {
    updateBookmark.imageKey = image;
  }
  await db
    .update(bookmarks)
    .set(updateBookmark)
    .where(eq(bookmarks.slug, slug))
    .returning()
    .get();
};
