import { readJson } from "./readJson.ts";
import { run } from "./run.ts";

type DenoLockfile = {
  remote: Record<string, string>;
};
export type CacheReloadOpts = {
  lockfilePath: string;
  rootSourceFile: string;
};

export async function clearLocalhostModuleCache(opts: CacheReloadOpts) {
  const lockJson = await readJson<DenoLockfile>(opts.lockfilePath);
  // console.log("lockJson", lockJson);
  if (!lockJson) return;
  let hasLocalhostModules = false;
  Object.keys(lockJson.remote).forEach((key) => {
    if (key.startsWith("http://localhost:")) {
      hasLocalhostModules = true;
      delete lockJson.remote[key];
    }
  });
  if (!hasLocalhostModules) return;
  // console.log("writing new lockJson", lockJson);
  Deno.writeTextFileSync("./deno.lock", JSON.stringify(lockJson, null, 2));

  return await run("cache", "--reload", opts.rootSourceFile);
}
