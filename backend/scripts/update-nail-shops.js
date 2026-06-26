import dotenv from 'dotenv'
import mongoose from 'mongoose'
import {
  Shop,
  ShopStaff,
  User,
  ServiceCategory,
  Service
} from '../src/models/index.js'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/SpaBooking'

function createSlug(text) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
}

const SHOP_NAMES = [
  'DiDan Nail Art',
  'Gasy Beauty Home',
  'Blue Academy',
  'Linh Hương - Mi Nails'
]

async function run() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('Connected.')

    // Get the template shop "Tiệm Nail Minh Huyền"
    const templateShop = await Shop.findOne({ name: 'Tiệm Nail Minh Huyền' })
    if (!templateShop) throw new Error('Could not find template shop')
    const templateServices = await Service.find({ shopId: templateShop._id, name: { $ne: 'Gội Đầu Thư Giãn' } }).lean()
    
    // Filter out 'Gội Đầu Massage Đầu' if any, we just want the Nail services
    const nailTemplateServices = templateServices.filter(s => 
      !s.name.toLowerCase().includes('gội đầu')
    )

    for (const shopName of SHOP_NAMES) {
      console.log(`Updating shop: ${shopName}`)
      const shop = await Shop.findOne({ name: shopName })
      if (!shop) {
        console.log(`  Shop not found!`)
        continue
      }

      // 1. Update tags
      shop.tags = ['nail', 'làm móng']
      await shop.save()
      console.log(`  Updated tags.`)

      // 2. Setup 2 staff: 1 thợ (existing) + 1 chủ (new)
      const ownerUser = await User.findById(shop.ownerId)
      let ownerStaff = await ShopStaff.findOne({ shopId: shop._id, fullName: ownerUser.fullName })
      if (!ownerStaff) {
        ownerStaff = await ShopStaff.create({
          shopId: shop._id,
          fullName: ownerUser.fullName,
          phone: ownerUser.phone,
          avatarUrl: 'https://cdn-icons-png.flaticon.com/512/4140/4140047.png',
          shortBio: 'Chủ tiệm kiêm thợ chính, nhiều năm kinh nghiệm.',
          status: 'active'
        })
        console.log(`  Created owner staff.`)
      }

      const allStaffs = await ShopStaff.find({ shopId: shop._id })
      const staffIds = allStaffs.map(s => String(s._id))

      // 3. Replace services with exact duplicates from template
      console.log(`  Deleting existing services...`)
      await Service.deleteMany({ shopId: shop._id })

      console.log(`  Duplicating ${nailTemplateServices.length} template services...`)
      
      // We need to find or create the 'Làm móng (Nail)' category for this shop
      let category = await ServiceCategory.findOne({ shopId: shop._id, name: 'Làm móng (Nail)' })
      if (!category) {
        category = await ServiceCategory.create({
          shopId: shop._id,
          name: 'Làm móng (Nail)',
          slug: 'lam-mong',
          sortOrder: 1,
          status: 'active'
        })
      }

      for (const tSvc of nailTemplateServices) {
        const baseSlug = createSlug(tSvc.name)
        let finalSlug = baseSlug
        let counter = 1
        while (await Service.exists({ shopId: shop._id, slug: finalSlug })) {
          finalSlug = `${baseSlug}-${counter++}`
        }

        await Service.create({
          shopId: shop._id,
          categoryId: category._id,
          name: tSvc.name,
          slug: finalSlug,
          description: tSvc.description,
          shortDescription: tSvc.shortDescription,
          detailedDescription: tSvc.detailedDescription,
          price: tSvc.price,
          durationMinutes: tSvc.durationMinutes,
          imageUrl: tSvc.imageUrl,
          status: 'active',
          availableStaffIds: staffIds,
          sortOrder: tSvc.sortOrder
        })
      }
      console.log(`  Done with shop.`)
    }

    console.log('Update finished successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

run()
