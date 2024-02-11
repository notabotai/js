import { watchDevDirs } from "./src/watchDevDirs.ts";
import { serveHttpRequests } from "./src/serveHttpRequests.ts";

watchDevDirs({
  dirs: ["."],
  bundle: false,
  testDir: false,
  cacheReload: {
    lockfilePath: "deno.lock",
    rootSourceFile: "./server.ts",
  },
});

const port = Deno.env.get("PORT");
serveHttpRequests({
  port: port ? +port : 8001,
  publicDir: "src",
});
