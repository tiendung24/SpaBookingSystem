import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { Service } from '../src/models/index.js'

dotenv.config()
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/SpaBooking'

const NEW_IMAGES = [
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcROoA6nfkUuYDukJtrmTT6VcrqLoMMmREB4rw&s',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTUhR0cgqg3NTl6uDGQngEmqTvj6FYHjK5MKQ&s',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTdV5TcRrXj6e9xUloe65znpeIsQBq4_nASLQ&s',
  'https://img.tripi.vn/cdn-cgi/image/width=700,height=700/https://gcs.tripi.vn/public-tripi/tripi-feed/img/486498VwQ/anh-mo-ta.png',
  'https://file.hstatic.net/200000584469/article/uon_mi_bao_nhieu_tien_92e3fc16f6a04e4eb68e88299440e059.jpg',
  'https://bizweb.dktcdn.net/100/509/372/articles/noi-mi-co-boi-duoc-khong.jpg?v=1747245314583',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTmtaBWlFvnJJ3MZN6i_XFTHEkTVwESsaDNBw&s',
  'https://inhat.vn/wp-content/uploads/2025/05/noi-mi-tay-ninh-1.jpg',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFY-cAN2cVLmjNVDnbOpfpn-pK3z4KxguPtQ&s'
]

const SERVICES = [
  'Mi Classic',
  'Mi Em Bé',
  'Mi Classic Mix Size',
  'Mi Lông Thỏ Mix Size',
  'Mi Lông Chồn Natural',
  'Mi Lông Chồn Thiết Kế',
  'Mi Volume 3D',
  'Mi Volume 5D',
  'Mi 3D Thiết Kế'
]

async function run() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('Connected.')

    for (let i = 0; i < SERVICES.length; i++) {
      const serviceName = SERVICES[i]
      const imageUrl = NEW_IMAGES[i]
      
      const result = await Service.updateMany(
        { name: serviceName },
        { $set: { imageUrl: imageUrl } }
      )
      console.log(`Updated "${serviceName}". Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`)
    }

    console.log('Done successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

run()
