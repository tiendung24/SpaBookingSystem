const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

mongoose.connect('mongodb+srv://tdung:12345@cluster0.brzmupq.mongodb.net/SpaBooking?appName=Cluster0').then(async () => {
  try {
    const services = await mongoose.connection.db.collection('services').find({ price: { $lt: 50000 } }).toArray();
    console.log('Services < 50k:', services.length);
    for(const s of services) {
      console.log(' -', s.name, 'Price:', s.price);
    }

    const bookings = await mongoose.connection.db.collection('bookings').find({ totalAmount: { $lt: 50000 } }).toArray();
    console.log('\nBookings < 50k:', bookings.length);
    const statuses = {};
    for(const b of bookings) {
      statuses[b.status] = (statuses[b.status] || 0) + 1;
      console.log(' - Booking:', b._id, '| Total:', b.totalAmount, '| Deposit:', b.depositAmount, '| Status:', b.status);
    }
    console.log('\nBooking statuses:', statuses);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
});
