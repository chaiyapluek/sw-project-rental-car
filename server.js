const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const cookieParser = require('cookie-parser')
const mongoSanitize = require('express-mongo-sanitize')
const helmet = require('helmet')
const xss = require('xss-clean')
const rateLimit = require('express-rate-limit')
const hpp = require('hpp')

const connectdb = require('./config/db')

// Route files
const auth = require('./routes/auth')
const providers = require('./routes/providers')
const bookings = require('./routes/bookings')

// Load env vars
dotenv.config({ path: './config/config.env' })

// Connect to database
connectdb()

const app = express()

// CORS
app.use(cors())

// Body parser
app.use(express.json())

// Cookie parser
app.use(cookieParser())

// Sanitize data
app.use(mongoSanitize())

// Set security headers
app.use(helmet())

// Prevent XSS attacks
app.use(xss())

// Rate Limiting
const limiter = rateLimit({
  windowsMs: 10 * 60 * 1000, //10 mins
  max: 100,
})
app.use(limiter)

// Prevent http param pollutions
app.use(hpp())

app.get('/', (req, res) => {
  //1. res.send('<h1>Hello from express</h1>')
  //2. res.send({ name: 'Brad' })
  //3. res.json({ name: 'Brad' })
  //4. res.sendStatus(400)
  //5. res.status(400).json({ success: false })
  res.status(200).json({
    success: true,
    data: { id: 1 },
  })
})

// Mount routers
app.use('/api/v1/auth', auth)
app.use('/api/v1/providers', providers)
app.use('/api/v1/bookings', bookings)

const PORT = process.env.PORT || 5000

const server = app.listen(
  PORT,
  console.log('Server running in', process.env.NODE_ENV, 'mode on port', PORT)
)

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`)
  // Close server & exit process
  server.close(() => process.exit(1))
})
