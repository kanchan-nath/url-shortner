import express from "express"
import cors from "cors"
import urlRouter from "./routes/url.route.js"

const app  = express()

app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.json({ limit: "16kb" }))
app.use("/api", urlRouter)
export {app}