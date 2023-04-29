const Booking = require('../models/Booking')
const Provider = require('../models/Provider')

// @desc    Get all bookings
// @route   GET /api/v1/bookings
// @access  Public
exports.getBookings = async (req, res, next) => {
  let query
  const options = {
    complete:
      req.query.complete === 'true'
        ? true
        : req.query.complete === 'false'
        ? false
        : { $ne: null },
  }

  if (req.user.role !== 'admin' || req.query.all === 'false') {
    // General users can see only their bookings!
    query = Booking.find({ user: req.user.id, ...options }).populate({
      path: 'provider',
      select: 'name tel address pic',
      transform: (doc) => ({
        // ...doc,
        _id: doc._id,
        name: doc.name,
        tel: doc.tel,
        address: doc.address,
        pic: process.env.S3_DOMAIN + doc.pic,
      }),
    })
  } else {
    // If you are an admin, you can see all!
    query = Booking.find({ ...options }).populate({
      path: 'provider',
      select: 'name tel address pic',
      transform: (doc) => ({
        // ...doc,
        _id: doc._id,
        name: doc.name,
        tel: doc.tel,
        address: doc.address,
        pic: process.env.S3_DOMAIN + doc.pic,
      }),
    })
  }
  try {
    const bookings = await query

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      message: 'Cannot find Booking',
    })
  }
}

// @desc    Get single booking
// @route   GET /api/v1/bookings/:id
// @access  Public
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate({
      path: 'provider',
      select: 'name description tel',
    })

    if (!booking) {
      res.status(404).json({
        success: false,
        message: `No booking with the id of ${req.params.id}`,
      })
    }

    res.status(200).json({
      success: true,
      data: booking,
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      message: 'Cannot find Booking',
    })
  }
}

// @desc    Add booking
// @route   POST /api/v1/providers/:providerId/booking
// @access  Private
exports.addBooking = async (req, res, next) => {
  try {
    req.body.provider = req.params.providerId

    const provider = await Provider.findById(req.params.providerId)

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: `No provider with the id of ${req.params.providerId}`,
      })
    }

    // Add user id to req.body
    req.body.user = req.user.id

    // Check for existing booking
    const existingBookings = await Booking.find({
      user: req.user.id,
      complete: false,
    })

    // If the user is not an admin, they can only create 3 bookings.
    if (existingBookings.length >= 3 && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: `The user with ID ${req.user.id} has already made 3 bookings`,
      })
    }

    const booking = await Booking.create(req.body)

    res.status(200).json({
      success: true,
      data: booking,
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      message: 'Cannot create Booking',
    })
  }
}

// @desc    Update booking
// @route   PUT /api/v1/bookings/:id
// @access  Private
exports.updateBooking = async (req, res, next) => {
  try {
    let booking = await Booking.findById(req.params.id)

    if (!booking) {
      res.status(404).json({
        success: false,
        message: `No booking with the id of ${req.params.id}`,
      })
    }

    // Make sure user is the booking owner
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this booking`,
      })
    }

    booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    res.status(200).json({
      success: true,
      data: booking,
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      message: 'Cannot update Booking',
    })
  }
}

// @desc    Delete booking
// @route   DELETE /api/v1/bookings/:id
// @access  Private
exports.deleteBooking = async (req, res, next) => {
  // try {
  const booking = await Booking.findById(req.params.id)

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: `No booking with the id of ${booking.id}`,
    })
  }

  // Make sure user is the booking owner
  if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(401).json({
      success: false,
      message: `User ${req.user.id} is not authorized to delete this booking`,
    })
  }

  await booking.remove()

  res.status(200).json({
    success: true,
    data: {},
  })
  // } catch (error) {
  //   console.log(error)
  //   return res.status(500).json({
  //     success: false,
  //     message: 'Cannot delete Booking',
  //   })
  // }
}
