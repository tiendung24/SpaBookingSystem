import mongoose from 'mongoose'

let isConnected = false

export async function connectDb() {
  if (isConnected) return mongoose.connection

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/SpaBooking'
  const dbName = process.env.MONGODB_DB_NAME || 'SpaBooking'

  await mongoose.connect(uri, {
    dbName,
    serverSelectionTimeoutMS: 5000
  })

  isConnected = true
  // eslint-disable-next-line no-console
  console.log(`[db] connected: ${dbName}`)
  return mongoose.connection
}

export async function disconnectDb() {
  if (!isConnected) return
  await mongoose.disconnect()
  isConnected = false
}
