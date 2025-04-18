import { UAI } from '../types';
import { mockUAIData } from '../services/mockData';

// Create a cached map for faster lookups
const uaiCache: Record<string, UAI[]> = {};
let isInitialized = false;

/**
 * Initialize the UAI cache for faster lookups
 */
export function initializeUAICache(): void {
  if (isInitialized) return;
  
  // Index the UAI data by county and crop type for faster access
  mockUAIData.forEach(uai => {
    const key = `${uai.countyId}-${uai.cropType}`;
    if (!uaiCache[key]) {
      uaiCache[key] = [];
    }
    uaiCache[key].push(uai);
  });
  
  isInitialized = true;
}

/**
 * Get UAI data filtered by county and crop type with optimized performance
 * @param countyId The county ID to filter by
 * @param cropType The crop type to filter by
 * @returns Array of matching UAI objects
 */
export function getUAIByCountyAndCrop(countyId: string, cropType: string): UAI[] {
  if (!isInitialized) {
    initializeUAICache();
  }
  
  const key = `${countyId}-${cropType}`;
  return uaiCache[key] || [];
}

/**
 * Get a specific UAI by its ID
 * @param uaiId The UAI ID to look for
 * @returns The UAI object or undefined if not found
 */
export function getUAIById(uaiId: string): UAI | undefined {
  if (!isInitialized) {
    initializeUAICache();
  }
  
  // Flatten the cache values and find the UAI by ID
  for (const uais of Object.values(uaiCache)) {
    const found = uais.find(uai => uai.id === uaiId);
    if (found) return found;
  }
  
  // Fallback to direct search if not found in cache
  return mockUAIData.find(uai => uai.id === uaiId);
}

/**
 * Calculate premium based on UAI, acres and crop type
 * @param uaiId The UAI ID
 * @param acres Number of acres
 * @returns Calculated premium amount
 */
export function calculatePremium(uaiId: string, acres: number): number {
  if (!uaiId || acres <= 0) return 0;
  
  const uai = getUAIById(uaiId);
  if (!uai) return 0;
  
  return Math.round(acres * uai.premiumPerAcre * uai.value);
}
