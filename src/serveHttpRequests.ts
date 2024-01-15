import { BufReader, readLines } from "https://deno.land/std@0.212.0/io/mod.ts";
import { readJson } from "./readJson.ts";

export const routes = new Map<string, RouteHandler>();
export const isProd = Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined;

type HttpHeaders = Record<string, string>;
type HttpContent = string | ReadableStream<Uint8Array>;
type RouteHandler = (
  requestEvent: Deno.RequestEvent
) => Promise<HttpResponse> | HttpResponse;
type DenoConfig = {
  imports: Record<string, string>;
};

export class HttpResponse {
  content: HttpContent = "";
  headers: HttpHeaders = {};
  status = 200;
  constructor(content: HttpContent, headers: HttpHeaders = {}, status = 200) {
    this.content = content;
    this.headers = headers;
    this.status = status;
  }
}

const response404: HttpResponse = new HttpResponse(
  "404 Not Found",
  { "Content-Type": "text/plain" },
  404
);
const response500: HttpResponse = new HttpResponse(
  "500 Internal Server Error",
  { "Content-Type": "text/plain" },
  500
);

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
      const ghUrl = route.replace(
        "/gh/",
        `https://raw.githubusercontent.com/${githubRepo}/`
      );
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
        typesFile = await Deno.open(
          publicDir + route.replace(/\.js$/, ".d.ts"),
          { read: true }
        );
      } catch {
        // no types known for this JS file
      }
    }

    // read file, replace __js__ substrings with js/ import map from deno.json
    if (file && route.endsWith(".html")) {
      console.log("html", route);
      const denoConfig = await readJson<DenoConfig>("./deno.json");
      const importDomain = denoConfig?.imports["js/"] || "";
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
        },
      });
      return new HttpResponse(response, defaultHeaders);
    }

    // static local files
    if (file) {
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

async function sendResponse(
  requestEvent: Deno.RequestEvent,
  response: HttpResponse
) {
  const { content, status, headers } = response;
  await requestEvent.respondWith(new Response(content, { status, headers }));
}

function getMimeType(fileExt: string | undefined) {
  switch (fileExt) {
    case "html":
      return "text/html";
    case "js":
      return "text/javascript";
    case "ts":
      return "text/typescript";
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