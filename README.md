# KrushiSetu

MERN-based smart market linkage and price discovery platform for farmers.

## Features
- Farmer/Buyer registration and JWT login
- Crop listing
- Market price comparison
- Net-profit calculation using transportation cost
- Price history charts
- Smart selling recommendation
- Buyer marketplace and purchase requests
- Basic AI price prediction API using a Python model
- Marathi/Hindi/English-ready UI selector
- Demo seed data

## Requirements
- Node.js 18+
- MongoDB running locally or MongoDB Atlas
- Python 3.9+ (optional, only for ML service)

## 1. Server
```bash
cd server
npm install
copy .env.example .env
npm run seed
npm run dev
```

On macOS/Linux use:
```bash
cp .env.example .env
```

Server: http://localhost:5000

## 2. Client
```bash
cd client
npm install
npm run dev
```

Client: http://localhost:5173

## 3. ML service (optional)
```bash
cd ml
pip install -r requirements.txt
python app.py
```

ML service: http://localhost:8000

The Node API automatically falls back to a simple trend-based prediction if the Python service is unavailable.

## Demo
After seeding:
- Farmer: farmer@example.com / farmer123
- Buyer: buyer@example.com / buyer123

Never use these credentials in production.
