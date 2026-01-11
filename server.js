import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import express from "express"


const isTest = process.env.VITEST;

export default async function createServer(
  root = process.cwd(),
  isProd = process.env.NODE_ENV === "production",
  hmrPort
) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const resolve = (p) => path.resolve(__dirname, p);

  const indexProd = isProd
    ? fs.readFileSync(resolve("dist/client/index.html"), "utf-8")
    : "";

  const manifest = isProd
    ? JSON.parse(
        fs.readFileSync(resolve("dist/client/.vite/ssr-manifest.json"), "utf-8")
      )
    : {};

  const app = express();

  /**
   * @type {import('vite').ViteDevServer}
   */
  let vite;
  if (!isProd) {
    vite = await (
      await import("vite")
    ).createServer({
      base: "/",
      root,
      logLevel: isTest ? "error" : "info",
      server: {
        middlewareMode: true,
        watch: {
          usePolling: true,
          interval: 100,
        },
        hmr: {
          port: hmrPort,
          // serve: true,
        },
      },
      appType: "custom",
    });
    app.use(vite.middlewares);
  } else {
    app.use((await import("compression")).default());
    app.use(
      "/",
      (await import("serve-static")).default(resolve("dist/client"), {
        index: false,
      })
    );
  }
  
  app.use(async (req, res) => {
    try {
      const url = req.originalUrl;

      let template, render;
      if (!isProd) {
        template = fs.readFileSync(resolve("index.html"), "utf-8");
        // template = await vite.transformIndexHtml(url, template);
        render = (await vite.ssrLoadModule("./src/server")).render;
      } else {
        template = indexProd;
        render = (await import("./dist/server/server.js")).render;
      }

      const {
        appHtml,
        preloadLinks,
        headPayload,
        teleports,
      } = await render(req.headers.host, url, manifest);

      // console.log(teleports)

      const html = template
        .replace('<!--head-->', headPayload.headTags)
        .replace(`<!--preload-links-->`, preloadLinks)
        .replace(`<!--app-html-->`, appHtml)
        // .replace('<!--bodyOpen-->', headPayload.bodyTags)
        // .replace('<!--bodyClose-->', headPayload.bodyTagsOpen)
        .replace('<!--teleports-->', teleports ? teleports['#teleports'] || '' : '')

      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e) {
      vite && vite.ssrFixStacktrace(e);
      console.log(e.stack);
      res.status(500).end(e.stack);
    }
  })

  return app;
}

if (!isTest) {
  createServer().then((app) =>
    app.listen(5000, () => {
      console.log("http://localhost:5000");
    })
  );
}
