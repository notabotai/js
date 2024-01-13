export const routes = new Map<
  string,
  (requestEvent: Deno.RequestEvent) => Promise<void>
>();
export const openConnections: ReadableStreamDefaultController[] = [];
export const isProd = Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined;

export function watchDevDirs({
  dirs = ["src", "public"],
  bundle = ["src/app.ts", "public/app.js"],
} = {}) {
  if (isProd) return;

  let timeout: number | undefined;
  for (const dir of dirs) {
    watchDir(dir);
  }

  routes.set("/last-change", async (requestEvent) => {
    let connection: ReadableStreamDefaultController | undefined;
    const body = new ReadableStream({
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
    try {
      await requestEvent.respondWith(
        new Response(body, {
          headers: {
            "Content-Type": "text/event-stream",
          },
        })
      );
    } catch (_err) {
      // Ignore local errors
    }
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

  function onFileChange({
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

    // If file is .ts then run deno bundle on it
    if (event.paths[0].endsWith(bundle[0])) {
      new Deno.Command(Deno.execPath(), {
        args: ["bundle", bundle[0], bundle[1]],
      }).outputSync();
    }

    openConnections.forEach((connection) => {
      connection.enqueue(
        new TextEncoder().encode(`data: ${time.getTime()}\r\n\r\n`)
      );
    });
  }
}

export async function serveHttpRequests({
  port = Deno.env.get("PORT") ?? 8000,
  publicDir = "public",
} = {}) {
  for await (const conn of Deno.listen({ port: +port })) {
    handleHttp(conn).catch(console.error);
  }

  async function handleHttp(conn: Deno.Conn) {
    const httpConn = Deno.serveHttp(conn);
    for await (const requestEvent of httpConn) {
      const url = new URL(requestEvent.request.url);
      let route = decodeURIComponent(url.pathname);

      // routes
      if (routes.has(route)) {
        await routes.get(route)!(requestEvent);
        continue;
      }

      // index.html
      if (route === "/") {
        route = "/index.html";
      }

      // static files
      let file: Deno.FsFile;
      let typesFile: Deno.FsFile | undefined;
      try {
        file = await Deno.open(publicDir + route, { read: true });
        if (route.endsWith(".js")) {
          typesFile = await Deno.open(publicDir + route.replace(/\.js$/, ".d.ts"), { read: true });
        }
      } catch {
        // If the file cannot be opened, return a "404 Not Found" response
        const notFoundResponse = new Response("404 Not Found", { status: 404 });
        await requestEvent.respondWith(notFoundResponse);
        continue;
      }
      const fileExt = route.split(".").pop();
      const headers = {
        "Content-Type": getMimeType(fileExt),
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
        "Access-Control-Allow-Headers": "Content-Type",
        "X-TypeScript-Types": "",
      };
      if (typesFile) {
        headers["X-TypeScript-Types"] = route.replace(/\.js$/, ".d.ts");
      }
      await requestEvent.respondWith(new Response(file.readable, { headers }));
    }
  }
}

function getMimeType(fileExt: string | undefined) {
  switch (fileExt) {
    case "html":
      return "text/html";
    case "js":
      return "text/javascript";
    case "css":
      return "text/css";
    case "png":
      return "image/png";
    case "ico":
      return "image/x-icon";
    case "svg":
      return "image/svg+xml";
    case "json":
      return "application/json";
    case "woff":
      return "font/woff";
    case "woff2":
      return "font/woff2";
    case "txt":
      return "text/plain";
    case "md":
      return "text/markdown";
    case undefined:
      return "text/plain";
    default:
      return "application/octet-stream";
  }
}
