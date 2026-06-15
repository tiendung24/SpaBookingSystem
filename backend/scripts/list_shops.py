import pymongo

try:
    client = pymongo.MongoClient("mongodb+srv://tdung:12345@cluster0.brzmupq.mongodb.net/SpaBooking")
    db = client.SpaBooking
    shops = db.shops.find()
    print("Found shops:")
    for s in shops:
        print("-", s.get("shopName", "No name"))
except Exception as e:
    print("Error:", e)
