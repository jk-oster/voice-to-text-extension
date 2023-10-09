import { resolve } from "path";
import { defineConfig } from "vite";
import { chromeExtension } from "vite-plugin-chrome-extension";
import { viteRequire } from 'vite-require'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const _dirname = typeof __dirname !== 'undefined'
    ? __dirname
    : dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
    resolve: {
        alias: {
            "@": resolve(_dirname, "src")
        }
    },
    build: {
        rollupOptions: {
            input: "src/manifest.json",

            output: {
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name.includes('main.css'))
                        return 'main.css';
                    return assetInfo.name;
                },
            }
        }
    },
    plugins: [
        chromeExtension(),
        viteRequire()
    ]
});