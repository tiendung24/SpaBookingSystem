import 'dotenv/config'
import mongoose from 'mongoose'
import { Shop, Service, ServiceCategory } from '../src/models/index.js'

async function migrate() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected.')

    const shops = await Shop.find().lean()
    console.log(`Found ${shops.length} shops.`)

    for (const shop of shops) {
      console.log(`Processing shop: ${shop.name} (${shop._id})`)

      const services = await Service.find({ shopId: shop._id }).lean()
      if (!services.length) {
        console.log('No services found. Skipping.')
        continue
      }

      // Prepare categories map
      const categoryMap = new Map()

      // Ensure some base categories for the shop just in case
      const baseCategories = [
        { name: 'Gội đầu', slug: 'goi-dau', keywords: ['gội', 'đầu', 'dưỡng sinh', 'tóc', 'head'] },
        { name: 'Phun xăm', slug: 'phun-xam', keywords: ['phun', 'xăm', 'điêu khắc', 'môi', 'mày'] },
        { name: 'Triệt lông', slug: 'triet-long', keywords: ['triệt', 'waxing'] },
        { name: 'Làm móng (Nail)', slug: 'lam-mong', keywords: ['nail', 'móng', 'sơn', 'gel', 'cắt da', 'nhật da', 'charm', 'base', 'french'] },
        { name: 'Massage', slug: 'massage', keywords: ['massage', 'xoa bóp', 'body', 'toàn thân', 'cổ', 'vai', 'gáy', 'spa'] },
        { name: 'Chăm sóc da', slug: 'cham-soc-da', keywords: ['da', 'mặt', 'facial', 'skin', 'skincare', 'nám', 'mụn', 'ẩm', 'lão hóa'] },
        { name: 'Dịch vụ khác', slug: 'khac', keywords: [] }
      ]

      // Determine category for each service
      for (const service of services) {
        const rawText = `${service.name} ${service.shortDescription} ${service.detailedDescription}`.toLowerCase()
        const paddedText = ' ' + rawText.replace(/[^\p{L}\p{N}]/gu, ' ').replace(/\s+/g, ' ') + ' '

        let matchedCategory = baseCategories.find(c => c.keywords.some(k => paddedText.includes(' ' + k + ' ')))
        if (!matchedCategory) matchedCategory = baseCategories.find(c => c.slug === 'khac')

        if (!categoryMap.has(matchedCategory.slug)) {
          // Check if category exists
          let cat = await ServiceCategory.findOne({ shopId: shop._id, name: matchedCategory.name }).lean()
          if (!cat) {
            cat = await ServiceCategory.create({
              shopId: shop._id,
              name: matchedCategory.name,
              slug: matchedCategory.slug,
              status: 'active',
              sortOrder: 0,
              createdAt: new Date(),
              updatedAt: new Date()
            })
            console.log(`  Created category: ${matchedCategory.name}`)
          }
          categoryMap.set(matchedCategory.slug, cat._id)
        }

        // Assign categoryId
        const newCategoryId = categoryMap.get(matchedCategory.slug)
        if (String(service.categoryId) !== String(newCategoryId)) {
          await Service.updateOne({ _id: service._id }, { $set: { categoryId: newCategoryId } })
          console.log(`  Mapped "${service.name}" -> ${matchedCategory.name}`)
        }
      }
    }

    console.log('Migration completed successfully.')
    process.exit(0)
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

migrate()
