const mongoose = require('mongoose')

const connectdb = async () => {
  mongoose.set('strictQuery', true)
  const connect = await mongoose.connect(process.env.MONGO_URI)

  console.log(`MongoDB connected: ${connect.connection.host}`)
}

module.exports = connectdb
