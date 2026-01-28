import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import SellerProfile from '../models/SellerProfile.js';
import Warehouse from '../models/Warehouse.js';
import Room from '../models/Room.js';
import Bin from '../models/Bin.js';
import Item from '../models/Item.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/charlottes-web');
    console.log('✅ Connected to MongoDB');

    // Clear existing data (be careful in production!)
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      SellerProfile.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Warehouse.deleteMany({}),
      Room.deleteMany({}),
      Bin.deleteMany({}),
      Item.deleteMany({})
    ]);

    // 1. Create users
    console.log('👥 Creating users...');
    const users = await createUsers();

    // 2. Create Mom's seller profile
    console.log('💖 Creating Mom\'s seller profile...');
    const momProfile = await createMomProfile(users.admin);

    // 3. Create categories (integrating warehouse data)
    console.log('📂 Creating categories...');
    const categories = await createCategories();

    // 4. Create sample products from warehouse data
    console.log('📦 Creating sample products...');
    await createSampleProducts(momProfile, categories);

    // 5. Create default storage location (Warehouse -> Room)
    console.log('🏬 Creating default warehouse/room (USA Storage Centers - Evans, unit 2170)...');
    await ensureDefaultStorage();

    console.log('✨ Database seeding completed successfully!');
    console.log('\n📋 Created:');
    console.log(`   - ${users.length} users`);
    console.log(`   - 1 seller profile for Mom`);
    console.log(`   - ${categories.length} categories`);
    console.log(`   - Sample products from warehouse data`);
    
    console.log('\n🔑 Login credentials:');
    console.log('   Admin: admin@charlottes-web.com / admin123');
    console.log('   Caregiver: caregiver@charlottes-web.com / caregiver123');
    console.log('   Helper: helper@charlottes-web.com / helper123');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

async function ensureDefaultStorage() {
  const buildingName = 'USA Storage Centers - Evans';
  const unit = '2170';

  let warehouse = await Warehouse.findOne({
    buildingName,
    'address.unit': unit,
    'address.city': 'Evans',
    'address.state': 'GA'
  });

  if (!warehouse) {
    warehouse = await Warehouse.create({
      buildingName,
      address: {
        address1: '5090 Washington Rd.',
        unit,
        city: 'Evans',
        state: 'GA'
      },
      mainPhone: '7069175001',
      gps: { lat: 33.569912858426754, lng: -82.1896866307515 },
      security: 'included'
    });
  }

  const roomName = 'main';
  let room = await Room.findOne({ warehouseId: warehouse._id, roomName });
  if (!room) {
    room = await Room.create({ warehouseId: warehouse._id, roomName, security: 'inherited' });
  }

  return { warehouse, room };
}

async function createUsers() {
  const salt = await bcrypt.genSalt(10);
  
  const userConfigs = [
    {
      email: 'admin@charlottes-web.com',
      name: 'Admin User',
      password: await bcrypt.hash('admin123', salt),
      role: 'admin'
    },
    {
      email: 'caregiver@charlottes-web.com',
      name: 'Primary Caregiver',
      password: await bcrypt.hash('caregiver123', salt),
      role: 'caregiver'
    },
    {
      email: 'helper@charlottes-web.com',
      name: 'Helper',
      password: await bcrypt.hash('helper123', salt),
      role: 'helper'
    },
    {
      email: 'customer@example.com',
      name: 'Sample Customer',
      role: 'customer' // No password for customer accounts
    }
  ];

  const users = await User.insertMany(userConfigs);
  return users;
}

async function createMomProfile() {
  const momProfile = new SellerProfile({
    displayName: 'Charlotte',
    storyShort: "Dedicated to Mom, whose creativity and care inspired this shop. A portion of proceeds helps declutter and re-home useful items with love.",
    storyLong: "This shop began as a way to help my mom, Charlotte, who is older and living with memory changes. Over the years she collected duplicate items—brand-new, still in the box—from storage solutions to household essentials. Rather than let these useful items go to waste, we're re-homing them to people who need them. Thank you for helping us turn extras into essentials for someone else, all while honoring Mom's legacy of thoughtful collecting and care.",
    consentToShare: true, // Set to false if you want to be more private
    location: {
      city: 'Charlotte',
      state: 'NC',
      region: 'Southeast'
    },
    donationSettings: {
      enabled: true,
      percentage: 10,
      charityName: 'Alzheimer\'s Association',
      charityUrl: 'https://www.alz.org/',
      charityEIN: '13-3038601'
    },
    shippingSettings: {
      freeShippingThreshold: 50,
      defaultShippingRate: 7.99,
      handlingTime: 2,
      internationalShipping: false
    },
    returnPolicy: {
      acceptReturns: true,
      returnWindow: 30,
      restockFee: 0,
      conditions: 'Items must be returned in original condition. New-in-box items must be unopened.'
    }
  });

  return await momProfile.save();
}

async function createCategories() {
  // Categories based on your existing warehouse data and typical household items
  const categoryData = [
    // Storage & Organization (from your warehouse data)
    {
      name: 'Storage Solutions',
      slug: 'storage-solutions',
      description: 'Storage containers, organization systems, and space-saving solutions',
      categoryType: 'storage',
      image: '/images/categories/storage.jpg'
    },
    {
      name: 'Climate-Controlled Storage',
      slug: 'climate-controlled-storage',
      description: 'Temperature and humidity controlled storage solutions',
      categoryType: 'storage',
      storageType: 'climate-controlled',
      parent: null
    },
    {
      name: 'Outdoor Storage',
      slug: 'outdoor-storage',
      description: 'Weather-resistant outdoor storage solutions',
      categoryType: 'storage',
      storageType: 'outdoor storage',
      parent: null
    },
    
    // Household Essentials
    {
      name: 'Household Essentials',
      slug: 'household-essentials',
      description: 'Everyday household items and necessities',
      categoryType: 'household'
    },
    {
      name: 'Kitchen & Dining',
      slug: 'kitchen-dining',
      description: 'Kitchen appliances, cookware, and dining items',
      categoryType: 'household',
      parent: null
    },
    {
      name: 'Bedding & Linens',
      slug: 'bedding-linens',
      description: 'Bed sheets, blankets, towels, and other linens',
      categoryType: 'household',
      parent: null
    },
    
    // Organization & Office
    {
      name: 'Office Supplies',
      slug: 'office-supplies',
      description: 'Office organization, supplies, and accessories',
      categoryType: 'organization'
    },
    {
      name: 'File Storage',
      slug: 'file-storage',
      description: 'File cabinets, document storage, and paper organization',
      categoryType: 'organization',
      parent: null
    },
    
    // Electronics
    {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and accessories',
      categoryType: 'electronics'
    },
    {
      name: 'Phone Accessories',
      slug: 'phone-accessories',
      description: 'Phone cases, chargers, and mobile accessories',
      categoryType: 'electronics',
      parent: null
    },
    
    // Other Categories
    {
      name: 'Seasonal Items',
      slug: 'seasonal-items',
      description: 'Holiday decorations and seasonal goods',
      categoryType: 'other'
    },
    {
      name: 'Books & Media',
      slug: 'books-media',
      description: 'Books, DVDs, and other media items',
      categoryType: 'other'
    },
    {
      name: 'Clothing & Accessories',
      slug: 'clothing-accessories',
      description: 'Clothing items and fashion accessories',
      categoryType: 'clothing'
    }
  ];

  const categories = await Category.insertMany(categoryData);
  return categories;
}

async function createSampleProducts(momProfile, categories) {
  // Sample products based on common items found in storage units
  const sampleProducts = [
    {
      title: 'Sterilite 64 Quart Clear Storage Box',
      brand: 'Sterilite',
      model: '17449004',
      upc: '078915049045',
      description: 'Clear plastic storage box with latching lid. Perfect for household storage, garage organization, or closet use. Brand new in box.',
      condition: 'new',
      price: 12.99,
      quantity: 3,
      category: categories.find(c => c.slug === 'storage-solutions')._id,
      collections: ['Re-Home the Duplicates', 'New-in-Box', 'Storage Solutions'],
      tags: ['plastic', 'storage', 'organizer', 'clear'],
      storageLocation: {
        unitId: 'A-101',
        facilityName: 'Public Storage Charlotte',
        facilityType: 'climate-controlled',
        section: 'Aisle 3',
        shelf: 'Top'
      },
      sellerProfile: momProfile._id,
      status: 'active',
      images: [
        {
          url: '/images/products/sterilite-box-1.jpg',
          alt: 'Sterilite storage box front view',
          isPrimary: true
        }
      ]
    },
    {
      title: 'Rubbermaid 3 Gallon Roughneck Tote',
      brand: 'Rubbermaid',
      model: '3G2R9',
      description: 'Durable plastic storage tote with secure lid. Ideal for storage, moving, or organizing various household items.',
      condition: 'new',
      price: 8.99,
      quantity: 5,
      category: categories.find(c => c.slug === 'storage-solutions')._id,
      collections: ['Re-Home the Duplicates', 'Household Essentials'],
      tags: ['tote', 'storage', 'moving', 'durable'],
      storageLocation: {
        unitId: 'A-101',
        facilityName: 'Public Storage Charlotte',
        facilityType: 'climate-controlled'
      },
      sellerProfile: momProfile._id,
      status: 'active'
    },
    {
      title: 'Bankers Box Stor/File Basic Strength Letter/Legal',
      brand: 'Bankers Box',
      model: '731010',
      description: 'Basic strength storage box for letter or legal size documents. Perfect for home office organization.',
      condition: 'like-new',
      price: 4.99,
      quantity: 2,
      category: categories.find(c => c.slug === 'file-storage')._id,
      collections: ['Re-Home the Duplicates', 'Office Supplies'],
      tags: ['file box', 'document storage', 'office'],
      storageLocation: {
        unitId: 'B-205',
        facilityName: 'U-Haul Storage',
        facilityType: 'outdoor storage'
      },
      sellerProfile: momProfile._id,
      status: 'active'
    },
    {
      title: 'Mainstays Microfiber Bed Sheet Set',
      brand: 'Mainstays',
      description: 'Soft microfiber bed sheet set includes flat sheet, fitted sheet, and two pillowcases. Twin size, light blue.',
      condition: 'new',
      price: 15.99,
      quantity: 1,
      category: categories.find(c => c.slug === 'bedding-linens')._id,
      collections: ['Re-Home the Duplicates', 'New-in-Box', 'Household Essentials'],
      tags: ['bedding', 'sheets', 'microfiber', 'twin'],
      sellerProfile: momProfile._id,
      status: 'active'
    },
    {
      title: 'iPhone 11 Case - Clear Protective Cover',
      brand: 'Spigen',
      model: 'Liquid Crystal',
      description: 'Clear protective case for iPhone 11. Slim design with military-grade protection. Brand new in package.',
      condition: 'new',
      price: 9.99,
      quantity: 2,
      category: categories.find(c => c.slug === 'phone-accessories')._id,
      collections: ['Re-Home the Duplicates', 'New-in-Box', 'Electronics'],
      tags: ['phone case', 'iphone', 'protection', 'clear'],
      sellerProfile: momProfile._id,
      status: 'active'
    }
  ];

  const products = await Product.insertMany(sampleProducts);
  
  // Create some duplicates to test the duplicate detection
  const duplicateProducts = [
    {
      title: 'Sterilite 64 Quart Storage Container',
      brand: 'Sterilite',
      model: '17449004',
      upc: '078915049045', // Same UPC as first product
      description: 'Clear storage box with secure latching lid',
      condition: 'new',
      price: 12.99,
      quantity: 2,
      category: categories.find(c => c.slug === 'storage-solutions')._id,
      collections: ['Re-Home the Duplicates'],
      sellerProfile: momProfile._id,
      status: 'active',
      duplicateScore: 0.95
    }
  ];

  await Product.insertMany(duplicateProducts);
  return products;
}

// Run the seeding
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export default seedDatabase;