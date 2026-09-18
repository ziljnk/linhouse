const { createServer } = require("node:http")
const { parse } = require("node:url")
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

app
  .prepare()
  .then(() => {
    const server = createServer((req, res) => {
      handle(req, res, parse(req.url, true))
    })

    if (passenger) {
      server.listen("passenger")
      return
    }

    const port = Number(process.env.PORT) || 3000
    server.listen(port, "127.0.0.1")
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
