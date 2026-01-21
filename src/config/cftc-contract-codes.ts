/**
 * Official CFTC Contract Market Codes
 *
 * These codes are used to reliably match our internal market symbols
 * to the correct CFTC Legacy Futures report data.
 *
 * Source: CFTC Commitments of Traders Legacy Futures format
 * API: https://publicreporting.cftc.gov/resource/6dca-aqww.json
 *
 * Format: { symbol: cftc_contract_market_code }
 */

export const CFTC_CONTRACT_CODES: Record<string, string> = {
  // Equities
  ES: '13874A',      // E-MINI S&P 500 STOCK INDEX - CHICAGO MERCANTILE EXCHANGE
  NQ: '20974A',      // E-MINI NASDAQ-100 STOCK INDEX - CHICAGO MERCANTILE EXCHANGE
  YM: '12460P',      // MINI-SIZED DOW JONES INDUSTRIAL AVG - CHICAGO BOARD OF TRADE
  RTY: '239742',     // E-MINI RUSSELL 2000 INDEX - CHICAGO MERCANTILE EXCHANGE

  // Treasury Bonds & Notes
  ZB: '020601',      // U.S. TREASURY BONDS - CHICAGO BOARD OF TRADE
  ZN: '043602',      // 10-YEAR U.S. TREASURY NOTES - CHICAGO BOARD OF TRADE
  ZF: '044601',      // 5-YEAR U.S. TREASURY NOTES - CHICAGO BOARD OF TRADE
  ZT: '042601',      // 2-YEAR U.S. TREASURY NOTES - CHICAGO BOARD OF TRADE

  // Energies
  CL: '067651',      // CRUDE OIL, LIGHT SWEET - NEW YORK MERCANTILE EXCHANGE
  NG: '023651',      // NATURAL GAS - NEW YORK MERCANTILE EXCHANGE
  RB: '111659',      // RBOB GASOLINE - NEW YORK MERCANTILE EXCHANGE
  HO: '022651',      // NY HARBOR ULSD (HEATING OIL) - NEW YORK MERCANTILE EXCHANGE

  // Metals
  GC: '088691',      // GOLD - COMMODITY EXCHANGE INC.
  SI: '084691',      // SILVER - COMMODITY EXCHANGE INC.
  HG: '085692',      // COPPER-GRADE #1 - COMMODITY EXCHANGE INC.
  PL: '076651',      // PLATINUM - NEW YORK MERCANTILE EXCHANGE

  // Currencies
  '6E': '099741',    // EURO FX - CHICAGO MERCANTILE EXCHANGE
  '6J': '097741',    // JAPANESE YEN - CHICAGO MERCANTILE EXCHANGE
  '6B': '096742',    // BRITISH POUND - CHICAGO MERCANTILE EXCHANGE
  '6A': '232741',    // AUSTRALIAN DOLLAR - CHICAGO MERCANTILE EXCHANGE
  '6C': '090741',    // CANADIAN DOLLAR - CHICAGO MERCANTILE EXCHANGE
  '6S': '092741',    // SWISS FRANC - CHICAGO MERCANTILE EXCHANGE
  DX: '098662',      // U.S. DOLLAR INDEX - ICE FUTURES U.S.

  // Agriculturals
  ZC: '002602',      // CORN - CHICAGO BOARD OF TRADE
  ZS: '005602',      // SOYBEANS - CHICAGO BOARD OF TRADE
  ZW: '001602',      // WHEAT-SRW - CHICAGO BOARD OF TRADE
  ZL: '007601',      // SOYBEAN OIL - CHICAGO BOARD OF TRADE
  ZM: '026603',      // SOYBEAN MEAL - CHICAGO BOARD OF TRADE
  KC: '083731',      // COFFEE C - ICE FUTURES U.S.
  SB: '080732',      // SUGAR NO. 11 - ICE FUTURES U.S.
  CT: '033661',      // COTTON NO. 2 - ICE FUTURES U.S.
  CC: '073732',      // COCOA - ICE FUTURES U.S.

  // Livestock
  LE: '057642',      // LIVE CATTLE - CHICAGO MERCANTILE EXCHANGE
  HE: '054642',      // LEAN HOGS - CHICAGO MERCANTILE EXCHANGE
  GF: '061641',      // FEEDER CATTLE - CHICAGO MERCANTILE EXCHANGE

  // Crypto
  BTC: '133741',     // BITCOIN - CHICAGO MERCANTILE EXCHANGE
  ETH: '146021',     // ETHER - CHICAGO MERCANTILE EXCHANGE
};

/**
 * Get the CFTC contract code for a given symbol
 */
export function getCftcCode(symbol: string): string | undefined {
  return CFTC_CONTRACT_CODES[symbol];
}

/**
 * Get the symbol for a given CFTC contract code
 */
export function getSymbolFromCftcCode(cftcCode: string): string | undefined {
  return Object.entries(CFTC_CONTRACT_CODES).find(
    ([_, code]) => code === cftcCode
  )?.[0];
}

/**
 * Validate that all symbols have CFTC codes
 */
export function validateCftcCodes(symbols: string[]): { valid: string[]; missing: string[] } {
  const valid: string[] = [];
  const missing: string[] = [];

  for (const symbol of symbols) {
    if (CFTC_CONTRACT_CODES[symbol]) {
      valid.push(symbol);
    } else {
      missing.push(symbol);
    }
  }

  return { valid, missing };
}
