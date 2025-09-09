// server/index.ts
import { exec } from "child_process";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var projectRoot = resolve(__dirname, "..");
console.log("Starting frontend-only translation manager...");
var viteProcess = exec("vite dev --host 0.0.0.0 --port 5000", {
  cwd: projectRoot,
  stdio: "inherit"
});
viteProcess.stdout?.on("data", (data) => {
  console.log(data.toString());
});
viteProcess.stderr?.on("data", (data) => {
  console.error(data.toString());
});
viteProcess.on("close", (code) => {
  console.log(`Vite process exited with code ${code}`);
  process.exit(code || 0);
});
viteProcess.on("error", (error) => {
  console.error("Failed to start Vite:", error);
  process.exit(1);
});
