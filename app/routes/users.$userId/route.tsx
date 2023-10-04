import { LoaderArgs, json } from "@remix-run/cloudflare";
import { useLoaderData, useNavigation } from "@remix-run/react";
import { getAuthenticator } from "~/features/common/services/auth.server";
import {
  addBookmark,
  getBookmarks,
} from "~/features/bookmark/services/bookmark.server";
import { withZod } from "@remix-validated-form/with-zod";
import { z } from "zod";
import { ValidatedForm } from "remix-validated-form";
import SubmitButton from "~/features/common/components/submit-button";
import BookmarkCard from "~/features/bookmark/components/bookmark-card";
import { useEffect, useRef } from "react";
import { InputWithLabel } from "~/features/common/components/input-with-label";
import { TextareaWithLabel } from "~/features/common/components/textarea-with-label";
import { Spacer } from "~/features/common/components/spacer";

const validator = withZod(
  z.object({
    url: z.string().url(),
    comment: z.string().optional(),
  })
);

export async function action({ request, context }: LoaderArgs) {
  const authenticator = getAuthenticator(context);
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: "/login",
  });

  const formData = await request.formData();
  const url = formData.get("url") as string;
  const comment = formData.get("comment") as string;

  if (typeof url !== "string" || url.length === 0) {
    return json(
      { errors: { body: null, title: "URL is required" } },
      { status: 400 }
    );
  }

  await addBookmark(context, user, url, comment);

  return json({});
}

export async function loader({ request, context }: LoaderArgs) {
  const authenticator = getAuthenticator(context);
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: "/login",
  });
  const bookmarks = await getBookmarks(context, user.id);
  return json({ user, bookmarks });
}

export default function Index() {
  const { user, bookmarks } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isRequesting = Boolean(navigation.state === "submitting");
  let formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!isRequesting) {
      formRef.current?.reset();
    }
  }, [isRequesting]);

  return (
    <>
      <section className="flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">{user.displayName}'s Bookmarks</h1>
      </section>
      <section className="flex flex-col items-center justify-center">
        <ValidatedForm
          formRef={formRef}
          validator={validator}
          method="post"
          style={{ width: 300 }}
        >
          <InputWithLabel name="url" label="URL" />
          <TextareaWithLabel name="comment" label="Comment" />
          <Spacer size="4xs" />
          <SubmitButton
            key="Create"
            text="Create"
            name="action"
            value="create"
            color="blue"
          />
        </ValidatedForm>
      </section>
      <section className="flex flex-col items-center justify-center mt-4">
        {bookmarks.map((bookmark) => (
          <BookmarkCard
            key={bookmark.id}
            editable={true}
            slug={bookmark.slug}
            title={bookmark.title}
            description={bookmark.description}
            url={bookmark.url}
            image={bookmark.imageKey}
            comment={bookmark.comment}
            count={bookmark.count}
            createdAt={bookmark.createdAt}
          />
        ))}
      </section>
    </>
  );
}
