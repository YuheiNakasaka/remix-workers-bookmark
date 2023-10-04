import { bookmarks } from "db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "~/features/common/services/db.server";
import { OpenAI } from "openai";

interface QueueBody {
  type: string;
  url: string;
  slug: string;
}

export async function queue(batch: MessageBatch, env: Env): Promise<void> {
  console.log("queue", JSON.stringify(batch.messages));

  for (const message of batch.messages) {
    const { url, slug } = message.body as QueueBody;
    const { title, image, description } = await fetchOGP(url);
    const summary = await generateSummary(env, description);
    const uploadedImage = await uploadImage(env, image);
    await updateBookmark(env, slug, title, summary, uploadedImage);
  }
}

// NOTE: 適当なので数少ない幾つかのOGPにしか対応してない
const fetchOGP = async (url: string) => {
  const text = await fetch(url).then((res) => res.text());
  const titleMatched = text.match(/<title>(.*)<\/title>/);
  let title = titleMatched ? titleMatched[1] : "";

  const descriptionMatched = text.match(
    /<meta\s+name=[\'"]description[\'"]\s+content=[\'"](.+?)[\'"]\s*\/>/
  );
  const description = descriptionMatched ? descriptionMatched[1] : "";

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

  return { title, image, description };
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
  description: string,
  image: string | null
) => {
  const db = createClient(env.DB);
  const updateBookmark: {
    title: string;
    description: string;
    imageKey?: string;
    isProcessed: boolean;
  } = {
    title: title,
    description: description,
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

const generateSummary = async (
  env: Env,
  description: string
): Promise<string> => {
  const openAIBaseUrl =
    env.OPENAI_API_URL !== ""
      ? env.OPENAI_API_URL
      : "https://api.openai.com/v1";
  const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
    baseURL: openAIBaseUrl,
  });

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content:
          "You will be provided with a sentence in Japanese, and your task is to translate it into English.",
      },
      {
        role: "user",
        content: `${description}`,
      },
    ],
    temperature: 0,
    max_tokens: 256,
  });
  console.log(JSON.stringify(response));

  return response.choices.length > 0
    ? `${response.choices[0].message.content}`
    : "";
};
