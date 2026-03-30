"""Script to load recall data from JSON into MongoDB"""
import json
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME', 'medalert_db')

async def load_data():
    print("Connecting to MongoDB...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    recalls_collection = db.recalls
    
    # Clear existing data
    print("Clearing existing data...")
    await recalls_collection.delete_many({})
    
    # Load data from JSON file
    json_path = '/app/frontend/public/data/recalls.json'
    print(f"Loading data from {json_path}...")
    
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    print(f"Found {len(data)} records")
    
    # Insert data
    if data:
        print("Inserting data into MongoDB...")
        result = await recalls_collection.insert_many(data)
        print(f"✓ Inserted {len(result.inserted_ids)} records")
    
    # Create indexes for better performance
    print("Creating indexes...")
    await recalls_collection.create_index("product_name")
    await recalls_collection.create_index("risk_class")
    await recalls_collection.create_index("country")
    await recalls_collection.create_index("brand")
    print("✓ Indexes created")
    
    # Verify data
    count = await recalls_collection.count_documents({})
    print(f"\n✓ Data loaded successfully!")
    print(f"Total documents in database: {count}")
    
    # Show statistics
    class_i = await recalls_collection.count_documents({"risk_class": "Class I"})
    class_ii = await recalls_collection.count_documents({"risk_class": "Class II"})
    class_iii = await recalls_collection.count_documents({"risk_class": "Class III"})
    
    print(f"\nStatistics:")
    print(f"  Class I (High Risk): {class_i}")
    print(f"  Class II (Medium Risk): {class_ii}")
    print(f"  Class III (Low Risk): {class_iii}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(load_data())


