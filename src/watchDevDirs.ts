import { isProd, routes, HttpResponse } from "./serveHttpRequests.ts";
import { clearLocalhostModuleCache, CacheReloadOpts } from "./clearLocalhostModuleCache.ts";
import { run } from "./run.ts";

export const openConnections: ReadableStreamDefaultController[] = [];

type WatchDevDirsOpts = {
  dirs: string[];
  bundle: [string, string] | false;
  testDir: string | false;
  cacheReload: CacheReloadOpts;
}
type OnFileChangeOpts = WatchDevDirsOpts & {
  path: string;
  time: Date;
};

const defaultWatchOpts: WatchDevDirsOpts = {
  dirs: ["src"],
  bundle: ["src/app.ts", "public/app.js"],
  testDir: "src",
  cacheReload: {
    lockfilePath: "deno.lock",
    rootSourceFile: "src/app.ts",
  },
};

// change in src/ -> deno bundle src/app.ts public/app.js -> browser reload
export async function watchDevDirs(opts: WatchDevDirsOpts = defaultWatchOpts) {
  if (isProd) return;

  await clearLocalhostModuleCache(opts.cacheReload);
  await run("check", opts.cacheReload.rootSourceFile);
  if (opts.testDir) await run("test", "--unstable", "--dom", opts.testDir);
  if (opts.bundle) await run("bundle", opts.bundle[0], opts.bundle[1]);

  let timeout: number | undefined;
  for (const dir of opts.dirs) {
    try {
      watchDir(dir);
    } catch (err) {
      console.error("watchDir failure", err);
    }
  }

  routes.set("/last-change", (_requestEvent) => {
    let connection: ReadableStreamDefaultController | undefined;
    const content = new ReadableStream({
      start(controller) {
        connection = controller;
        openConnections.push(connection);
      },
      cancel() {
        if (!connection) return;
        const index = openConnections.indexOf(connection);
        if (index !== -1) {
          openConnections.splice(index, 1);
        }
      },
    });
    return new HttpResponse(content, { "Content-Type": "text/event-stream" });
  });

  async function watchDir(dir: string) {
    for await (const event of Deno.watchFs(dir, { recursive: true })) {
      const isTs = event.paths[0].endsWith(".ts");
      const isChange = event.kind === "create" || event.kind === "modify";
      if (isChange && isTs) {
        const path = event.paths[0].replace(Deno.cwd() + "/", "");
        clearTimeout(timeout);
        timeout = setTimeout(onFileChange, 100, {
          ...opts,
          path,
          time: new Date(),
        });
      }
    }
  }
}

async function onFileChange({
  path,
  time,
  bundle,
  // testDir,
  cacheReload,
}: OnFileChangeOpts) {
  console.log(`[${time.toLocaleTimeString()}] updated ${path}`);

  // clear deno module cache
  await clearLocalhostModuleCache(cacheReload);

  // check types
  if (await run("check", path)) return;

  // run tests
  if (path.endsWith(".test.ts") &&
      await run("test", "--unstable", "--dom", path)) return;

  // bundle
  if (bundle && await run("bundle", bundle[0], bundle[1])) return;

  // notify open browser connections
  openConnections.forEach((connection) => {
    connection.enqueue(
      new TextEncoder().encode(`data: ${time.getTime()}\r\n\r\n`)
    );
  });
}

