import { spawn } from 'node:child_process';

export function runCli(args: string[], inputs: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('bun', ['run', 'index.ts', ...args], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    child.stdout.on('data', data => {
      output += data.toString();
    });
    
    child.stderr.on('data', data => {
      output += data.toString();
    });

    // Write inputs one by one with a small delay
    const writeInputs = async () => {
      for (const input of inputs) {
        if (input === 'ENTER') {
          child.stdin.write('\x0D');
        } else if (input === 'DOWN') {
          child.stdin.write('\x1B[B');
        } else if (input === 'UP') {
          child.stdin.write('\x1B[A');
        } else {
          child.stdin.write(input);
        }
        await new Promise(r => setTimeout(r, 100)); // Wait for prompt to process
      }
      child.stdin.end();
    };

    writeInputs().catch(reject);

    child.on('exit', code => {
      resolve(output);
    });
  });
}
