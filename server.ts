import {
  Application,
  Context,
  Router,
  ServerSentEventTarget,
} from "https://deno.land/x/oak@v12.6.0/mod.ts";
import staticFiles from "https://deno.land/x/static_files@1.1.6/mod.ts";
import { debounce } from "https://deno.land/std@0.197.0/async/debounce.ts";

const app = new Application();
const router = new Router();

// Middleware for adding CORS headers
app.use(async (ctx: Context, next: () => Promise<void>) => {
  await next();
  ctx.response.headers.set("Access-Control-Allow-Origin", "*");
  ctx.response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE"
  );
  ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type");
});

// Static files from public/
app.use(staticFiles("public", { cacheControl: false }));

// Watch public folder and reload browser on changes
async function watchPublicFolder() {
  const targets: ServerSentEventTarget[] = [];
  router.get("/last-change", (ctx) => {
    targets.push(ctx.sendEvents());
  });
  const send = (event: Deno.FsEvent, lastChangeTime: Date) => {
    console.log(
      `[${lastChangeTime.toLocaleTimeString()}] ${event.kind} ${event.paths[0]}`
    );
    targets.forEach((t) => t.dispatchMessage({ data: lastChangeTime }));
  };
  const debouncedSend = debounce(send, 20);
  for await (const event of Deno.watchFs("public")) {
    // Example event: { kind: "create", paths: [ "/home/alice/deno/foo.txt" ] }
    debouncedSend(event, new Date());
  }
}
watchPublicFolder();

app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });
