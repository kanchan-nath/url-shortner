import mongoose from "mongoose";

const connectDB = ()=>{
    try {
        const Connectioninstance = mongoose.connect(`${process.env.MONGODB_URI}/${process.env.MONGODB_NAME}`)
        console.log(`MongoDB connected succesfully :${Connectioninstance}`);
        
        
    } catch (error) {
        console.error(`MongoDB connection failed: ${error}`);
        process.exit(1);
    }
}

export {
    connectDB
}