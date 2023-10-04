declare interface Env {
  SESSION_SECRET: string;
  GOOGLE_AUTH_CALLBACK_URL: string;
  GOOGLE_AUTH_CLIENT_ID: string;
  GOOGLE_AUTH_CLIENT_SECRET: string;
  OPENAI_API_KEY: string;
  OPENAI_API_URL: string;
  SESSION_KV: KVNamespace;
  DB: D1Database;
  QUEUE: Queue<any>;
  ASSETS: Fetcher;
  BUCKET: R2Bucket;
  COUNTER: DurableObjectNamespace;
}
