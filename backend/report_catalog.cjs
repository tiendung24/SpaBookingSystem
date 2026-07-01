const fs = require('fs');
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://tdung:12345@ac-aewycvu-shard-00-00.brzmupq.mongodb.net:27017,ac-aewycvu-shard-00-01.brzmupq.mongodb.net:27017,ac-aewycvu-shard-00-02.brzmupq.mongodb.net:27017/SpaBooking?ssl=true&replicaSet=atlas-130vne-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI).then(async () => {
  try {
    const categories = await mongoose.connection.collection('service_categories').find({}).toArray();
    const services = await mongoose.connection.collection('services').find({}).toArray();
    
    // Map catId -> catName
    const catIdToName = {};
    categories.forEach(c => {
      catIdToName[c._id.toString()] = c.name;
    });

    // Group services by catName
    const mergedCats = {
      'Chưa phân loại (Không có danh mục)': []
    };

    services.forEach(s => {
      const catId = s.categoryId ? s.categoryId.toString() : null;
      const catName = catId && catIdToName[catId] ? catIdToName[catId] : 'Chưa phân loại (Không có danh mục)';
      
      if (!mergedCats[catName]) {
        mergedCats[catName] = [];
      }
      mergedCats[catName].push(s.name);
    });

    let md = '# Danh mục các Dịch vụ theo Loại Dịch Vụ\n\n';
    
    Object.keys(mergedCats).sort().forEach(catName => {
      const srvs = mergedCats[catName];
      if (srvs.length > 0) {
        md += `## 💅 ${catName}\n`;
        const uniqueServices = [...new Set(srvs)].sort();
        uniqueServices.forEach(srv => {
          md += `- ${srv}\n`;
        });
        md += '\n';
      }
    });

    fs.writeFileSync('c:/Users/pc/.gemini/antigravity-ide/brain/d3f221d1-cb2b-4f93-9e84-a121ce35e7fc/service_catalog.md', md, 'utf8');
    console.log('✅ Generated merged service catalog!');
  } catch(e) {
    console.error('Lỗi:', e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}).catch(err => {
  console.error('Lỗi kết nối:', err);
  process.exit(1);
});
