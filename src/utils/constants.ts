// Market symbols and names from CFTC Crowded Market Report
export const MARKETS = {
  // Energies
  CL: { name: 'Crude Oil WTI', category: 'Energy', exchange: 'NYMEX', contractUnit: '1,000 barrels', tickSize: '$0.01' },
  NG: { name: 'Natural Gas', category: 'Energy', exchange: 'NYMEX', contractUnit: '10,000 MMBtu', tickSize: '$0.001' },
  RB: { name: 'RBOB Gasoline', category: 'Energy', exchange: 'NYMEX', contractUnit: '42,000 gallons', tickSize: '$0.0001' },
  HO: { name: 'Heating Oil', category: 'Energy', exchange: 'NYMEX', contractUnit: '42,000 gallons', tickSize: '$0.0001' },

  // Metals
  GC: { name: 'Gold', category: 'Metal', exchange: 'COMEX', contractUnit: '100 troy oz', tickSize: '$0.10' },
  SI: { name: 'Silver', category: 'Metal', exchange: 'COMEX', contractUnit: '5,000 troy oz', tickSize: '$0.005' },
  HG: { name: 'Copper', category: 'Metal', exchange: 'COMEX', contractUnit: '25,000 lbs', tickSize: '$0.0005' },
  PL: { name: 'Platinum', category: 'Metal', exchange: 'NYMEX', contractUnit: '50 troy oz', tickSize: '$0.10' },

  // Financials
  ES: { name: 'E-mini S&P 500', category: 'Financial', exchange: 'CME', contractUnit: '$50 x Index', tickSize: '0.25 pts' },
  NQ: { name: 'E-mini NASDAQ 100', category: 'Financial', exchange: 'CME', contractUnit: '$20 x Index', tickSize: '0.25 pts' },
  YM: { name: 'E-mini Dow', category: 'Financial', exchange: 'CBOT', contractUnit: '$5 x Index', tickSize: '1.00 pts' },
  RTY: { name: 'E-mini Russell 2000', category: 'Financial', exchange: 'CME', contractUnit: '$50 x Index', tickSize: '0.10 pts' },
  ZB: { name: '30-Year T-Bond', category: 'Financial', exchange: 'CBOT', contractUnit: '$100,000', tickSize: '1/32 pt' },
  ZN: { name: '10-Year T-Note', category: 'Financial', exchange: 'CBOT', contractUnit: '$100,000', tickSize: '1/64 pt' },
  ZF: { name: '5-Year T-Note', category: 'Financial', exchange: 'CBOT', contractUnit: '$100,000', tickSize: '1/128 pt' },
  ZT: { name: '2-Year T-Note', category: 'Financial', exchange: 'CBOT', contractUnit: '$200,000', tickSize: '1/256 pt' },

  // Currencies
  '6E': { name: 'Euro FX', category: 'Currency', exchange: 'CME', contractUnit: '€125,000', tickSize: '$0.00005' },
  '6J': { name: 'Japanese Yen', category: 'Currency', exchange: 'CME', contractUnit: '¥12,500,000', tickSize: '$0.0000005' },
  '6B': { name: 'British Pound', category: 'Currency', exchange: 'CME', contractUnit: '£62,500', tickSize: '$0.0001' },
  '6A': { name: 'Australian Dollar', category: 'Currency', exchange: 'CME', contractUnit: 'A$100,000', tickSize: '$0.0001' },
  '6C': { name: 'Canadian Dollar', category: 'Currency', exchange: 'CME', contractUnit: 'C$100,000', tickSize: '$0.00005' },
  '6S': { name: 'Swiss Franc', category: 'Currency', exchange: 'CME', contractUnit: 'CHF125,000', tickSize: '$0.0001' },
  DX: { name: 'US Dollar Index', category: 'Currency', exchange: 'ICE', contractUnit: '$1,000 x Index', tickSize: '0.005' },

  // Agriculturals
  ZC: { name: 'Corn', category: 'Agricultural', exchange: 'CBOT', contractUnit: '5,000 bushels', tickSize: '1/4 cent' },
  ZS: { name: 'Soybeans', category: 'Agricultural', exchange: 'CBOT', contractUnit: '5,000 bushels', tickSize: '1/4 cent' },
  ZW: { name: 'Wheat', category: 'Agricultural', exchange: 'CBOT', contractUnit: '5,000 bushels', tickSize: '1/4 cent' },
  ZL: { name: 'Soybean Oil', category: 'Agricultural', exchange: 'CBOT', contractUnit: '60,000 lbs', tickSize: '$0.01' },
  ZM: { name: 'Soybean Meal', category: 'Agricultural', exchange: 'CBOT', contractUnit: '100 short tons', tickSize: '$0.10' },
  KC: { name: 'Coffee', category: 'Agricultural', exchange: 'ICE', contractUnit: '37,500 lbs', tickSize: '$0.0005' },
  SB: { name: 'Sugar #11', category: 'Agricultural', exchange: 'ICE', contractUnit: '112,000 lbs', tickSize: '$0.01' },
  CT: { name: 'Cotton', category: 'Agricultural', exchange: 'ICE', contractUnit: '50,000 lbs', tickSize: '$0.01' },
  CC: { name: 'Cocoa', category: 'Agricultural', exchange: 'ICE', contractUnit: '10 metric tons', tickSize: '$1.00' },

  // Livestock
  LE: { name: 'Live Cattle', category: 'Livestock', exchange: 'CME', contractUnit: '40,000 lbs', tickSize: '$0.00025' },
  HE: { name: 'Lean Hogs', category: 'Livestock', exchange: 'CME', contractUnit: '40,000 lbs', tickSize: '$0.00025' },
  GF: { name: 'Feeder Cattle', category: 'Livestock', exchange: 'CME', contractUnit: '50,000 lbs', tickSize: '$0.00025' },

  // Crypto
  BTC: { name: 'Bitcoin Futures', category: 'Crypto', exchange: 'CME', contractUnit: '5 BTC', tickSize: '$5.00' },
  ETH: { name: 'Ethereum Futures', category: 'Crypto', exchange: 'CME', contractUnit: '50 ETH', tickSize: '$0.05' }
} as const;

export type MarketSymbol = keyof typeof MARKETS;

export const MARKET_CATEGORIES = [
  'Energy',
  'Metal',
  'Financial',
  'Currency',
  'Agricultural',
  'Livestock',
  'Crypto'
] as const;
