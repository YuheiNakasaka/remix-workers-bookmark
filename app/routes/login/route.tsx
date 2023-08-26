import { LoaderArgs } from "@remix-run/cloudflare";
import { Form } from "@remix-run/react";
import { getAuthenticator } from "~/features/common/services/auth.server";

export async function loader({ request, context }: LoaderArgs) {
  const authenticator = getAuthenticator(context);
  return await authenticator.isAuthenticated(request, {
    successRedirect: "/",
  });
}

export default function Login() {
  return (
    <>
      <section className="flex flex-row items-center justify-center mt-4">
        <h1 className="text-2xl font-bold">Login</h1>
      </section>
      <section className="flex flex-row items-center justify-center mt-4">
        <Form method="post" action="/auth/google">
          <button type="submit">Login with Google</button>
        </Form>
      </section>
    </>
  );
}
