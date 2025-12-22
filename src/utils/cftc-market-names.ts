/**
 * CFTC Market Name Mappings
 * Maps our internal symbols to CFTC's official market names
 */

export const CFTC_MARKET_NAMES: Record<string, string[]> = {
  // Equities
  ES: ['S&P 500', 'E-MINI S&P 500'],
  NQ: ['NASDAQ', 'NASDAQ MINI'],
  YM: ['DOW JONES', 'E-MINI DOW'],
  RTY: ['RUSSELL', 'E-MINI RUSSELL'],

  // Energies
  CL: ['CRUDE OIL', 'WTI'],
  NG: ['NATURAL GAS', 'HENRY HUB'],
  RB: ['RBOB', 'GASOLINE'],
  HO: ['HEATING OIL'],

  // Metals
  GC: ['GOLD'],
  SI: ['SILVER'],
  HG: ['COPPER'],
  PL: ['PLATINUM'],

  // Currencies
  '6E': ['EURO', 'EUR'],
  '6J': ['YEN', 'JPY', 'JAPANESE YEN'],
  '6B': ['POUND', 'GBP', 'BRITISH POUND'],
  '6A': ['AUSTRALIAN DOLLAR', 'AUD'],
  '6C': ['CANADIAN DOLLAR', 'CAD'],
  '6S': ['SWISS FRANC', 'CHF'],
  DX: ['DOLLAR INDEX', 'U.S. DOLLAR INDEX'],

  // Agriculturals
  ZC: ['CORN'],
  ZS: ['SOYBEANS', 'SOYBEAN'],
  ZW: ['WHEAT'],
  ZL: ['SOYBEAN OIL'],
  ZM: ['SOYBEAN MEAL'],
  KC: ['COFFEE'],
  SB: ['SUGAR'],
  CT: ['COTTON'],
  CC: ['COCOA'],

  // Livestock
  LE: ['LIVE CATTLE', 'CATTLE - LIVE'],
  HE: ['LEAN HOGS', 'HOGS - LEAN'],
  GF: ['FEEDER CATTLE', 'CATTLE - FEEDER'],

  // Crypto
  BTC: ['BITCOIN'],
  ETH: ['ETHER', 'ETHEREUM'],
};

/**
 * Check if a CFTC market name matches our symbol
 */
export function matchesCFTCMarketName(
  cftcName: string,
  symbol: string
): boolean {
  const patterns = CFTC_MARKET_NAMES[symbol];
  if (!patterns) return false;

  const upperName = cftcName.toUpperCase();
  return patterns.some(pattern => upperName.includes(pattern.toUpperCase()));
}
