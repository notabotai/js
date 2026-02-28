import { serveHttpRequests } from "./serveHttpRequests.ts";
import { assertEqual } from "./assert.ts";

const port = 18170;

async function startServer(publicDir: string) {
  serveHttpRequests({ port, publicDir, githubRepo: "" });
  // wait for listener to be ready
  for (let i = 0; i < 20; i++) {
    try {
      await fetch(`http://localhost:${port}/`, { redirect: "manual" });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 50));
    }
  }
}

Deno.test({
  name: "directory without trailing slash returns 301 redirect",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const tmpDir = await Deno.makeTempDir();
    await Deno.mkdir(tmpDir + "/dashboard");
    await Deno.writeTextFile(
      tmpDir + "/dashboard/index.html",
      "<html>dashboard</html>",
    );

    await startServer(tmpDir);

    // directory path without trailing slash should 301 redirect
    const res = await fetch(`http://localhost:${port}/dashboard`, {
      redirect: "manual",
    });
    assertEqual(res.status, 301);
    assertEqual(res.headers.get("location"), "/dashboard/");
    await res.body?.cancel();

    // trailing slash should serve the index.html inside
    const res2 = await fetch(`http://localhost:${port}/dashboard/`);
    assertEqual(res2.status, 200);
    const body = await res2.text();
    assertEqual(body.includes("dashboard"), true);

    // root path should still serve index.html
    await Deno.writeTextFile(tmpDir + "/index.html", "<html>root</html>");
    const res3 = await fetch(`http://localhost:${port}/`);
    assertEqual(res3.status, 200);
    const rootBody = await res3.text();
    assertEqual(rootBody.includes("root"), true);

    // regular file should still be served normally
    await Deno.writeTextFile(tmpDir + "/style.css", "body { color: red }");
    const res4 = await fetch(`http://localhost:${port}/style.css`);
    assertEqual(res4.status, 200);
    const cssBody = await res4.text();
    assertEqual(cssBody.includes("color: red"), true);

    await Deno.remove(tmpDir, { recursive: true });
  },
});
