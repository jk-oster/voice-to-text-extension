import { resolve } from "path";
import { defineConfig } from "vite";
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import webExtension, { readJsonFile } from "vite-plugin-web-extension";

const _dirname = typeof __dirname !== 'undefined'
    ? __dirname
    : dirname(fileURLToPath(import.meta.url));

const target = process.env.TARGET || "chrome";


function generateManifest() {
  const manifest = readJsonFile("src/manifest.json");
  const pkg = readJsonFile("package.json");
  return {
    name: pkg.name,
    description: pkg.description,
    version: pkg.version,
    ...manifest,
  };
}

// https://vitejs.dev/config/
export default defineConfig({
    resolve: {
        alias: {
            "@": resolve(_dirname, "src")
        }
    },
    define: {
        'process.env': process.env,
        __BROWSER__: JSON.stringify(target), // usage in script: if (__BROWSER__ === "firefox") {...}
    },
    plugins: [
        webExtension({
            browser: target,
            manifest: generateManifest,
            watchFilePaths: ["package.json", "manifest.json"],
            additionalInputs: ["src/recorder/recorder.html"]
        }),
    ]
});