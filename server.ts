import { watchDevDirs, serveHttpRequests } from "./src/server.ts";

watchDevDirs({
  dirs: ["src"],
  bundle: [],
});

const port = Deno.env.get("PORT");
serveHttpRequests({
  port: port ? +port : 8001,
  publicDir: "src",
});
