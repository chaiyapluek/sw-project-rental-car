const mongoose = require('mongoose')

const ProviderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      unique: true,
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters'],
    },
    address: {
      type: String,
      required: [true, 'Please add an address'],
    },
    // district: {
    //   type: String,
    //   required: [true, 'Please add a district'],
    // },
    // province: {
    //   type: String,
    //   required: [true, 'Please add a province'],
    // },
    // postalcode: {
    //   type: String,
    //   required: [true, 'Please add a postalcode'],
    //   maxlength: [5, 'Postal Code cannot be more than 5 digits'],
    // },
    tel: {
      type: String,
    },
    // region: {
    //   type: String,
    //   required: [true, 'Please add a region'],
    // },
    images: {
      type: [String],
    },
    pic: {
      type: String,
      default: "default.png",
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Cascade delete appointments when a hospital is deleted
ProviderSchema.pre('remove', async function (next) {
  console.log(`Bookings being removed from provider ${this._id}`)
  await this.model('Booking').deleteMany({ provider: this._id })
  next()
})

// Reverse populate with virtuals
ProviderSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'provider',
  justOne: false,
  
})

module.exports = mongoose.model('Provider', ProviderSchema)
