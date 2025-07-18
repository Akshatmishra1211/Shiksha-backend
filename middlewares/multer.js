import multer from "multer";
import { v4 as uuid } from "uuid";       // to generate ids to avoid collision in file names

const storage = multer.diskStorage({       // to handle file storage 
  destination(req, file, cb) {
    cb(null, "uploads");         // where to store
  },
  filename(req, file, cb) {
    const id = uuid();  // random id

    const extName = file.originalname.split(".").pop();    // extracts the extension of the file eg .png

    const fileName = `${id}.${extName}`;      // concate uuid with extension

    cb(null, fileName);         // tell the multer to save the file with newly created  name
  },
});

export const uploadFiles = multer({ storage }).single("file");
