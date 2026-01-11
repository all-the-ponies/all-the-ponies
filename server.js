import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import express from "express"
import compression from 'compression'
import serveStatic from 'serve-static'


const isTest = process.env.VITEST;

export default function createServer(
  root = process.cwd(),
  isProd = process.env.NODE_ENV === "production",
  hmrPort
) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const resolve = (p) => path.resolve(__dirname, p);
  
  console.log(fileURLToPath(import.meta.url))
  console.log('files', fs.readdirSync('./'))
  console.log('files', fs.readdirSync('./dist'))
  console.log('files', fs.readdirSync('./dist/server'))
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
  let viteServer

  if (!isProd) {
    import('vite').then(vite => {
      vite.createServer({
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
            serve: true,
          },
        },
        appType: "custom",
      }).then(_viteServer => {
        viteServer = _viteServer
        app.use(_viteServer.middlewares);
      })
    })
  } else {
    app.use(compression());
    app.use(
      "/",
      serveStatic(resolve("dist/client"), {
        index: false,
      })
    );
  }
  
  app.use(async (req, res) => {
    try {
      const url = req.originalUrl;

      let template, render;
      if (!isProd) {
        template = fs.readFileSync(resolve("./index.html"), "utf-8");
        // template = await viteServer.transformIndexHtml(url, template);
        render = (await viteServer.ssrLoadModule("./src/server")).render;
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
      viteServer && viteServer.ssrFixStacktrace(e);
      console.log(e.stack);
      res.status(500).end(e.stack);
    }
  })

  return app;
}

if (!isTest) {
  let app = createServer()
  app.listen(5000, () => {
    console.log("http://localhost:5000");
  })
}
