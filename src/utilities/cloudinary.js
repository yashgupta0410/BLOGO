import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret:process.env.COULDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            console.log("Local file path is not provided");
            return null;
        }
        
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        
        console.log("File is uploaded on Cloudinary", response);

        // Remove the local file after upload
        fs.unlinkSync(localFilePath);
        
        return response;
    } catch (error) {
        // Remove the local file even if the upload fails
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        console.log("File upload failed:", error.message);
        console.log("Error details:", error);
        return null;
    }
};

export { uploadOnCloudinary };
