import { mockUAIData } from './mockData';

// CountyId for Mombasa (assuming it's '1')
const mombasaUAIs = mockUAIData.filter(uai => uai.countyId === '1');
console.log('Mombasa UAIs:', mombasaUAIs);

if (mombasaUAIs.length > 0) {
  console.log('✅ Mombasa UAI data is present and working.');
} else {
  console.error('❌ No UAI data found for Mombasa.');
}
