import { ApiError } from "../utilities/apierror.js"
import { asynchandler } from "../utilities/asynchandler.js"
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";


const verifyJWT=asynchandler(async(req,res,next)=>{
   try {
    const token= req.cookies?.accessToken|| req.header
     ("Authorization")?.replace("Bearer ","")
     //console.log(token);
     if(!token){
         throw new ApiError(401,"unauthorized request")
     }
     const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
      const user=await User.findById(decodedToken?._id).select
      ("-password -refreshToken")
      if(!user){
         throw new ApiError(401,"invalid access token")
      }
      req.user=user;
      next()
   } catch (error) {
     throw new ApiError(401,"invalid acesstoken")
   }
    
    
})

export default verifyJWT