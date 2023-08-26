import { sqliteTable, text, integer, unique } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey().notNull(),
  googleProfileId: text("googleProfileId").notNull(),
  iconUrl: text("iconUrl"),
  displayName: text("displayName").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

export const bookmarks = sqliteTable(
  "bookmarks",
  {
    id: integer("id").primaryKey().notNull(),
    slug: text("slug").notNull(),
    userId: integer("userId").notNull(),
    url: text("url").notNull(),
    title: text("title"),
    comment: text("comment"),
    imageKey: text("imageKey"),
    isProcessed: integer("isProcessed", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    userIdAndUrl: unique().on(table.userId, table.url),
  })
);
