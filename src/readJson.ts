export async function readJson<T>(path: string): Promise<T | undefined> {
  try {
    return JSON.parse(await Deno.readTextFile(path));
  } catch (err) {
    console.error(`Failed to read json file ${path}`, err);
    return;
  }
}
