import { getAssetFromKV } from "@cloudflare/kv-asset-handler";
import type { AppLoadContext } from "@remix-run/cloudflare";
import { createRequestHandler, logDevReady } from "@remix-run/cloudflare";
import * as build from "@remix-run/dev/server-build";
import __STATIC_CONTENT_MANIFEST from "__STATIC_CONTENT_MANIFEST";
import { queue } from "~/queue/consumer";
import { scheduled } from "~/cron/scheduled";
import { BookmarkCounter } from "~/do/bookmark-counter";

const MANIFEST = JSON.parse(__STATIC_CONTENT_MANIFEST);
const handleRemixRequest = createRequestHandler(build, process.env.NODE_ENV);

if (process.env.NODE_ENV === "development") {
  logDevReady(build);
}

export { BookmarkCounter };

export default {
  async fetch(
    request: Request,
    env: {
      __STATIC_CONTENT: Fetcher;
      BUCKET: R2Bucket;
    },
    ctx: ExecutionContext
  ): Promise<Response> {
    try {
      const url = new URL(request.url);
      const ttl = url.pathname.startsWith("/build/")
        ? 60 * 60 * 24 * 365 // 1 year
        : 60 * 5; // 5 minutes
      return await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil.bind(ctx),
        } as FetchEvent,
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: MANIFEST,
          cacheControl: {
            browserTTL: ttl,
            edgeTTL: ttl,
          },
        }
      );
    } catch (error) {}

    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith("/images/")) {
        const object = await env.BUCKET.get(
          url.pathname.replace("/images", "").slice(1)
        );
        if (object === null) {
          return new Response("Object Not Found", { status: 404 });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set("etag", object.httpEtag);

        return new Response(object.body, {
          headers,
        });
      }
    } catch (error) {}

    try {
      const loadContext: AppLoadContext = {
        env,
      };
      return await handleRemixRequest(request, loadContext);
    } catch (error) {
      console.log("server error", error);
      return new Response("An unexpected error occurred", { status: 500 });
    }
  },
  queue,
  scheduled,
};
