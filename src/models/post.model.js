import mongoose from "mongoose";
import { Schema } from "mongoose";

const postSchema= new Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'

    },
    username:{
        type:String,
    },
    date:{
        type:Date,
        default:Date.now
    },
    content:String,
    likes:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:'user' //user->likes->ids
        }
    ],
    image:{
        type:String,
    }

},{timestamps:true})

export const Post = mongoose.model('Post',postSchema);