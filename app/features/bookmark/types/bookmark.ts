export type Bookmark = {
  id: number;
  slug: string;
  url: string;
  title: string | null;
  imageKey: string | null;
  comment: string | null;
  createdAt: Date;
};

export type BookmarkWithCount = Bookmark & { count: number };
