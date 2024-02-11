const textDecoder = new TextDecoder();

export async function run(cmd: string, ...args: string[]) {
  const { code, stdout, stderr } = await new Deno.Command(Deno.execPath(), {
    args: [cmd, ...args],
    stdout: "piped",
    stderr: "piped",
  }).output();
  const argsText = args.join(" ");
  if (code === 0) {
    console.log(`%c✓ ${cmd} %c${argsText}`, "color: green", "color: gray");
  } else {
    console.log(`%c✗ ${cmd} %c${argsText}`, "color: red", "color: gray");
    console.log(`%cstdout: ${textDecoder.decode(stdout)}`, "color: white");
    console.error(`%cstderr: ${textDecoder.decode(stderr)}`, "color: white");
  }
  return code;
}
