import { redirect, type ActionArgs } from "@remix-run/cloudflare";
import { getAuthenticator } from "~/features/common/services/auth.server";

export const loader = () => redirect("/login");

export const action = ({ request, context }: ActionArgs) => {
  const authenticator = getAuthenticator(context);
  return authenticator.logout(request, {
    redirectTo: "/login",
  });
};
