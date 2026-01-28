import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PlatformConfig from '../models/PlatformConfig.js';

dotenv.config();

const platforms = [
  {
    platform: 'ebay',
    isActive: true,
    isConnected: false,
    settings: {
      ebay: {
        siteId: 0,
        listingDuration: 'GTC',
        paymentMethods: ['PayPal'],
        shippingServices: [{
          ShippingService: 'USPSPriority',
          ShippingServiceCost: 0
        }],
        returnPolicy: {
          ReturnsAcceptedOption: 'ReturnsAccepted',
          RefundOption: 'MoneyBack',
          ReturnsWithinOption: 'Days_30'
        }
      }
    },
    defaultSettings: {
      autoRelist: false,
      autoSync: true,
      priceMarkup: 0,
      minPrice: 0,
      maxPrice: 10000,
      defaultShippingCost: 7.99,
      defaultHandlingTime: 2
    },
    fees: {
      listingFee: 0.35,
      finalValueFeePercentage: 12.9,
      paymentProcessingFeePercentage: 2.9,
      fixedFee: 0.30
    },
    rateLimits: {
      listingsPerDay: 100,
      listingsPerHour: 20,
      apiCallsPerMinute: 60
    }
  },
  {
    platform: 'facebook',
    isActive: true,
    isConnected: false,
    settings: {
      facebook: {
        deliveryOptions: ['shipping', 'local_pickup']
      }
    },
    defaultSettings: {
      autoRelist: false,
      autoSync: true,
      priceMarkup: 0,
      minPrice: 0,
      maxPrice: 10000,
      defaultShippingCost: 0,
      defaultHandlingTime: 2
    },
    fees: {
      listingFee: 0,
      finalValueFeePercentage: 5,
      paymentProcessingFeePercentage: 0,
      fixedFee: 0
    },
    rateLimits: {
      listingsPerDay: 50,
      listingsPerHour: 10,
      apiCallsPerMinute: 30
    }
  },
  {
    platform: 'depop',
    isActive: true,
    isConnected: false,
    settings: {
      depop: {
        shopName: '',
        shippingProfiles: []
      }
    },
    defaultSettings: {
      autoRelist: false,
      autoSync: true,
      priceMarkup: 0,
      minPrice: 0,
      maxPrice: 10000,
      defaultShippingCost: 5.99,
      defaultHandlingTime: 2
    },
    fees: {
      listingFee: 0,
      finalValueFeePercentage: 10,
      paymentProcessingFeePercentage: 2.9,
      fixedFee: 0.30
    },
    rateLimits: {
      listingsPerDay: 100,
      listingsPerHour: 20,
      apiCallsPerMinute: 60
    }
  },
  {
    platform: 'craigslist',
    isActive: true,
    isConnected: false,
    settings: {
      craigslist: {
        city: '',
        area: '',
        email: '',
        phoneNumber: ''
      }
    },
    defaultSettings: {
      autoRelist: false,
      autoSync: false,
      priceMarkup: 0,
      minPrice: 0,
      maxPrice: 10000,
      defaultShippingCost: 0,
      defaultHandlingTime: 0
    },
    fees: {
      listingFee: 0,
      finalValueFeePercentage: 0,
      paymentProcessingFeePercentage: 0,
      fixedFee: 0
    },
    rateLimits: {
      listingsPerDay: 10,
      listingsPerHour: 2,
      apiCallsPerMinute: 1
    }
  }
];

async function initializePlatforms() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/charlottes-web');
    console.log('✅ Connected to MongoDB');

    for (const platformData of platforms) {
      const existing = await PlatformConfig.findOne({ platform: platformData.platform });
      
      if (existing) {
        console.log(`⚠️  Platform ${platformData.platform} already exists, skipping...`);
        continue;
      }

      const platform = new PlatformConfig(platformData);
      await platform.save();
      console.log(`✅ Initialized ${platformData.platform} platform configuration`);
    }

    console.log('\n✅ All platforms initialized successfully!');
    console.log('\nNext steps:');
    console.log('1. Start the application: npm run dev');
    console.log('2. Navigate to Admin → Platforms');
    console.log('3. Configure each platform with your API credentials');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing platforms:', error);
    process.exit(1);
  }
}

initializePlatforms();