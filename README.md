# Charlotte's Web - Multi-Platform Selling Solution

A comprehensive e-commerce platform for managing inventory and selling across multiple platforms (eBay, Facebook Marketplace, Depop, Craigslist) from a single dashboard.

## Features

### Core Features
- **Multi-Platform Integration**: List products on eBay, Facebook Marketplace, Depop, and Craigslist from one place
- **Automatic Synchronization**: Changes sync across all platforms automatically
- **Smart Delisting**: When an item sells on one platform, it's automatically removed from others
- **Notification System**: Get alerts for sales, price changes, and third-party actions
- **Inventory Management**: Comprehensive product management with images, descriptions, and pricing
- **Admin Dashboard**: Real-time analytics and platform status monitoring

### Platform Features
- **eBay Integration**: Full API integration for listing, updating, and managing eBay listings
- **Facebook Marketplace**: Post and manage Facebook Marketplace listings
- **Depop Integration**: Reach fashion-forward buyers on Depop
- **Craigslist Automation**: Automated posting to Craigslist classifieds

### Advanced Features
- **Cross-Platform Sync**: Automatic synchronization of price, quantity, and status
- **Third-Party Action Approval**: Review and approve changes made on external platforms
- **Sync Logs**: Complete audit trail of all synchronization activities
- **Platform Statistics**: Track performance across all platforms
- **Bulk Operations**: Create listings on multiple platforms simultaneously

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** authentication
- **Platform APIs**: eBay, Facebook Graph API, Depop API

### Frontend
- **React** with Vite
- **React Router** for navigation
- **TanStack Query** for data fetching
- **Tailwind CSS** for styling
- **Lucide React** for icons

## Project Structure

```
charlottes-web/
├── models/                    # MongoDB models
│   ├── Product.js            # Product schema
│   ├── PlatformListing.js    # Platform listing tracking
│   ├── PlatformConfig.js     # Platform configurations
│   ├── SyncLog.js            # Synchronization logs
│   ├── Notification.js       # Notification system
│   └── ...
├── routes/                    # API routes
│   ├── platforms.js          # Platform management routes
│   ├── products.js           # Product routes
│   └── ...
├── services/                  # Business logic
│   ├── platformService.js    # Multi-platform service
│   └── platforms/            # Platform adapters
│       ├── ebayAdapter.js
│       ├── facebookAdapter.js
│       ├── depopAdapter.js
│       └── craigslistAdapter.js
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/            # Page components
│   │   │   ├── admin/        # Admin dashboard pages
│   │   │   └── ...
│   │   └── utils/            # Utilities and API client
│   └── ...
└── server.js                  # Express server
```

## Installation

### Prerequisites
- Node.js 18+ and npm
- MongoDB 4.4+
- Git

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/njeff667/charlottes-web.git
   cd charlottes-web
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Server
   PORT=5000
   NODE_ENV=development
   
   # Database
   MONGODB_URI=mongodb://localhost:27017/charlottes-web
   
   # JWT
   JWT_SECRET=your-secret-key-here
   
   # Site
   SITE_URL=http://localhost:3000
   
   # Platform API Keys (add as you configure each platform)
   EBAY_API_KEY=
   EBAY_API_SECRET=
   FACEBOOK_APP_ID=
   FACEBOOK_APP_SECRET=
   DEPOP_API_KEY=
   ```

5. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   
   # Or use MongoDB Atlas connection string in .env
   ```

6. **Seed the database (optional)**
   ```bash
   npm run seed
   ```

7. **Start the development servers**
   
   In one terminal (backend):
   ```bash
   npm run server
   ```
   
   In another terminal (frontend):
   ```bash
   cd client
   npm run dev
   ```

8. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Admin Dashboard: http://localhost:3000/admin

## Platform Configuration

### eBay Setup
1. Create an eBay Developer account at https://developer.ebay.com
2. Register your application
3. Obtain API credentials (App ID, Cert ID)
4. Configure OAuth tokens
5. Add credentials to Platform Management in admin dashboard

### Facebook Marketplace Setup
1. Create a Facebook App at https://developers.facebook.com
2. Enable Marketplace API
3. Configure OAuth and permissions
4. Add credentials to Platform Management

### Depop Setup
1. Contact Depop for API access
2. Obtain API credentials
3. Configure in Platform Management

### Craigslist Setup
Note: Craigslist doesn't have an official API. The integration uses:
- Email-based posting
- Browser automation (optional)
- Manual verification

## Usage

### Adding Products
1. Navigate to Admin → Inventory
2. Click "Add Product"
3. Fill in product details, upload images
4. Save product

### Creating Multi-Platform Listings
1. Navigate to Admin → Listings
2. Click "Create Listing"
3. Select a product
4. Choose platforms (eBay, Facebook, Depop, Craigslist)
5. Click "Create Listing"

### Managing Listings
- View all active listings by platform
- Update prices and quantities
- Monitor views and engagement
- Handle sales and automatic delisting

### Handling Sales
When an item sells on any platform:
1. System automatically detects the sale
2. Marks listing as sold
3. Delists from all other platforms
4. Updates inventory quantity
5. Sends notification

### Notifications
- Sales notifications
- Sync errors
- Third-party actions requiring approval
- Low stock alerts

## API Endpoints

### Platform Management
- `GET /api/platforms/configs` - Get all platform configurations
- `GET /api/platforms/stats` - Get platform statistics
- `PUT /api/platforms/configs/:platform` - Update platform config
- `POST /api/platforms/configs/:platform/connect` - Connect platform
- `POST /api/platforms/configs/:platform/disconnect` - Disconnect platform

### Listings
- `POST /api/platforms/listings/create` - Create single platform listing
- `POST /api/platforms/listings/create-multi` - Create multi-platform listing
- `PUT /api/platforms/listings/:id` - Update listing
- `GET /api/platforms/listings/product/:productId` - Get product listings
- `GET /api/platforms/listings/active` - Get all active listings
- `POST /api/platforms/listings/:id/sold` - Mark listing as sold

### Synchronization
- `POST /api/platforms/sync/product/:productId` - Sync product across platforms
- `GET /api/platforms/sync/logs` - Get sync logs

### Notifications
- `GET /api/platforms/notifications` - Get notifications
- `PUT /api/platforms/notifications/:id/read` - Mark as read
- `POST /api/platforms/notifications/:id/approve` - Approve third-party action
- `GET /api/platforms/notifications/pending-approvals` - Get pending approvals

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
# Build frontend
cd client
npm run build

# Start production server
cd ..
npm start
```

### Code Structure
- Follow existing patterns for new features
- Use async/await for asynchronous operations
- Implement proper error handling
- Add JSDoc comments for functions
- Use meaningful variable and function names

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check connection string in .env
- Verify network connectivity

### Platform API Errors
- Verify API credentials are correct
- Check rate limits
- Review platform-specific documentation
- Check sync logs for detailed errors

### Frontend Build Issues
- Clear node_modules and reinstall
- Check for conflicting dependencies
- Verify Node.js version compatibility

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: https://github.com/njeff667/charlottes-web/issues
- Email: support@example.com

## Roadmap

### Upcoming Features
- [ ] Shopify integration
- [ ] Amazon Marketplace integration
- [ ] Automated pricing strategies
- [ ] Advanced analytics and reporting
- [ ] Mobile app
- [ ] Bulk import from CSV/Excel
- [ ] Image recognition for auto-categorization
- [ ] Multi-user support with roles
- [ ] Shipping label generation
- [ ] Inventory forecasting

## Acknowledgments

Built with ❤️ for Charlotte's Web - Re-homing quality items with care and purpose.