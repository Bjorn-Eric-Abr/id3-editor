import { spawn } from 'bun';

export async function runCli(args: string[], inputs: string[]): Promise<string> {
  const proc = spawn(['bun', 'run', 'index.ts', ...args], {
    stdin: 'pipe',
    stdout: 'pipe',
    stderr: 'pipe'
  });

  const writeInputs = async () => {
    for (const input of inputs) {
      if (input === 'ENTER') {
        proc.stdin.write('\x0D');
      } else if (input === 'DOWN') {
        proc.stdin.write('\x1B[B');
      } else if (input === 'UP') {
        proc.stdin.write('\x1B[A');
      } else {
        proc.stdin.write(input);
      }
      await Bun.sleep(100); // Wait for prompt to process
    }
    proc.stdin.end();
  };

  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    writeInputs()
  ]);

  return stdout + stderr;
}
