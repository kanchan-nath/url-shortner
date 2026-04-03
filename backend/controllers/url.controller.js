import { UrlSchema } from "../models/url.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {nanoid}  from "nanoid"

const createShortUrl = asyncHandler(async(req, res)=>{
    const {originalUrl} = req.body
    
    const shortUrlCode = nanoid()

    const url = await UrlSchema.create({
        originalUrl: originalUrl,
        shortUrl: shortUrlCode,
    })
    
    return res
    .json(url, "Short Url saved")
})

const getShortUrl = asyncHandler((req, res)=>{

})

export {
    createShortUrl,
    getShortUrl
}