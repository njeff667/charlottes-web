import Product from '../models/Product.js';

/**
 * Advanced duplicate detection system for Charlotte's Web
 * Helps identify and merge duplicate items from Mom's collection
 */

class DuplicateDetector {
  constructor() {
    this.similarityThreshold = 0.6; // 60% similarity threshold
    this.weights = {
      upc: 1.0,        // Exact UPC match = 100% duplicate
      title: 0.4,      // Title similarity weight
      brand: 0.3,      // Brand match weight
      model: 0.3,      // Model match weight
      price: 0.1,      // Price proximity weight
      category: 0.2    // Category match weight
    };
  }

  /**
   * Normalize string for comparison
   */
  normalizeString(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  /**
   * Calculate string similarity using Jaccard similarity
   */
  calculateStringSimilarity(str1, str2) {
    const s1 = this.normalizeString(str1);
    const s2 = this.normalizeString(str2);
    
    if (!s1 || !s2) return 0;
    
    const words1 = new Set(s1.split(' '));
    const words2 = new Set(s2.split(' '));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Calculate price similarity (closer prices = higher similarity)
   */
  calculatePriceSimilarity(price1, price2) {
    if (!price1 || !price2) return 0;
    
    const avgPrice = (price1 + price2) / 2;
    const difference = Math.abs(price1 - price2);
    const similarity = Math.max(0, 1 - (difference / avgPrice));
    
    return similarity;
  }

  /**
   * Find potential duplicate candidates
   */
  async findDuplicateCandidates({ title, brand, model, upc, price, category, sellerProfile }) {
    const candidates = [];
    
    // Strategy 1: Exact UPC match (highest priority)
    if (upc) {
      const upcMatch = await Product.findOne({ 
        upc, 
        sellerProfile,
        status: { $in: ['active', 'draft'] }
      }).populate('category');
      
      if (upcMatch) {
        return [{
          product: upcMatch,
          score: 1.0,
          reason: 'Exact UPC match',
          confidence: 'high'
        }];
      }
    }
    
    // Strategy 2: Brand + Model combination
    if (brand && model) {
      const brandModelMatches = await Product.find({
        brand: new RegExp(brand, 'i'),
        model: new RegExp(model, 'i'),
        sellerProfile,
        status: { $in: ['active', 'draft'] }
      }).populate('category');
      
      brandModelMatches.forEach(product => {
        const score = this.calculateSimilarityScore({
          title, brand, model, price, category
        }, {
          title: product.title,
          brand: product.brand,
          model: product.model,
          price: product.price,
          category: product.category
        });
        
        if (score >= this.similarityThreshold) {
          candidates.push({
            product,
            score,
            reason: 'Brand + Model match',
            confidence: score >= 0.8 ? 'high' : 'medium'
          });
        }
      });
    }
    
    // Strategy 3: Text-based search with similarity
    if (title) {
      const searchQuery = {
        $text: { $search: title },
        sellerProfile,
        status: { $in: ['active', 'draft'] }
      };
      
      // Add brand filter if available
      if (brand) {
        searchQuery.brand = new RegExp(brand, 'i');
      }
      
      const textMatches = await Product.find(searchQuery)
        .populate('category')
        .limit(20);
      
      textMatches.forEach(product => {
        // Skip if already found
        if (candidates.some(c => c.product._id.equals(product._id))) return;
        
        const score = this.calculateSimilarityScore({
          title, brand, model, price, category
        }, {
          title: product.title,
          brand: product.brand,
          model: product.model,
          price: product.price,
          category: product.category
        });
        
        if (score >= this.similarityThreshold) {
          candidates.push({
            product,
            score,
            reason: 'Text similarity',
            confidence: score >= 0.8 ? 'high' : 'medium'
          });
        }
      });
    }
    
    // Sort by score (highest first) and return
    return candidates.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate overall similarity score
   */
  calculateSimilarityScore(item1, item2) {
    let totalScore = 0;
    let totalWeight = 0;
    
    // Title similarity
    if (item1.title && item2.title) {
      const titleSimilarity = this.calculateStringSimilarity(item1.title, item2.title);
      totalScore += titleSimilarity * this.weights.title;
      totalWeight += this.weights.title;
    }
    
    // Brand match
    if (item1.brand && item2.brand) {
      const brandSimilarity = this.normalizeString(item1.brand) === this.normalizeString(item2.brand) ? 1 : 0;
      totalScore += brandSimilarity * this.weights.brand;
      totalWeight += this.weights.brand;
    }
    
    // Model match
    if (item1.model && item2.model) {
      const modelSimilarity = this.calculateStringSimilarity(item1.model, item2.model);
      totalScore += modelSimilarity * this.weights.model;
      totalWeight += this.weights.model;
    }
    
    // Price similarity
    if (item1.price && item2.price) {
      const priceSimilarity = this.calculatePriceSimilarity(item1.price, item2.price);
      totalScore += priceSimilarity * this.weights.price;
      totalWeight += this.weights.price;
    }
    
    // Category match
    if (item1.category && item2.category) {
      const categoryMatch = item1.category.toString() === item2.category.toString() ? 1 : 0;
      totalScore += categoryMatch * this.weights.category;
      totalWeight += this.weights.category;
    }
    
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Merge duplicate products
   */
  async mergeDuplicates(primaryProductId, duplicateProductIds) {
    try {
      const primaryProduct = await Product.findById(primaryProductId);
      if (!primaryProduct) {
        throw new Error('Primary product not found');
      }
      
      let mergedCount = 0;
      
      for (const duplicateId of duplicateProductIds) {
        const duplicateProduct = await Product.findById(duplicateId);
        if (!duplicateProduct) continue;
        
        // Add quantity to primary product
        primaryProduct.quantity += duplicateProduct.quantity;
        
        // Merge images (avoid duplicates)
        const existingImageUrls = primaryProduct.images.map(img => img.url);
        duplicateProduct.images.forEach(img => {
          if (!existingImageUrls.includes(img.url)) {
            primaryProduct.images.push(img);
          }
        });
        
        // Merge descriptions if primary is empty
        if (!primaryProduct.description && duplicateProduct.description) {
          primaryProduct.description = duplicateProduct.description;
        }
        
        // Archive duplicate
        duplicateProduct.status = 'archived';
        duplicateProduct.duplicateOf = primaryProduct._id;
        await duplicateProduct.save();
        
        mergedCount++;
      }
      
      // Update primary product
      primaryProduct.duplicateScore = Math.max(primaryProduct.duplicateScore, 0.8);
      await primaryProduct.save();
      
      return {
        success: true,
        mergedCount,
        totalQuantity: primaryProduct.quantity
      };
      
    } catch (error) {
      throw new Error(`Merge failed: ${error.message}`);
    }
  }

  /**
   * Find all duplicates in the system (for cleanup)
   */
  async findAllDuplicates(sellerProfile) {
    const products = await Product.find({
      sellerProfile,
      status: { $in: ['active', 'draft'] }
    }).populate('category');
    
    const duplicates = [];
    const processed = new Set();
    
    for (const product of products) {
      if (processed.has(product._id.toString())) continue;
      
      const candidates = await this.findDuplicateCandidates({
        title: product.title,
        brand: product.brand,
        model: product.model,
        upc: product.upc,
        price: product.price,
        category: product.category,
        sellerProfile: product.sellerProfile
      });
      
      if (candidates.length > 1) {
        const duplicateGroup = [product, ...candidates.map(c => c.product)];
        duplicateGroup.forEach(p => processed.add(p._id.toString()));
        
        duplicates.push({
          products: duplicateGroup,
          reason: 'Potential duplicates found',
          confidence: candidates[0]?.confidence || 'medium'
        });
      }
    }
    
    return duplicates;
  }
}

// Export singleton instance
export default new DuplicateDetector();