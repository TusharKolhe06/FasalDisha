# 🌾 FasalDisha

**AI-powered farmer marketplace for smart price discovery, direct buyer connections, profitable market recommendations, and offline access.**

FasalDisha is a **MERN-stack based digital platform** designed to strengthen market linkages for farmers by providing market price comparison, AI-based price prediction, smart selling recommendations, and direct farmer-to-buyer connections.

The platform also provides **offline support**, allowing users in areas with unstable internet connectivity to access previously saved marketplace data and save purchase requests locally. These requests are automatically synchronized when the internet connection is restored.

---

## 🚀 Key Features

### 👨‍🌾 Farmer & Buyer Platform

* Farmer and buyer registration
* JWT-based authentication
* Role-based access for farmers and buyers
* Farmer product listing
* Direct buyer-farmer marketplace

### 📊 Smart Price Discovery

* Market-wise crop price comparison
* Price history charts
* Crop-wise market information
* Multiple market comparison

### 🧠 AI-Powered Features

* AI-based crop price prediction
* 7-day price prediction
* Smart selling recommendation
* Market selection based on:

  * Market price
  * Distance
  * Transportation cost
  * Estimated net profit

### 🛒 Marketplace

* Farmers can list agricultural products
* Buyers can search available crops
* Buyers can send purchase requests
* Quantity availability checking
* Direct market linkage

### 📡 Offline Mode

* Detects internet connectivity automatically
* Displays offline status
* Stores previously loaded marketplace data
* Allows purchase requests while offline
* Stores offline requests locally
* Automatically synchronizes pending requests when internet returns
* Shows pending requests and synchronization status

### 🌐 Language Support

* English
* Marathi
* Internationalization using `react-i18next`

---

## 🛠️ Technology Stack

### Frontend

* React.js
* Vite
* React Router
* Axios
* React-i18next
* CSS

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication

### AI / ML

* Python
* Price prediction model
* Trend-based fallback prediction

### Offline Technology

* Browser LocalStorage
* Offline data caching
* Offline purchase-request queue
* Automatic synchronization

---

## 📁 Project Structure

```text
FasalDisha/
│
├── client/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── context/
│       └── App.jsx
│
├── server/
│   ├── models/
│   │   ├── User.js
│   │   ├── Crop.js
│   │   ├── MarketPrice.js
│   │   ├── Product.js
│   │   └── Order.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── cropRoutes.js
│   │   ├── marketRoutes.js
│   │   ├── buyerRoutes.js
│   │   └── priceRoutes.js
│   │
│   ├── controllers/
│   ├── middleware/
│   ├── config/
│   └── server.js
│
└── ml/
    └── price_prediction.py
```

---

## ⚙️ Requirements

* Node.js 18+
* MongoDB locally or MongoDB Atlas
* Python 3.9+ for the ML service

---

## ▶️ Run the Project

### 1. Backend

```bash
cd server
npm install
```

Create `.env` from `.env.example` and configure your MongoDB connection.

Then:

```bash
npm run seed
npm run dev
```

Backend:

```text
http://localhost:5000
```

---

### 2. Frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

### 3. ML Service

Optional:

```bash
cd ml
pip install -r requirements.txt
python app.py
```

ML service:

```text
http://localhost:8000
```

If the ML service is unavailable, the Node.js API uses a fallback prediction approach.

---

## 📡 Offline Mode Workflow

```text
Internet Available
       ↓
Load Marketplace Data
       ↓
Save Data Locally
       ↓
Internet Lost
       ↓
Access Cached Marketplace
       ↓
Create Purchase Request
       ↓
Save Request Locally
       ↓
Internet Restored
       ↓
Automatic Synchronization
       ↓
Request Sent to Server
```

---

## 🎯 SIH Problem Statement

**Problem Statement ID: SIH26132**

**Strengthening market linkages and price discovery for farmers**

### Our Solution

FasalDisha helps farmers make better selling decisions by combining:

**Market Prices + Distance + Transportation Cost + AI Prediction + Net Profit**

It also addresses rural connectivity challenges through its **offline-first functionality**.

---

## 💡 Core Value

> **Helping farmers discover better markets, make smarter selling decisions, and stay connected even with unstable internet.**

---

## ⚠️ Demo Credentials

For local/demo testing only:

```text
Farmer:
farmer@example.com
farmer123

Buyer:
buyer@example.com
buyer123
```

**Do not use these credentials in production.**

---

## 👥 Project

**FasalDisha — SIH26132 Prototype**

Built using **MERN Stack + AI/ML + Offline Technology**.

© 2026 FasalDisha
