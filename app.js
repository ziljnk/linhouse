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

    // Same reverse-port binding as cPanel's generated app.js (`server.listen()`).
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
