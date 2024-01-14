import { BufReader, readLines } from "https://deno.land/std@0.212.0/io/mod.ts";

type HttpHeaders = Record<string, string>;
type HttpContent = string | ReadableStream<Uint8Array> ;
type RouteHandler = (requestEvent: Deno.RequestEvent) => Promise<HttpResponse> | HttpResponse;

class HttpResponse {
  content: HttpContent = "";
  headers: HttpHeaders = {};
  status = 200;
  constructor(content: HttpContent, headers: HttpHeaders = {}, status = 200) {
    this.content = content;
    this.headers = headers;
    this.status = status;
  }
};

export const routes = new Map<string, RouteHandler>();
export const openConnections: ReadableStreamDefaultController[] = [];
export const isProd = Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined;

const response404: HttpResponse = new HttpResponse("404 Not Found", { "Content-Type": "text/plain" }, 404);
const response500: HttpResponse = new HttpResponse("500 Internal Server Error", { "Content-Type": "text/plain" }, 500);

export function watchDevDirs({
  dirs = ["src", "public"],
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
  githubRepo = "notabotai/js",
} = {}) {
  for await (const conn of Deno.listen({ port: +port })) {
    handleConn(conn).catch((err) => {
      console.error("handleConn failure", err);
    });
  }

  async function handleConn(conn: Deno.Conn) {
    const httpConn = Deno.serveHttp(conn);
    for await (const requestEvent of httpConn) {
      handleRequest(requestEvent).catch((err) => {
        console.error("handleRequest failure", err);
        sendResponse(requestEvent, response500).catch((err) => {
          console.error("sendResponse failure when sending 500", err);
        });
      });
    }
  }

  async function handleRequest(requestEvent: Deno.RequestEvent) {
    sendResponse(requestEvent, await getResponse(requestEvent)).catch((err) => {
      console.error("sendResponse failure", err);
    });
  }

  async function sendResponse(requestEvent: Deno.RequestEvent, response: HttpResponse) {
    const { content, status, headers } = response;
    await requestEvent.respondWith(new Response(content, { status, headers }));
  }

  async function getResponse(requestEvent: Deno.RequestEvent) {
    const url = new URL(requestEvent.request.url);
    let route = decodeURIComponent(url.pathname);

    const defaultHeaders: HttpHeaders = {
      "Content-Type": getMimeType(route.split(".").pop()),
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // defined routes
    if (routes.has(route)) {
      console.log("route", route);
      const response = await routes.get(route)!(requestEvent);
      response.headers = { ...defaultHeaders, ...response.headers };
      return response;
    }

    // stream content from github (by commit)
    if (route.startsWith("/gh/")) {
      console.log("github", route);
      const ghUrl = route.replace("/gh/", `https://raw.githubusercontent.com/${githubRepo}/`);
      const content = (await fetch(ghUrl)).body;
      if (content) {
        return new HttpResponse(content, defaultHeaders);
      }
      return response404;
    }

    // static files
    if (route === "/") {
      route = "/index.html"; // default to index.html
      defaultHeaders["Content-Type"] = "text/html";
    }
    let file: Deno.FsFile | undefined;
    let typesFile: Deno.FsFile | undefined;
    try {
      if ((await Deno.stat(publicDir + route)).isFile) {
        file = await Deno.open(publicDir + route, { read: true });
      }
    } catch {
      console.log("404", route);
      return response404;
    }
    if (file && route.endsWith(".js")) {
      try {
        typesFile = await Deno.open(publicDir + route.replace(/\.js$/, ".d.ts"), { read: true });
      } catch {
        // no types known for this JS file
      }
    }

    // read file, replace __js__ substrings with js/ import map from deno.json
    if (file && route.endsWith(".html")) {
      console.log("html", route);
      let importDomain = "";
      try {
        importDomain = JSON.parse(await Deno.readTextFile("./deno.json")).imports["js/"];
      } catch (err) {
        console.error("Failed to read deno.json for import map", err);
      }
      const reader = new BufReader(file);
      const encoder = new TextEncoder();
      const response = new ReadableStream({
        async start(controller) {
          for await (const line of readLines(reader)) {
            const modifiedLine = line.replaceAll("__js__", importDomain);
            controller.enqueue(encoder.encode(modifiedLine + "\n"));
          }
          controller.close();
          if (file) file.close();
        }
      });
      return new HttpResponse(response, defaultHeaders);
    }

    // static local files
    if (file) {
      console.log("static", route);
      const headers = { ...defaultHeaders };
      if (typesFile) {
        headers["X-TypeScript-Types"] = route.replace(/\.js$/, ".d.ts");
      }
      return new HttpResponse(file.readable, headers);
    }

    console.log("404", route);
    return response404;
  }
}

function getMimeType(fileExt: string | undefined) {
  switch (fileExt) {
    case "html": return "text/html";
    case "js": return "text/javascript";
    case "ts": return "text/typescript";
    case "css": return "text/css";
    case "png": return "image/png";
    case "ico": return "image/x-icon";
    case "svg": return "image/svg+xml";
    case "json": return "application/json";
    case "woff": return "font/woff";
    case "woff2": return "font/woff2";
    case "txt": return "text/plain";
    case "md": return "text/markdown";
    case undefined: return "text/plain";
    default: return "application/octet-stream";
  }
}
