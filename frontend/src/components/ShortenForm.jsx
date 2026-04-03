import React, { useState } from 'react'

const ShortenForm = () => {
    const [url, setUrl] = useState("")
    const [urlResult, setUrlResult] = useState("")
    const [error, setError] = useState("")

    const submitForm =async (e) => {
        e.preventDefault()
        const urlRoute = "http://localhost:4000/api/shorten"
        try {
            const response = await fetch(urlRoute,{
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ originalUrl: url})
            })

            if(!response.ok){
                throw new Error(`Response status: ${response.status}`);
            }
            const data = await response.json()
            console.log(data);
            
            setUrlResult(data.shortUrl)
            
            
        } catch (error) {
            console.log("Error",error);
            
        }


    }


    return (
        <>
            <form onSubmit={submitForm}>
                <input
                    type="text"
                    name='originalUrl'
                    placeholder='Enter Url'
                    value={url}
                    required
                    onChange={(e) => setUrl(e.target.value)}
                />
                <button type='submit'>Submit</button>
            </form>

            {urlResult && <h1>Shorted URL is "http://localhost:5173/{urlResult}"</h1>}
        </>
    )
}

export default ShortenForm
