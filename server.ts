import { watchDevDirs } from "./src/watchDevDirs.ts";
import { serveHttpRequests } from "./src/serveHttpRequests.ts";

watchDevDirs({
  dirs: ["src"],
  bundle: [],
});

const port = Deno.env.get("PORT");
serveHttpRequests({
  port: port ? +port : 8001,
  publicDir: "src",
});
