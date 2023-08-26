import { LoaderArgs, json } from "@remix-run/cloudflare";
import { Form, useLoaderData } from "@remix-run/react";
import { Layout } from "~/features/common/components/Layout";
import { getAuthenticator } from "~/features/common/services/auth.server";

export async function loader({ request, context }: LoaderArgs) {
  const authenticator = getAuthenticator(context);
  const user = await authenticator.isAuthenticated(request);
  return json({ user });
}

export default function Index() {
  const { user } = useLoaderData<typeof loader>();
  if (user) {
    return (
      <>
        <section className="flex flex-row items-center justify-center mt-4">
          <h1 className="text-2xl font-bold">Welcome! {user.displayName}</h1>
        </section>
        <section className="flex flex-col items-center justify-center mt-4">
          <a href={`/users/${user.googleProfileId}`}>Bookmarks</a>
        </section>
        <section className="flex flex-col items-center justify-center mt-4">
          <Form method="post" action="/auth/logout">
            <button type="submit">Logout</button>
          </Form>
        </section>
      </>
    );
  }
  return (
    <>
      <section className="flex flex-row items-center justify-center mt-4">
        <h1 className="text-2xl font-bold">Home</h1>
      </section>
      <section className="flex flex-row items-center justify-center mt-4">
        <a href="/login">Login</a>
      </section>
    </>
  );
}
