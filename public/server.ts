export const routes = new Map<
  string,
  (requestEvent: Deno.RequestEvent) => Promise<void>
>();
export const openConnections: ReadableStreamDefaultController[] = [];
export const isProd = Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined;

export function watchDevDirs({ dirs = ["public"] } = {}) {
  if (isProd) return;

  let timeout: number | undefined;
  for (const dir of dirs) {
    watchDir(dir);
  }

  routes.set("/last-change", async (requestEvent) => {
    let connection: ReadableStreamDefaultController;
    const body = new ReadableStream({
      start(controller) {
        connection = controller;
        openConnections.push(connection);
      },
      cancel() {
        const index = openConnections.indexOf(connection);
        if (index !== -1) {
          openConnections.splice(index, 1);
        }
      },
    });
    await requestEvent.respondWith(
      new Response(body, {
        headers: {
          "Content-Type": "text/event-stream",
        },
      })
    );
  });

  async function watchDir(dir: string) {
    for await (const event of Deno.watchFs(dir, { recursive: true })) {
      clearTimeout(timeout);
      timeout = setTimeout(announceFileChange, 20, dir, event, new Date());
    }
  }

  function announceFileChange(
    dir: string,
    event: Deno.FsEvent,
    lastChangeTime: Date
  ) {
    console.log(
      `[${lastChangeTime.toLocaleTimeString()}] ${event.kind} ${dir} ${
        event.paths[0]
      }`
    );
    openConnections.forEach((connection) => {
      connection.enqueue(
        new TextEncoder().encode(`data: ${lastChangeTime.getTime()}\r\n\r\n`)
      );
    });
  }
}

export async function serveHttpRequests({ port = 8000 } = {}) {
  for await (const conn of Deno.listen({ port })) {
    handleHttp(conn).catch(console.error);
  }

  async function handleHttp(conn: Deno.Conn) {
    const httpConn = Deno.serveHttp(conn);
    for await (const requestEvent of httpConn) {
      const url = new URL(requestEvent.request.url);
      let route = decodeURIComponent(url.pathname);

      // // CORS
      // requestEvent.response.headers.set("Access-Control-Allow-Origin", "*");
      // requestEvent.response.headers.set(
      //   "Access-Control-Allow-Methods",
      //   "GET, POST, PUT, DELETE"
      // );
      // requestEvent.response.headers.set(
      //   "Access-Control-Allow-Headers",
      //   "Content-Type"
      // );

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
      try {
        file = await Deno.open("public" + route, { read: true });
      } catch {
        // If the file cannot be opened, return a "404 Not Found" response
        const notFoundResponse = new Response("404 Not Found", { status: 404 });
        await requestEvent.respondWith(notFoundResponse);
        continue;
      }
      const fileExt = route.split(".").pop();
      await requestEvent.respondWith(
        new Response(file.readable, {
          headers: {
            "Content-Type": getMimeType(fileExt),
          },
        })
      );
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
