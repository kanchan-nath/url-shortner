import React, { useState } from 'react'
import ThreeBackground from "./ThreeBackground.jsx";
import './ShortenForm.css'
const ShortenForm = () => {
    const [url, setUrl] = useState("")
    const [urlResult, setUrlResult] = useState("")
    const [error, setError] = useState("")

    const submitForm = async (e) => {
        e.preventDefault()
        const urlRoute = "http://localhost:4000/api/shorten"
        try {
            const response = await fetch(urlRoute, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ originalUrl: url })
            })

            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }
            const data = await response.json()
            console.log(data);

            setUrlResult(data.shortUrl)


        } catch (error) {
            console.log("Error", error);

        }


    }


    return (
        <>
            <ThreeBackground />
            <div className="page">
                <div className="card">
                    <h1 className="headline">Shorten your link.</h1>
                    <p className="subtitle">Paste a long URL and get a clean short link instantly.</p>

                    <form className="form" onSubmit={submitForm}>
                        <input
                            type="text"
                            name="originalUrl"
                            className="url-input"
                            placeholder="Paste your URL here..."
                            value={url}
                            required
                            onChange={(e) => setUrl(e.target.value)}
                        />
                        <button type="submit" className="submit-btn">Shorten</button>
                    </form>

                    {urlResult && (
                        <div className="result">
                            <span className="result-label">Short URL</span>
                            <span className="result-url">http://localhost:5173/api/{urlResult}</span>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}


export default ShortenForm
