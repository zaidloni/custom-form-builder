import 'dotenv/config'
import Fastify from 'fastify'
import mongoose from 'mongoose'
import { registerRoutes } from './src/routes'
const app = Fastify()

async function start() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGODB_URI as string)
    console.log('MongoDB connected.')

    console.log('Registering routes...')
    await registerRoutes(app)
    console.log('Routes registered.')

    const port = Number(process.env.PORT) || 3000
    console.log(`Starting server on port ${port}...`)
    await app.listen({ port, host: '0.0.0.0' })
    console.log('Server is running.')
  } catch (err) {
    console.error('Fatal startup error:', err)
    process.exit(1)
  }
}

// Graceful error handlers
process.on('unhandledRejection', err => {
  console.error('Unhandled Promise Rejection:', err)
  process.exit(1)
})

process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err)
  process.exit(1)
})

start()
