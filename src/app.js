import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
const app=express()
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.set("view engine","ejs")
app.set('views', path.join(__dirname, 'views')) // Adjust the path if needed

 app.use(express.json({
    limit:"16kb"
 }))
  app.use(express.urlencoded({extended:true,
    limit:"16kb"
  }))
  app.use(express.static("public"))
  app.use(cookieParser()) 
//routes import
import {router} from './routes/user.routes.js'

//routes declaration
app.use("/api/v1/users",router)

//http://localhost:8000/api/v1/users/register

export {app}