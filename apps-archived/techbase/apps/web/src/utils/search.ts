// Search utility functions

/**
 * Filters software based on category, platform, pricing, and rating filters
 * @param softwareList The list of software to filter
 * @param filters The filters to apply
 * @returns Filtered software list
 */
export function filterSoftware(softwareList, filters) {
  return softwareList.filter(software => {
    // Filter by categories
    if (filters.categories.length > 0) {
      if (!software.categories?.some(category => filters.categories.includes(category))) {
        return false;
      }
    }
    
    // Filter by platforms
    if (filters.platforms.length > 0) {
      if (!software.platforms?.some(platform => filters.platforms.includes(platform))) {
        return false;
      }
    }
    
    // Filter by price range
    if (filters.priceRanges.length > 0) {
      const hasFree = filters.priceRanges.includes('free') && 
        software.pricing?.some(p => p.model.toLowerCase().includes('free') || p.price.includes('0') || p.price.includes('kostenlos'));
      
      const hasPaid = filters.priceRanges.includes('paid') && 
        software.pricing?.some(p => !p.model.toLowerCase().includes('free') && 
                               !p.model.toLowerCase().includes('subscription') && 
                               !p.price.includes('0') && 
                               !p.price.includes('kostenlos'));
      
      const hasSubscription = filters.priceRanges.includes('subscription') && 
        software.pricing?.some(p => p.model.toLowerCase().includes('subscription') || 
                               p.model.toLowerCase().includes('abonnement') ||
                               p.price.toLowerCase().includes('/month') || 
                               p.price.toLowerCase().includes('/monat'));
      
      if (!(hasFree || hasPaid || hasSubscription)) {
        return false;
      }
    }
    
    // Filter by rating thresholds
    const metrics = software.metrics || {};
    for (const [metric, threshold] of Object.entries(filters.ratingThresholds)) {
      if (threshold > 0) {
        const rating = metrics[metric]?.average || 0;
        if (rating < threshold) {
          return false;
        }
      }
    }
    
    return true;
  });
}

/**
 * Sorts software by various criteria
 * @param softwareList The list of software to sort
 * @param sortBy The sort criterion
 * @param sortOrder The sort order ('asc' or 'desc')
 * @returns Sorted software list
 */
export function sortSoftware(softwareList, sortBy = 'rating', sortOrder = 'desc') {
  return [...softwareList].sort((a, b) => {
    let valueA, valueB;
    
    switch (sortBy) {
      case 'name':
        valueA = a.name.toLowerCase();
        valueB = b.name.toLowerCase();
        break;
        
      case 'rating':
        // Calculate average rating
        const metricsA = a.metrics || {};
        const metricsB = b.metrics || {};
        
        const ratingsA = Object.values(metricsA).map(m => m.average || 0);
        const ratingsB = Object.values(metricsB).map(m => m.average || 0);
        
        valueA = ratingsA.length > 0 ? ratingsA.reduce((sum, r) => sum + r, 0) / ratingsA.length : 0;
        valueB = ratingsB.length > 0 ? ratingsB.reduce((sum, r) => sum + r, 0) / ratingsB.length : 0;
        break;
        
      case 'votes':
        // Calculate total votes
        const votesA = Object.values(a.metrics || {}).reduce((sum, m) => sum + (m.count || 0), 0);
        const votesB = Object.values(b.metrics || {}).reduce((sum, m) => sum + (m.count || 0), 0);
        
        valueA = votesA;
        valueB = votesB;
        break;
        
      case 'date':
        valueA = new Date(a.lastUpdated).getTime();
        valueB = new Date(b.lastUpdated).getTime();
        break;
        
      default:
        valueA = a.name.toLowerCase();
        valueB = b.name.toLowerCase();
    }
    
    // Apply sort order
    if (sortOrder === 'asc') {
      return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
    } else {
      return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
    }
  });
}