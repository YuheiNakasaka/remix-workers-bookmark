import { ActionArgs, LoaderArgs, json, redirect } from "@remix-run/cloudflare";
import { getAuthenticator } from "~/features/common/services/auth.server";
import {
  deleteBookmark,
  getBookmark,
  updateBookmark,
} from "~/features/bookmark/services/bookmark.server";
import { useLoaderData, useNavigation } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { z } from "zod";
import { ValidatedForm } from "remix-validated-form";
import { useEffect, useRef } from "react";
import { TextareaWithLabel } from "~/features/common/components/textarea-with-label";
import { Spacer } from "~/features/common/components/spacer";
import SubmitButton from "~/features/common/components/submit-button";
import BookmarkCard from "~/features/bookmark/components/bookmark-card";

const validator = withZod(
  z.object({
    comment: z.string().optional(),
  })
);

export async function action({ request, context }: ActionArgs) {
  const authenticator = getAuthenticator(context);
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: "/login",
  });

  const formData = await request.formData();
  const action = formData.get("action") as string;
  const slug = formData.get("slug") as string;
  const comment = formData.get("comment") as string;

  switch (action) {
    case "edit":
      await updateBookmark(context, slug, comment);
      break;
    case "delete":
      await deleteBookmark(context, slug);
      break;
    default:
      return json({});
  }

  return redirect(`/users/${user.googleProfileId}`);
}

export async function loader({ request, context, params }: LoaderArgs) {
  const authenticator = getAuthenticator(context);
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: "/login",
  });

  const slug: string = params.slug as string;
  const userId = params.userId;
  if (slug === "" || userId === "") {
    return redirect(`/users/${user.googleProfileId}`);
  }

  const bookmark = await getBookmark(context, slug, user.id);

  if (!bookmark) {
    return redirect(`/users/${user.googleProfileId}`);
  }

  return json({ bookmark, user });
}

export default function BookmarkEdit() {
  const { bookmark, user } = useLoaderData<typeof loader>();
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
        <h1 className="text-2xl font-bold">Edit Bookmark</h1>
      </section>
      <section className="flex flex-col items-center justify-center">
        <BookmarkCard
          key={bookmark.id}
          editable={false}
          slug={bookmark.slug}
          title={bookmark.title}
          description={bookmark.description}
          url={bookmark.url}
          image={bookmark.imageKey}
          comment={bookmark.comment}
          count={bookmark.count}
          createdAt={bookmark.createdAt}
        />
      </section>
      <section className="flex flex-col items-center justify-center mt-4">
        <ValidatedForm
          formRef={formRef}
          validator={validator}
          method="post"
          style={{ width: 300 }}
        >
          <input type="hidden" name="slug" value={`${bookmark?.slug}`} />
          <TextareaWithLabel
            name="comment"
            label="Comment"
            defaultValue={`${bookmark.comment}`}
          />
          <Spacer size="4xs" />
          <SubmitButton
            key="Edit"
            text="Edit"
            name="action"
            value="edit"
            color="blue"
          />
          <Spacer size="4xs" />
          <SubmitButton
            key="Delete"
            text="Delete"
            name="action"
            value="delete"
            color="red"
          />
        </ValidatedForm>
      </section>
      <section className="flex flex-col items-center justify-center mt-8">
        <a href={`/users/${user.googleProfileId}`}>←Back</a>
      </section>
    </>
  );
}
