/**
 * Dump MongoDB local data to JSON files
 * Run: node scripts/backup-local-db.js
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BACKUP_DIR = path.join(__dirname, '..', 'backups', new Date().toISOString().slice(0, 10))

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/SpaBooking'

  console.log('🔗 Connecting to local MongoDB...')
  console.log(`   URI: ${MONGODB_URI}`)
  
  await mongoose.connect(MONGODB_URI)
  console.log('✅ Connected')

  const db = mongoose.connection.db

  // Create backup directory
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true })
  }

  // Collections to backup
  const collections = [
    'users',
    'shops',
    'bookings',
    'bookingslotlocks',
    'deposits',
    'payospayments',
    'customers',
    'services',
    'shopstaffs'
  ]

  console.log(`\n📦 Backing up to: ${BACKUP_DIR}`)
  console.log('---')

  for (const collName of collections) {
    try {
      const docs = await db.collection(collName).find({}).toArray()
      const filePath = path.join(BACKUP_DIR, `${collName}.json`)
      fs.writeFileSync(filePath, JSON.stringify(docs, null, 2))
      console.log(`✅ ${collName}: ${docs.length} documents → ${collName}.json`)
    } catch (err) {
      console.log(`⚠️  ${collName}: ${err.message}`)
    }
  }

  await mongoose.disconnect()
  console.log('\n✅ Backup completed!')
  console.log(`📂 Files saved to: ${BACKUP_DIR}`)
  process.exit(0)
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
