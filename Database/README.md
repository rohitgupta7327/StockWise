# StockWise Database Layer

This directory contains the database layer for the StockWise Retail Inventory & Sales Management System.

---

## 📁 Directory Structure

```text
Database/
├── config/
│   └── db.js                  # Resilient Mongoose connection configuration
├── models/
│   ├── Counter.js             # Atomic auto-increment sequence model for invoices
│   ├── InventoryMovement.js   # Audit ledger tracking stock in/out movements
│   ├── Product.js             # Product catalog, pricing, and stock levels
│   ├── Sale.js                # Sales orders, invoice line items, and totals
│   └── User.js                # User accounts with bcrypt hashing & JWT methods
├── schema-docs/
│   └── ERD.md                 # Complete Entity-Relationship Diagram & Data Dictionary
└── seeds/
    ├── sampleData.json        # Exported JSON fixture of products, categories & users
    └── seed.js                # Database seeder script
```

---

## 🚀 How to Seed the Database

To seed initial categories, products, inventory thresholds, and demo accounts:

```bash
# From project root
npm run seed

# OR directly from the Backend directory
cd Backend
node seed.js
```

### Seed Accounts Created:
- **Admin**: `admin@stockwise.com` (Password: `admin123`)
- **Staff**: `staff@stockwise.com` (Password: `staff123`)

---

## ⚙️ Connection Configuration

The database connection is managed in [`config/db.js`](file:///d:/StockWise/Database/config/db.js).
It reads `MONGODB_URI` from the environment:
- **Local MongoDB**: `mongodb://localhost:27017/stockwise`
- **MongoDB Atlas**: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/stockwise?retryWrites=true&w=majority`
