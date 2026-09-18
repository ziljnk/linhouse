const { createServer } = require("node:http")
const { parse } = require("node:url")
const path = require("node:path")
const fs = require("node:fs")
const next = require("next")

const passenger = globalThis.PhusionPassenger

if (passenger) {
  passenger.configure({ autoInstall: false })
}

const app = next({
  dev: false,
  dir: __dirname,
})

const handle = app.getRequestHandler()

const MIME_TYPES = {
  ".txt": "text/plain; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".avif": "image/avif",
}

function servePublicFile(req, res) {
  const pathname = parse(req.url).pathname

  if (!pathname || pathname === "/") {
    return false
  }

  const relativePath = decodeURIComponent(pathname).replace(/^\/+/, "")
  const filePath = path.resolve(__dirname, "public", relativePath)
  const publicRoot = path.resolve(__dirname, "public")

  // Prevent path traversal outside public/
  if (!filePath.startsWith(publicRoot + path.sep)) {
    return false
  }

  if (!fs.existsSync(filePath)) {
    return false
  }

  if (!fs.statSync(filePath).isFile()) {
    return false
  }

  const ext = path.extname(filePath).toLowerCase()

  res.statusCode = 200
  res.setHeader(
    "Content-Type",
    MIME_TYPES[ext] || "application/octet-stream"
  )

  fs.createReadStream(filePath).pipe(res)

  return true
}

app
  .prepare()
  .then(() => {
    const server = createServer((req, res) => {
      if (servePublicFile(req, res)) {
        return
      }

      handle(req, res, parse(req.url, true))
    })

    if (passenger) {
      server.listen("passenger")
    } else if (process.env.PORT) {
      server.listen(Number(process.env.PORT))
    } else {
      server.listen()
    }

    console.log("LINHouse Next.js is listening")
  })
  .catch((error) => {
    console.error("LINHouse failed to start")
    console.error(error)
    process.exit(1)
  })