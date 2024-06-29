import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret:process.env.COULDINARY_API_SECRET 
});

const delete_image=async(url)=>{
      
      try {
        if(!url){
            console.log("no image to delete available");
            return null;
        }
        const parts = url.split('/');
        const publicIdWithExtension = parts.slice(-1)[0]; // Get the last part, which includes the public ID and the extension
        const public_id = publicIdWithExtension.split('.')[0];

        const result = await cloudinary.uploader.destroy(public_id);
        console.log('Image deleted:', result);
        return result;
      } catch (error) {
        console.log("deletion failed");
        return null;
      }
}

export {delete_image}