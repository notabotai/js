import { readJson } from "./readJson.ts";

type DenoLockfile = {
  remote: Record<string, string>;
};

const textDecoder = new TextDecoder();

export async function clearLocalhostModuleCache({
  lockfilePath = Deno.cwd() + "/deno.lock",
  rootSourceFile = Deno.cwd() + "/src/app.ts",
} = {}) {
  const lockJson = await readJson<DenoLockfile>(lockfilePath);
  if (!lockJson) return;
  let hasLocalhostModules = false;
  Object.keys(lockJson.remote).forEach((key) => {
    if (key.startsWith("http://localhost:")) {
      hasLocalhostModules = true;
      delete lockJson.remote[key];
    }
  });
  if (!hasLocalhostModules) return;
  Deno.writeTextFileSync("./deno.lock", JSON.stringify(lockJson, null, 2));

  const { code, stdout, stderr } = await new Deno.Command(Deno.execPath(), {
    args: ["cache", "--reload", rootSourceFile],
    stdout: "piped",
    stderr: "piped",
  }).output();
  if (code !== 0) {
    console.log("typecheck stdout:", textDecoder.decode(stdout));
    console.error("typecheck stderr:", textDecoder.decode(stderr));
    return;
  }
}
