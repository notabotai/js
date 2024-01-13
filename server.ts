import { watchDevDirs, serveHttpRequests } from "./public/server.ts";

watchDevDirs();
serveHttpRequests({
  port: 8001,
});
