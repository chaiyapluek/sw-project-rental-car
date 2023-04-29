const Provider = require("../models/Provider");
// const VacCenter = require('../models/VacCenter')

const { uploadfn, deletefn, getObject } = require("../utils/fileupload");

const dotenv = require("dotenv");
dotenv.config({ path: "./config/config.env" });

// @desc    Get all providers
// @route   GET /api/v1/providers
// @access  Public
exports.getProviders = async (req, res, next) => {
	try {
		let query;

		// Copy req.query
		const reqQuery = { ...req.query };

		// Fields to exclude
		const removeFields = ["select", "sort"];

		// Loop over remove fields and delete them from reqQuery
		removeFields.forEach((param) => delete reqQuery[param]);
		console.log(reqQuery);

		// Create query string
		let queryStr = JSON.stringify(req.query);

		// Create operators ($gt, $gte, etc.)
		queryStr = queryStr.replace(
			/\b(gt|gte|lt|lte|in)\b/g,
			(match) => `$${match}`
		);

		// Finding resource
		query = Provider.find(JSON.parse(queryStr)).populate("bookings");

		// Select fields
		if (req.query.select) {
			const fields = req.query.select.split(",").join(" ");
			query = query.select(fields);
		}

		// Sort
		if (req.query.sort) {
			const sortBy = req.query.sort.split(",").join(" ");
			query = query.sort(sortBy);
		} else {
			query = query.sort("-createdAt");
		}

		// Pagination
		const page = parseInt(req.query.page, 10) || 1;
		const limit = parseInt(req.query.limit, 10) || 25;

		const startIndex = (page - 1) * limit;
		const endIndex = page * limit;
		const total = await Provider.countDocuments();

		query = query.skip(startIndex).limit(limit);

		// Executing query
		const providers = await query;

		// Add s3 domain to key
		const providersWithUrl = providers.map((provider) => {
			const urls = provider.images.map((image) => {
				return process.env.S3_DOMAIN + image;
			});
			provider.images = urls;
			return provider;
		});

		// Pagination result
		const pagination = {};
		if (endIndex < total) {
			pagination.next = {
				page: page + 1,
				limit,
			};
		}

		if (startIndex > 0) {
			pagination.prev = {
				page: page - 1,
				limit,
			};
		}

		res.status(200).json({
			success: true,
			count: providers.length,
			pagination,
			data: providersWithUrl,
		});
	} catch (err) {
		res.status(400).json({
			success: false,
		});
	}
};

// @desc    Get single provider
// @route   GET /api/v1/provider/:id
// @access  Public
exports.getProvider = async (req, res, next) => {
	try {
		const provider = await Provider.findById(req.params.id);
		if (!provider) {
			return res.status(400).json({
				success: false,
			});
		}
		const urls = provider.images.map((image) => {
			return process.env.S3_DOMAIN + image;
		});
		provider.images = urls;
		res.status(200).json({
			success: true,
			data: provider,
		});
	} catch (err) {
		return res.status(400).json({
			success: false,
		});
	}
};

// @desc    Create new provider
// @route   POST /api/v1/providers
// @access  Private
exports.createProvider = async (req, res, next) => {
	const provider = await Provider.create(req.body);
	res.status(201).json({
		success: true,
		data: provider,
	});
};

// @desc    Update provider
// @route   PUT /api/v1/providers/:id
// @access  Private
exports.updateProvider = async (req, res, next) => {
	try {
		const provider = await Provider.findByIdAndUpdate(
			req.params.id,
			req.body,
			{
				new: true,
				runValidators: true,
			}
		);
		if (!provider) {
			return res.status(400).json({
				success: false,
			});
		}
		res.status(200).json({
			success: true,
			data: provider,
		});
	} catch (err) {
		return res.status(400).json({
			success: false,
		});
	}
};

// @desc    Delete provider
// @route   DELETE /api/v1/providers/:id
// @access  Private
exports.deleteProvider = async (req, res, next) => {
	try {
		const provider = await Provider.findById(req.params.id);
		if (!provider) {
			return res.status(400).json({
				success: false,
			});
		}
		provider.images.forEach(async (key) => {
			await deletefn(key);
		});
		provider.remove();
		res.status(200).json({
			success: true,
			data: {},
		});
	} catch (err) {
		res.status(400).json({
			success: false,
		});
	}
};

// @desc    Upload Provider image
// @route   PUT /api/v1/providers/:id/image
// @access  Private
exports.providerImageUpload = async (req, res, next) => {
	try {
		const provider = await Provider.findById(req.params.id);
		if (!provider) {
			return res.status(400).json({
				success: false,
			});
		}
		if (!req.files) {
			return res.status(400).json({
				success: false,
			});
		}
		const result = await uploadfn(req.user.id, req.files);
		provider.images = [...provider.images, ...result];
		await provider.save();
		const urls = provider.images.map((image) => {
			return process.env.S3_DOMAIN + image;
		});
		provider.images = urls;
		res.status(200).json({
			success: true,
			data: provider,
		});
	} catch (err) {
		console.log(err);
		res.status(400).json({
			success: false,
		});
	}
};

exports.providerImageDelete = async (req, res, next) => {
	try {
		const provider = await Provider.findById(req.params.id);
		if (!provider) {
			return res.status(404).json({
				success: false,
				message: "provider not found",
			});
		}
		isExist = provider.images.includes(req.body.key);
		if (!isExist) {
			return res.status(404).json({
				success: false,
				message: "image not found",
			});
		}
		const result = await deletefn(req.body.key);
		provider.images = provider.images.filter(
			(image) => image !== req.body.key
		);
		await provider.save();
		res.status(200).json({
			success: true,
		});
	} catch (err) {
		res.status(500).json({
			success: false,
			message: "something went wrong",
		});
	}
};
