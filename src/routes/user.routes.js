import { Router } from "express";
import { changeCurrentPassword,
     createNewPost,
     getCurrentUser,
      getUserChannelProfile,
       getWatchHistory, 
       loginUser,  
       logoutUser,
        refreshAccessToken, 
        registerUser, 
        updateAccountdetails,
         updateAvatar, 
         updateCoverImage} from "../controllers/user.controller.js";
import upload  from "../middlewares/multer.middleware.js";
import verifyJWT from "../middlewares/auth.middleware.js";
import { User } from "../models/user.model.js";
import { Post } from "../models/post.model.js";
const router=Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxcount:1
        },
         {
            name:"coverimage",
            maxcount:1
         }
    ]),
    registerUser
)
router.route("/").get((req,res)=>{res.render("index.ejs")})

router.route("/login").get((req, res) => {
    res.render("login.ejs"); // Ensure you have a login.ejs file in your views folder
}).post(loginUser);


router.route("/profile").get(verifyJWT,async function(req,res){
    let user=await User.findOne({email:req.user.email}).populate("posts");
    res.render("profile",{user});

})

router.route('/like/:id').get(verifyJWT, async function(req, res) {
    try {
        const post = await Post.findById(req.params.id).populate("user");

        if (!post) {
            return res.status(404).send("Post not found");
        }

        // Debugging information
        console.log('Post found:', post);
        console.log('User ID:', req.user._id);

        if (!post.likes) {
            post.likes = [];
        }

        const userIdIndex = post.likes.indexOf(req.user._id);

        if (userIdIndex === -1) {
            post.likes.push(req.user._id);
        } else {
            post.likes.splice(userIdIndex, 1);
        }

        await post.save();
        res.redirect("/api/v1/users/profile");
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});


router.route("/post").post(verifyJWT,upload.single("image"),createNewPost)

router.route("/logout").post(verifyJWT,logoutUser)

router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT,changeCurrentPassword)

router.route("/current-user").get(verifyJWT,getCurrentUser)

router.route("/update-account").patch(verifyJWT,updateAccountdetails)

router.route("/updateavatar").patch(verifyJWT, upload.single("avatar"),updateAvatar)

router.route("/updatecoverimage").patch(verifyJWT,upload.single("coverimage"),updateCoverImage)

router.route("/c/:username").get(verifyJWT,getUserChannelProfile)

router.route("/watchHistory").get(verifyJWT,getWatchHistory)
export {router}