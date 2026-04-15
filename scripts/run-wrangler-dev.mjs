import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const requiredEnvVars = ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID", "ADMIN_PASSWORD"];
const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);
const require = createRequire(import.meta.url);

if (missingEnvVars.length > 0) {
  console.error(
    `Missing required environment variables for local dev: ${missingEnvVars.join(", ")}. This template keeps local and GitHub configuration aligned around the same three variables; configure them as persistent local environment variables and see README.md.`,
  );
  process.exit(1);
}

const wranglerBin = require.resolve("wrangler/bin/wrangler.js");
const command = process.execPath;
const args = [wranglerBin, "dev", ...process.argv.slice(2)];

const child = spawn(command, args, {
  stdio: "inherit",
  env: {
    ...process.env,
    CLOUDFLARE_INCLUDE_PROCESS_ENV: "true",
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
