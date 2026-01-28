# Charlotte's Web - Quick Setup Guide

This guide will help you get Charlotte's Web up and running quickly.

## Prerequisites Checklist

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] MongoDB installed and running (`mongod --version`)
- [ ] Git installed (`git --version`)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```env
# Copy this template and fill in your values

# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/charlottes-web

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this

# Site URL
SITE_URL=http://localhost:3000

# Platform API Keys (configure these later in the admin dashboard)
EBAY_API_KEY=
EBAY_API_SECRET=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
DEPOP_API_KEY=
```

### 3. Start MongoDB

**Option A: Local MongoDB**
```bash
mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Update MONGODB_URI in .env

### 4. Import Your Inventory (Optional)

If you have the CSV file with your inventory:

```bash
# The system will automatically detect and import Charlotte_Inventory.csv
# Or use the import API endpoint from the admin dashboard
```

### 5. Start the Application

**Terminal 1 - Backend:**
```bash
npm run server
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin
- **API**: http://localhost:5000/api

## Initial Configuration

### 1. Create Admin User

Currently, the system doesn't have authentication fully implemented. You can:
- Access the admin dashboard directly at http://localhost:3000/admin
- Or implement user registration through the API

### 2. Configure Platforms

Navigate to **Admin → Platforms** and configure each platform:

#### eBay Configuration
1. Go to https://developer.ebay.com
2. Create a developer account
3. Register your application
4. Get your API credentials:
   - App ID (Client ID)
   - Cert ID (Client Secret)
5. Generate OAuth tokens
6. Enter credentials in Platform Management

#### Facebook Marketplace Configuration
1. Go to https://developers.facebook.com
2. Create a new app
3. Add "Marketplace" product
4. Configure OAuth settings
5. Get App ID and App Secret
6. Enter credentials in Platform Management

#### Depop Configuration
1. Contact Depop for API access
2. Obtain API credentials
3. Enter in Platform Management

#### Craigslist Configuration
1. Set up email for posting
2. Configure city and area
3. Note: Craigslist requires manual verification

### 3. Add Your First Product

1. Go to **Admin → Inventory**
2. Click **"Add Product"**
3. Fill in product details:
   - Title
   - Description
   - Price
   - Condition
   - Images
   - Category
4. Save product

### 4. Create Multi-Platform Listing

1. Go to **Admin → Listings**
2. Click **"Create Listing"**
3. Select your product
4. Choose platforms (eBay, Facebook, Depop, Craigslist)
5. Click **"Create Listing"**
6. System will create listings on all selected platforms

## Testing the System

### Test Synchronization

1. Create a listing on multiple platforms
2. Update the price in one place
3. Watch it sync across all platforms
4. Check **Admin → Notifications** for sync status

### Test Sale Handling

1. Mark a listing as sold on one platform
2. System should automatically:
   - Delist from other platforms
   - Update inventory
   - Send notification

### Monitor Activity

- **Dashboard**: View real-time statistics
- **Sync Logs**: Track all synchronization activities
- **Notifications**: Review alerts and approvals

## Common Issues

### MongoDB Connection Failed
```bash
# Check if MongoDB is running
mongod

# Or check your connection string in .env
```

### Port Already in Use
```bash
# Change PORT in .env file
PORT=5001
```

### Frontend Can't Connect to Backend
```bash
# Check that both servers are running
# Backend: http://localhost:5000
# Frontend: http://localhost:3000
```

### Platform API Errors
- Verify credentials are correct
- Check API rate limits
- Review platform-specific documentation
- Check sync logs for detailed errors

## Next Steps

1. **Import Your Inventory**: Use the CSV import feature
2. **Configure All Platforms**: Set up eBay, Facebook, Depop, Craigslist
3. **Create Listings**: Start listing your products
4. **Monitor Performance**: Use the dashboard to track sales
5. **Handle Notifications**: Review and approve third-party actions

## Getting Help

- Check the main README.md for detailed documentation
- Review API documentation for integration details
- Check GitHub issues for known problems
- Contact support for assistance

## Production Deployment

When ready to deploy to production:

1. Set `NODE_ENV=production` in .env
2. Build the frontend: `cd client && npm run build`
3. Use a process manager like PM2
4. Set up SSL certificates
5. Configure production MongoDB
6. Update SITE_URL to your domain
7. Secure your API keys

## Security Checklist

- [ ] Change JWT_SECRET to a strong random value
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS in production
- [ ] Set up proper CORS configuration
- [ ] Implement rate limiting
- [ ] Regular security updates
- [ ] Backup your database regularly

---

**You're all set!** Start managing your multi-platform inventory with Charlotte's Web.