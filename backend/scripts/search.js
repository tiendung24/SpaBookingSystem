import mongoose from 'mongoose';
import { Service } from '../src/models/schemas/service.model.js';

mongoose.connect(process.env.MONGODB_URI || 'mongodb://tdung:12345@ac-aewycvu-shard-00-00.brzmupq.mongodb.net:27017,ac-aewycvu-shard-00-01.brzmupq.mongodb.net:27017,ac-aewycvu-shard-00-02.brzmupq.mongodb.net:27017/SpaBooking?ssl=true&authSource=admin&replicaSet=atlas-130vne-shard-0&retryWrites=true&w=majority&appName=Cluster0').then(async () => {
  const services = await Service.find({ name: { $regex: 'Spa Foot', $options: 'i' } });
  console.log(JSON.stringify(services, null, 2));
  process.exit(0);
})
