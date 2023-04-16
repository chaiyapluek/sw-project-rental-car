const {
	S3Client,
	PutObjectCommand,
	DeleteObjectCommand,
    GetObjectCommand,
} = require("@aws-sdk/client-s3");
const dotenv = require("dotenv");
dotenv.config({ path: "./config/config.env" });

const s3 = new S3Client({
	region: process.env.S3_BUCKET_REGION,
	credentials: {
		accessKeyId: process.env.S3_ACCESS_KEY,
		secretAccessKey: process.env.S3_SECRET_KEY,
	},
});

const uploadfn = async (oid, files) => {
	const uploadPromises = files.map(async (file) => {
		const key = oid + "/" + file.originalname;
		const params = {
			Bucket: process.env.S3_BUCKET,
			Key: key,
			Body: file.buffer,
			ContentType: file.mimetype,
		};
		try {
			const command = new PutObjectCommand(params);
			await s3.send(command); // Upload the file to S3
			return key;
		} catch (err) {
			console.error(err);
		}
	});
	try {
		const result = await Promise.all(uploadPromises);
		return result;
	} catch (err) {
		console.error(err);
	}
};

const deletefn = async (key) => {
	const params = {
		Bucket: process.env.S3_BUCKET,
		Key: key,
	};
	try {
		const command = new DeleteObjectCommand(params);
		await s3.send(command);
		console.log(`File ${key} deleted successfully from S3`);
	} catch (error) {
		console.log(`Error deleting file ${key} from S3: ${error}`);
	}
};

module.exports = { uploadfn, deletefn };
