// Market symbols and names from CFTC Crowded Market Report
export const MARKETS = {
  // Energies
  CL: { name: 'Crude Oil WTI', category: 'Energy', exchange: 'NYMEX' },
  NG: { name: 'Natural Gas', category: 'Energy', exchange: 'NYMEX' },
  RB: { name: 'RBOB Gasoline', category: 'Energy', exchange: 'NYMEX' },
  HO: { name: 'Heating Oil', category: 'Energy', exchange: 'NYMEX' },

  // Metals
  GC: { name: 'Gold', category: 'Metal', exchange: 'COMEX' },
  SI: { name: 'Silver', category: 'Metal', exchange: 'COMEX' },
  HG: { name: 'Copper', category: 'Metal', exchange: 'COMEX' },
  PL: { name: 'Platinum', category: 'NYMEX', exchange: 'NYMEX' },

  // Financials
  ES: { name: 'E-mini S&P 500', category: 'Financial', exchange: 'CME' },
  NQ: { name: 'E-mini NASDAQ 100', category: 'Financial', exchange: 'CME' },
  YM: { name: 'E-mini Dow', category: 'Financial', exchange: 'CBOT' },
  RTY: { name: 'E-mini Russell 2000', category: 'Financial', exchange: 'CME' },
  ZB: { name: '30-Year T-Bond', category: 'Financial', exchange: 'CBOT' },
  ZN: { name: '10-Year T-Note', category: 'Financial', exchange: 'CBOT' },
  ZF: { name: '5-Year T-Note', category: 'Financial', exchange: 'CBOT' },
  ZT: { name: '2-Year T-Note', category: 'Financial', exchange: 'CBOT' },

  // Currencies
  '6E': { name: 'Euro FX', category: 'Currency', exchange: 'CME' },
  '6J': { name: 'Japanese Yen', category: 'Currency', exchange: 'CME' },
  '6B': { name: 'British Pound', category: 'Currency', exchange: 'CME' },
  '6A': { name: 'Australian Dollar', category: 'Currency', exchange: 'CME' },
  '6C': { name: 'Canadian Dollar', category: 'Currency', exchange: 'CME' },
  '6S': { name: 'Swiss Franc', category: 'Currency', exchange: 'CME' },
  DX: { name: 'US Dollar Index', category: 'Currency', exchange: 'ICE' },

  // Agriculturals
  ZC: { name: 'Corn', category: 'Agricultural', exchange: 'CBOT' },
  ZS: { name: 'Soybeans', category: 'Agricultural', exchange: 'CBOT' },
  ZW: { name: 'Wheat', category: 'Agricultural', exchange: 'CBOT' },
  ZL: { name: 'Soybean Oil', category: 'Agricultural', exchange: 'CBOT' },
  ZM: { name: 'Soybean Meal', category: 'Agricultural', exchange: 'CBOT' },
  KC: { name: 'Coffee', category: 'Agricultural', exchange: 'ICE' },
  SB: { name: 'Sugar #11', category: 'Agricultural', exchange: 'ICE' },
  CT: { name: 'Cotton', category: 'Agricultural', exchange: 'ICE' },
  CC: { name: 'Cocoa', category: 'Agricultural', exchange: 'ICE' },

  // Livestock
  LE: { name: 'Live Cattle', category: 'Livestock', exchange: 'CME' },
  HE: { name: 'Lean Hogs', category: 'Livestock', exchange: 'CME' },
  GF: { name: 'Feeder Cattle', category: 'Livestock', exchange: 'CME' },

  // Crypto
  BTC: { name: 'Bitcoin Futures', category: 'Crypto', exchange: 'CME' },
  ETH: { name: 'Ethereum Futures', category: 'Crypto', exchange: 'CME' }
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
