//require('dotenv').config({path:'./env'})
import dotenv from "dotenv"
import mongoose from "mongoose";
import {DB_NAME} from "./constants.js";
import {app} from "./app.js"

import connectDB from "./db/index.js";
//import { uploadResult } from "./utilities/cloudinary.js";

dotenv.config({
    path:'./env'
})
const port= process.env.PORT || 7000 //if env port availabl enhi hoga toh 7000 use ho jaega i.e. 7000 is default port
connectDB()
.then(()=>{
    app.on("error",(error)=>{
                console.log("ERRR:",error);
                throw error
               })
   app.listen(port,()=>{
    console.log(`server is running at ${port}`);
   })
})
.catch((err)=>{
    console.log("MONGODB connection error || failed",err);
})


// uploadResult()
// .then(()=>{
//     console.log("success");
// })
// .catch((error)=>{
//     console.log("file upload failed big time");
// })






//import express from "express";
// const app=express()
// ;(async()=>{
//     try {
//        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
//        app.on("error",(error)=>{
//         console.log("ERRR:",error);
//         throw error
//        })
//        app.listen(process.env.PORT,()=>{
//         console.log(`App is listening on port ${process.env.PORT}`);
//        })
//     } catch (error) {
//         console.error("error:",error)
//         throw err
//     }
// })()