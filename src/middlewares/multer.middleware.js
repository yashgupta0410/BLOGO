import path from 'path';
import crypto from'crypto';
import multer from 'multer';

//diskstorage
//import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      
      cb(null, file.originalname)
    }
  })
   
  
const upload = multer({ 
    storage, 
})

export default upload