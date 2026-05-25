/**
 * Restore data from JSON backup to MongoDB Atlas
 * Run: MONGODB_URI="mongodb+srv://..." node scripts/restore-to-atlas.js
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not set')
    console.error('   Run: $env:MONGODB_URI="mongodb+srv://..."; node restore-to-atlas.js')
    process.exit(1)
  }

  // Find latest backup
  const backupsDir = path.join(__dirname, '..', 'backups')
  if (!fs.existsSync(backupsDir)) {
    console.error('❌ No backups found in', backupsDir)
    process.exit(1)
  }

  const backupDirs = fs.readdirSync(backupsDir)
  if (backupDirs.length === 0) {
    console.error('❌ No backup folders found')
    process.exit(1)
  }

  const latestBackup = backupDirs.sort().pop()
  const backupPath = path.join(backupsDir, latestBackup)

  console.log('🔗 Connecting to MongoDB Atlas...')
  await mongoose.connect(MONGODB_URI)
  console.log('✅ Connected to Atlas')

  const db = mongoose.connection.db

  console.log(`\n📂 Restoring from: ${backupPath}`)
  console.log('---')

  const files = fs.readdirSync(backupPath).filter(f => f.endsWith('.json'))

  for (const file of files) {
    const collName = file.replace('.json', '')
    try {
      const filePath = path.join(backupPath, file)
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))

      if (data.length === 0) {
        console.log(`⏭️  ${collName}: Empty collection (skipped)`)
        continue
      }

      // Clear existing data
      await db.collection(collName).deleteMany({})

      // Insert new data
      const result = await db.collection(collName).insertMany(data)
      console.log(`✅ ${collName}: Restored ${result.insertedIds.length} documents`)
    } catch (err) {
      console.log(`❌ ${collName}: ${err.message}`)
    }
  }

  await mongoose.disconnect()
  console.log('\n✅ Restore completed!')
  process.exit(0)
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
