import { UrlSchema } from "../models/url.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { nanoid } from "nanoid"

const createShortUrl = asyncHandler(async (req, res) => {
    const { originalUrl } = req.body

    const existedUrl = await UrlSchema.findOne({originalUrl}).select("shortUrl")

    if(existedUrl){
        return res
        .json(existedUrl)
    }

    const shortUrlCode = nanoid()

    const url = await UrlSchema.create({
        originalUrl: originalUrl,
        shortUrl: shortUrlCode,
    })

    return res
        .json(url, "Short Url saved")
})

const getShortUrl = asyncHandler(async(req, res) => {
    const { shortUrl } = req.params

    if (!shortUrl){
        throw new Error("Plz provide valid Url")
    }

    const result = await UrlSchema.findOne({
        shortUrl: shortUrl,
    }).select("originalUrl")

    if(!result){
        throw new Error("Url is invalid")
    }
    
    return res
    .redirect(result.originalUrl);

    // return res.json(result.shortUrl)
})

export {
    createShortUrl,
    getShortUrl
}