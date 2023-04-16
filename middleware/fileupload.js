const multer = require("multer");


const upload = multer({
	storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image")) {
            cb(null, true);
        }else {
            cb("Please upload only images.", false);
        }
    },
	limits: {
		fileSize: 1024 * 1024 * 10, // limit file size to 10 MB
	},
});

module.exports = { upload };
