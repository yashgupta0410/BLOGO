import { asynchandler } from "../utilities/asynchandler.js";
import { ApiError } from "../utilities/apierror.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utilities/cloudinary.js";
import { ApiResponse } from "../utilities/apiresponse.js";
import jwt from "jsonwebtoken";
import { delete_image } from "../utilities/deletefromcloudinary.js";
import mongoose from "mongoose";
import {Post} from "../models/post.model.js";


const generateaccessandRefreshtoken=async(userId)=>{
 try {
    const user=await User.findById(userId)
    //console.log(user);
    //console.log("hello");
    const accessToken=user.generateaccesstoken()
    console.log(accessToken);
    const refreshToken=user.generaterefreshtoken()
    console.log("nexttttttttttttttttttttttttttt");
    console.log(refreshToken);
    user.refreshToken=refreshToken
    await user.save({validateBeforeSave:false})
    return {accessToken,refreshToken}
 } catch (error) {
    throw new ApiError(500,"something went wrong  while generating access and refersh token")
 }
}

const registerUser = asynchandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res


    const {fullname, email, username, password } = req.body
    console.log("email: ", email);

    if (
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    //console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverimage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverimage) && req.files.coverimage.length > 0) {
        coverImageLocalPath = req.files.coverimage[0].path
    }
    
    console.log("cover Image Path:",coverImageLocalPath);
    console.log("avatar Image Path:",avatarLocalPath);
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }
    
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverimage = await uploadOnCloudinary(coverImageLocalPath)
console.log(avatar)
    // if (!avatar) {
    //     throw new ApiError(400, "Failed to upload avatar")
    // }
   console.log(coverimage)

    const user = await User.create({
        fullname,//same as fullname:fullname
        avatar: avatar.url,
        coverimage: coverimage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

} )

const loginUser=asynchandler(async(req,res)=>{
    //req->body->data
    //username or email
    //find the user
    //password check
    //access and refresh token
    //send cookie
    const {email,username,password}=req.body;
    console.log(req.body);
    if(!username && !email){
        throw new ApiError(400,"username or email is required")

    }

    const user=await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
    throw new ApiError(404,"user does not exist")
    }

    const ispasswordvalid=await user.isPasswordCorrect(password)
    if(!ispasswordvalid){
        throw new ApiError(401,"invalid user credentials")
    }
    console.log(user._id);

    const {accessToken,refreshToken}=await generateaccessandRefreshtoken(user._id)
    //console.log(accessToken);
    const loggedinuser=await User.findById(user._id).
    select("-password -refreshToken")

    const options={
        httpOnly:true,
        secure:true
    }

    return res.status(200).cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .redirect("/api/v1/users/profile")

})

const logoutUser= asynchandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )

    const options={
        httpOnly:true,
        secure:true
    }

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"user logged out successfully"))
})

const refreshAccessToken= asynchandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorised request")
    }
    try {
        const decodedToken=jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user=await User.findById(decodedToken?._id)
         if(!user){
            throw new ApiError(401,"invalid refresh token")
         }
    
         if(incomingRefreshToken!==user?.refreshToken){
            throw new ApiError(401,"refresh token is expired or used")
         }
         const options={
            httpOnly:true,
            secure:true
         }
         const {accessToken,newRefreshToken}=await generateaccessandRefreshtoken(user._id)
    
         return res.status(200)
         .cookie("accessToken",accessToken,options)
         .cookie("refreshToken",newRefreshToken,options)
         .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken:newRefreshToken},
                "access token refreshed"
            )
         )
    } catch (error) {
        throw new ApiError(401,error?.message||"invalid refresh token")
    }
})  

const changeCurrentPassword=asynchandler(async (req,res)=>{
    const {oldPassword,newPassword}=req.body

    const user= await User.findById(req.user?._id)

    const  isPasswordCorrect=await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"invalid old password")

    }

    user.password=newPassword
    await user.save({validateBeforeSave:false})

    return res.status(200)
    .json(new ApiResponse(200,{},"password changed successfully"))

})

const getCurrentUser = asynchandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched successfully"
    ))
})


const updateAccountdetails= asynchandler(async(req,res)=>{
    const {fullname,email}=req.body
    if(!fullname || !email){
        throw new ApiError(400,"all fields are required")
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname:fullname,
                email:email
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"account details updated successfully"))
});

const updateAvatar= asynchandler(async(req,res)=>{
    const avatarlocalPath=req.file?.path
    //console.log(req.file);
    // console.log("nexttttttttttt");
    // console.log(avatarlocalPath);
    if(!avatarlocalPath){
        throw new ApiError(400,"avatar file is missing")
    }
    const deleteoldavatar= await delete_image(req.user.avatar);

    if(!deleteoldavatar){
        throw new ApiError(404,"error while deleting old avatar")
    }

    const avatar=await uploadOnCloudinary(avatarlocalPath)

    if(!avatar.url){
        throw new ApiError(400,"error while uploading file")
    }
   const user= await User.findByIdAndUpdate(
        req.user?._id,{
        $set:
        {
            avatar:avatar.url
        }
    },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"avatar updated successfully")
    )
})


const updateCoverImage= asynchandler(async(req,res)=>{
    const coverImagelocalPath=req.file?.path
    const oldcoverimage=req.user.coverimage
  if(oldcoverimage) { 
    const deleteoldcoverimage= await delete_image(oldcoverimage);

    if(!deleteoldcoverimage){
        throw new ApiError(404,"error while deleting old coverimage")
    }
}

    if(!coverImagelocalPath){
        throw new ApiError(400,"cover image file is missing")
    }

    const coverImage=await uploadOnCloudinary(coverImagelocalPath)

    if(!coverImage.url){
        throw new ApiError(400,"error while uploading file")
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,{
        $set:
        {
           coverimage:coverImage.url
        }
    },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"cover image updated successfully")
    )
})

const getUserChannelProfile= asynchandler(async(req,res)=>{
    const {username}=req.params
    if(!username?.trim()){
        throw new ApiError(400,"username is missing")
    }

    const channel=await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscriberscount:{
                    $size:"$subscribers"
                },
                channelSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                fullname:1,
                username:1,
                subscriberscount:1,
                channelSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverimage:1,
                email:1,

            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404,"channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"user channel fetched successfully")
    )
})

const getWatchHistory= asynchandler( async(req,res)=>{
    const user=await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id)
            }
        },
            {
                $lookup:{
                    from:"videos",
                    localField:"watchHistory",
                    foreignField:"_id",
                    as:"watchHistory",
                    pipeline:[
                        {
                           $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                               {
                                $projects:{
                                    fullname:1,
                                    username:1,
                                    avatar:1
                                }
                               }
                            ]
                           } 
                        },
                        {
                            $addFields:{
                                owner:{
                                    $first:"$owner"
                                }
                            }
                        }
                    ]
                }
            }
    ])

    return res.status(200)
    .json(
        new ApiResponse(200,user[0].watchHistory,"watch history fetched successfully")
    )
})


const createNewPost = asynchandler(async (req, res) => {
    const user = req.user;
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    console.log(req.file);
    const localFilePath = req.file.path;

    const imagelocalPath = await uploadOnCloudinary(localFilePath);

    const post = await Post.create({
        user: user._id,
        content: req.body.content,
        image: imagelocalPath.url,
        likes:[],
    });

    user.posts.push(post._id);
    await user.save();

    return res.status(200).redirect('/api/v1/users/profile');
});
export {registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    updateAccountdetails,
    getCurrentUser,
    updateAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory,
    createNewPost
}
//hwy