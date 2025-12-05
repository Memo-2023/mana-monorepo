import { getCollection } from 'astro:content';
import { getMetrics } from './api';

interface SoftwareData {
	id: string;
	name: string;
	description: string;
	logo?: string;
	screenshots?: string[];
	features: string[];
	platforms: string[];
	categories: string[];
	pricing: {
		model: string;
		price: string;
		yearly_price?: string;
		features: string[];
	}[];
	website: string;
	lastUpdated: string;
	metrics?: Record<string, { average: number; count: number }>;
	similarSoftware?: any[];
}

export async function loadSoftwareData(entry: any, locale: string): Promise<SoftwareData> {
	// Extract the software ID
	const id = entry.id.split('/')[1]; // The format is 'locale/id'

	// Get software data from the entry
	const software: SoftwareData = {
		id,
		...entry.data,
	};

	// Load metrics from backend
	await loadMetricsFromBackend(software.id, software);

	// Load similar software
	await loadSimilarSoftware(software, locale);

	return software;
}

async function loadMetricsFromBackend(softwareId: string, software: SoftwareData): Promise<void> {
	// Default metrics
	software.metrics = {
		easeOfUse: { average: 4.2, count: 15 },
		featureRichness: { average: 3.8, count: 12 },
		valueForMoney: { average: 4.5, count: 18 },
		support: { average: 3.5, count: 10 },
		reliability: { average: 4.0, count: 14 },
	};

	try {
		const result = await getMetrics(softwareId);
		if (result && result.metrics) {
			software.metrics = result.metrics;
		}
	} catch (error) {
		console.error('Error fetching metrics from backend:', error);
		// Continue with default metrics
	}
}

async function loadSimilarSoftware(software: SoftwareData, locale: string): Promise<void> {
  try {
    // Get all software entries
    const allSoftware = await getCollection('software');
    
    // Filter similar software based on categories
    const similarSoftwareEntries = allSoftware.filter(item => {
      // Skip the current software
      if (item.id === `${locale}/${software.id}`) return false;
      
      // Extract the software's locale and categories
      const [itemLocale, itemId] = item.id.split('/');
      const itemCategories = item.data.categories || [];
      
      // Only include software with the same locale and at least one shared category
      return itemLocale === locale && 
        itemCategories.some(cat => software.categories.includes(cat));
    });
    
    // Convert entries to a more usable format for the frontend
    software.similarSoftware = similarSoftwareEntries.map(item => {
      const [itemLocale, itemId] = item.id.split('/');
      return {
        id: itemId,
        name: item.data.name,
        description: item.data.description,
        categories: item.data.categories || [],
        logo: item.data.logo || '/logos/sample-logo.svg'
      };
    });
  } catch (error) {
    console.error('Error loading similar software:', error);
    software.similarSoftware = [];
  }
}