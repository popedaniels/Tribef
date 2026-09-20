// server.js
process.env.NODE_ENV = process.env.NODE_ENV || "development";

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT || 3000);
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    const { pathname, query } = parsedUrl;

    if (
      (pathname === "/sw.js" ||
        /^\/(workbox|worker|fallback)-\w+\.js$/.test(pathname)) &&
      dev
    ) {
      // In development mode, serve an unregistering script so stale service workers
      // unregister themselves and do not block Webpack HMR or dev assets.
      res.setHeader("Content-Type", "application/javascript");
      res.writeHead(200);
      res.end(`
        self.addEventListener('install', () => self.skipWaiting());
        self.addEventListener('activate', (event) => {
          event.waitUntil(
            self.registration.unregister().then(() => {
              return self.clients.matchAll({ type: 'window' });
            })
          );
        });
      `);
      return;
    } else if (pathname === "/campaign") {
      res.writeHead(301, { Location: "/Categories" });
      res.end();
    } else if (pathname === "/category") {
      res.writeHead(301, { Location: "/Categories" });
      res.end();
    } else {
      handle(req, res, parsedUrl);
    }
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
