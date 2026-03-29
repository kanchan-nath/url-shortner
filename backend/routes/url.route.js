import {Router} from "express"

const router = Router()

router.route("/shorten").post(createShortUrl)
router.route("/:shorturl").get(getShortUrl)
export default router