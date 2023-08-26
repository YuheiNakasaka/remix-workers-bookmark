import { AppLoadContext } from "@remix-run/cloudflare";
import { bookmarks } from "db/schema";
import { InferInsertModel, desc, eq } from "drizzle-orm";
import { createClient } from "~/features/common/services/db.server";
import {
  Bookmark,
  BookmarkWithCount,
} from "~/features/bookmark/types/bookmark";

type CreateBookmark = InferInsertModel<typeof bookmarks>;

export async function getBookmarks(
  context: AppLoadContext,
  userId: number
): Promise<BookmarkWithCount[]> {
  const env = context.env as Env;
  const db = createClient(env.DB);
  const records: Bookmark[] = await db
    .select()
    .from(bookmarks)
    .where(eq(bookmarks.userId, userId))
    .orderBy(desc(bookmarks.createdAt))
    .limit(10)
    .all();

  const bookmarkWithCount: BookmarkWithCount[] = [];
  if (records.length > 0) {
    for (const record of records) {
      const counter = await env.COUNTER.get(
        env.COUNTER.idFromName(record.slug)
      );
      const resp = await counter.fetch("https://.../");
      const count = await resp.text();
      bookmarkWithCount.push({
        ...record,
        count: Number(count),
      });
    }
  }

  return bookmarkWithCount;
}

export async function getBookmark(
  context: AppLoadContext,
  slug: string,
  userId: number
): Promise<BookmarkWithCount | undefined> {
  const env = context.env as Env;
  const db = createClient(env.DB);
  const record: Bookmark | undefined = await db
    .select()
    .from(bookmarks)
    .where(eq(bookmarks.userId, userId))
    .where(eq(bookmarks.slug, slug))
    .get();
  if (!record) return undefined;

  const counter = await env.COUNTER.get(env.COUNTER.idFromName(record.slug));
  const resp = await counter.fetch("https://.../");
  const count = await resp.text();
  return {
    ...record,
    count: Number(count),
  };
}

export async function addBookmark(
  context: AppLoadContext,
  user: { id: number },
  url: string,
  comment: string | null
): Promise<Bookmark> {
  const env = context.env as Env;
  const db = createClient(env.DB);
  const slug = await getDigestString(url, env.SESSION_SECRET);
  const createBookmark: CreateBookmark = {
    slug: slug,
    userId: user.id,
    url: url,
    createdAt: new Date(),
  };

  if (comment) {
    createBookmark.comment = comment;
  }

  const bookmark = await db
    .insert(bookmarks)
    .values(createBookmark)
    .returning()
    .get();

  await env.QUEUE.send({ type: "addBookmark", url: url, slug: slug });
  const counter = await env.COUNTER.get(env.COUNTER.idFromName(slug));
  const resp = await counter.fetch("https://.../increment");
  await resp.text();

  return bookmark;
}

export async function updateBookmark(
  context: AppLoadContext,
  slug: string,
  comment: string | null
): Promise<Bookmark> {
  const env = context.env as Env;
  const db = createClient(env.DB);
  const updateBookmark: { comment: string } = {
    comment: `${comment}`,
  };

  const bookmark = await db
    .update(bookmarks)
    .set(updateBookmark)
    .where(eq(bookmarks.slug, slug))
    .returning()
    .get();

  return bookmark;
}

export async function deleteBookmark(
  context: AppLoadContext,
  slug: string
): Promise<void> {
  const env = context.env as Env;
  const db = createClient(env.DB);

  // TODO: returning().get() がないとクエリが実行されない
  const record = await db
    .delete(bookmarks)
    .where(eq(bookmarks.slug, slug))
    .returning()
    .get();
  if (record && record.imageKey) {
    try {
      await env.BUCKET.delete(record.imageKey);
    } catch (e) {
      console.log("deleteBookmark error ", e);
    }
  }

  if (!record) return undefined;

  const counter = await env.COUNTER.get(env.COUNTER.idFromName(record.slug));
  await counter.fetch("https://.../decrement");
}

async function getDigestString(str: string, salt?: string) {
  const buffer = await crypto.subtle.digest(
    {
      name: "SHA-256",
    },
    new TextEncoder().encode(`${salt}${str}`)
  );
  const hashArray = Array.from(new Uint8Array(buffer));
  const hashedText = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashedText;
}
