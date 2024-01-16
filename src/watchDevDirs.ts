import { isProd, routes, HttpResponse } from "./serveHttpRequests.ts";
import { clearLocalhostModuleCache } from "./clearLocalhostModuleCache.ts";

export const openConnections: ReadableStreamDefaultController[] = [];

const textDecoder = new TextDecoder();

// change in src/ -> deno bundle src/app.ts public/app.js -> browser reload
export function watchDevDirs({
  dirs = ["src"],
  bundle = ["src/app.ts", "public/app.js"],
} = {}) {
  if (isProd) return;

  let timeout: number | undefined;
  for (const dir of dirs) {
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
      clearTimeout(timeout);
      timeout = setTimeout(onFileChange, 100, {
        dir,
        event,
        time: new Date(),
        bundle,
      });
    }
  }
}

async function onFileChange({
  dir,
  event,
  time,
  bundle,
}: {
  dir: string;
  event: Deno.FsEvent;
  time: Date;
  bundle: string[];
}) {
  console.log(
    `[${time.toLocaleTimeString()}] ${event.kind} ${dir} ${event.paths[0]}`
  );

  await clearLocalhostModuleCache();

  // check types
  if (event.paths[0].endsWith(".ts")) {
    const { code, stdout, stderr } = await new Deno.Command(Deno.execPath(), {
      args: ["check", event.paths[0]],
      stdout: "piped",
      stderr: "piped",
    }).output();
    if (code !== 0) {
      console.log("typecheck stdout:", textDecoder.decode(stdout));
      console.error("typecheck stderr:", textDecoder.decode(stderr));
      return;
    }
  }

  // If file is .ts then run deno bundle on it
  if (bundle.length) {
    const { code, stdout, stderr } = await new Deno.Command(Deno.execPath(), {
      args: ["bundle", bundle[0], bundle[1]],
      stdout: "piped",
      stderr: "piped",
    }).output();
    console.log("bundle stdout:", textDecoder.decode(stdout));
    console.error("bundle stderr:", textDecoder.decode(stderr));
    if (code !== 0) {
      return;
    }
  }

  openConnections.forEach((connection) => {
    connection.enqueue(
      new TextEncoder().encode(`data: ${time.getTime()}\r\n\r\n`)
    );
  });
}
