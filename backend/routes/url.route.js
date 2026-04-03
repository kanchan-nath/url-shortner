import {Router} from "express"
import {
    createShortUrl,
    getShortUrl
} from "../controllers/url.controller.js"
const router = Router()

router.route("/shorten").post(createShortUrl)
router.route("/:shortUrl").get(getShortUrl)
export default router