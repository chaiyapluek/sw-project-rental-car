const express = require('express')
const {
  getProviders,
  createProvider,
  getProvider,
  deleteProvider,
  updateProvider,
  providerImageUpload,
  providerImageDelete,
} = require('../controllers/providers')

// Include other resource routers
const bookingRouter = require('./bookings')

const router = express.Router()
const { protect, authorize } = require('../middleware/auth')
const {upload} = require('../middleware/fileupload')

// Re-route into other resource routers
router.use('/:providerId/bookings', bookingRouter)

router
  .route('/')
  .get(getProviders)
  .post(protect, authorize('admin'), createProvider)

  router
  .route('/:id')
  .get(getProvider)
  .put(protect, authorize('admin'), updateProvider)
  .delete(protect, authorize('admin'), deleteProvider)

router
  .route('/:id/image')
  .put(protect, authorize('admin'), upload.array('images'), providerImageUpload)
  .delete(protect, authorize('admin'), upload.array('images'), providerImageDelete)
module.exports = router
