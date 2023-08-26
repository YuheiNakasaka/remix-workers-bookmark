import { LoaderArgs } from "@remix-run/cloudflare";
import { getAuthenticator } from "~/features/common/services/auth.server";

export let loader = ({ request, context }: LoaderArgs) => {
  const authenticator = getAuthenticator(context);
  return authenticator.authenticate("google", request, {
    successRedirect: "/",
    failureRedirect: "/login",
  });
};
