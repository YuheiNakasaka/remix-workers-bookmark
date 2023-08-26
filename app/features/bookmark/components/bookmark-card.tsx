import { Spacer } from "~/features/common/components/spacer";

interface BookmarkCardProps {
  slug: string;
  title: string | null;
  url: string;
  image: string | null;
  comment: string | null;
  count: number;
  editable: boolean;
  createdAt: string;
}

export default function BookmarkCard(props: BookmarkCardProps) {
  const { slug, title, url, image, comment, count, createdAt, editable } =
    props;
  const date = new Date(createdAt);
  const formattedDate = date.toLocaleDateString("ja-JP", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  });
  const host = new URL(url).hostname;

  return (
    <div
      className="flex flex-col gap-1 rounded-md p-2 border-2 border-gray-200 mt-2"
      style={{ width: 380, overflowWrap: "break-word" }}
    >
      <a href={url} target="_blank">
        {image && <img src={`/images/${image}`} />}
      </a>
      <h2>
        <a href={url} className="text-black-500" target="_blank">
          {title ? title : url}
        </a>
      </h2>
      <a href={url} className="text-xs text-gray-500" target="_blank">
        {count}users {host}
      </a>

      <p className="mt-4 mb-4">{comment}</p>
      <div className="flex justify-between">
        {editable ? (
          <a className="text-xs text-gray-500" href={`/bookmarks/${slug}`}>
            Edit
          </a>
        ) : (
          <Spacer size="4xs" />
        )}
        <span className="text-xs text-gray-500">20{formattedDate}</span>
      </div>
    </div>
  );
}
