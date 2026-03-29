import dotenv from "dotenv"
dotenv.config()
import {app} from "./app.js"
import { connectDB } from "./config/db.js"

connectDB()
.then(()=>{
    app.listen(process.env.PORT, ()=>{
        console.log(`Server is connected at PORT: ${process.env.PORT}`);
    })
}).catch((error)=>{
    console.error(`Server is not connected: ${error}`);
    
})