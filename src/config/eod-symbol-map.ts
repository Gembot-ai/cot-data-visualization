/**
 * Maps internal market symbols to EODHD (eodhistoricaldata.com) ticker symbols.
 *
 * Format: { internalSymbol: 'TICKER.EXCHANGE' }
 *
 * EODHD doesn't support raw futures tickers, so we use the best available
 * proxy for each asset: ETFs for commodities/bonds, forex pairs for
 * currencies, and crypto tickers directly.
 */

export const EOD_SYMBOL_MAP: Record<string, string> = {
  // Equities - index ETFs
  ES: 'SPY.US',          // S&P 500 via SPDR ETF
  NQ: 'QQQ.US',          // NASDAQ 100 via Invesco ETF
  YM: 'DIA.US',          // Dow Jones via SPDR ETF
  RTY: 'IWM.US',         // Russell 2000 via iShares ETF

  // Treasury Bonds & Notes - Treasury ETFs
  ZB: 'TLT.US',          // 20+ Year Treasury Bond ETF
  ZN: 'IEF.US',          // 7-10 Year Treasury Note ETF
  ZF: 'IEI.US',          // 3-7 Year Treasury Note ETF
  ZT: 'SHY.US',          // 1-3 Year Treasury Note ETF

  // Energies - commodity ETFs
  CL: 'USO.US',          // United States Oil Fund
  NG: 'UNG.US',          // United States Natural Gas Fund
  RB: 'UGA.US',          // United States Gasoline Fund
  HO: 'USO.US',          // No direct heating oil ETF, use oil as proxy

  // Metals - commodity ETFs
  GC: 'GLD.US',          // SPDR Gold Shares
  SI: 'SLV.US',          // iShares Silver Trust
  HG: 'CPER.US',         // United States Copper Index Fund
  PL: 'PPLT.US',         // abrdn Physical Platinum Shares

  // Currencies - forex pairs
  '6E': 'EURUSD.FOREX',  // Euro
  '6J': 'JPYUSD.FOREX',  // Japanese Yen
  '6B': 'GBPUSD.FOREX',  // British Pound
  '6A': 'AUDUSD.FOREX',  // Australian Dollar
  '6C': 'CADUSD.FOREX',  // Canadian Dollar
  '6S': 'CHFUSD.FOREX',  // Swiss Franc
  DX: 'UUP.US',          // Invesco DB US Dollar Index Bullish Fund

  // Agriculturals - commodity ETFs
  ZC: 'CORN.US',         // Teucrium Corn Fund
  ZS: 'SOYB.US',         // Teucrium Soybean Fund
  ZW: 'WEAT.US',         // Teucrium Wheat Fund
  ZL: 'SOYB.US',         // No direct soybean oil ETF, use soybeans as proxy
  ZM: 'SOYB.US',         // No direct soybean meal ETF, use soybeans as proxy
  KC: 'COFF.LSE',        // WisdomTree Coffee ETC
  SB: 'CANE.US',         // Teucrium Sugar Fund
  CT: 'COTN.LSE',        // WisdomTree Cotton ETC
  CC: 'COCO.LSE',        // WisdomTree Cocoa ETC

  // Livestock
  LE: 'CATL.LSE',        // WisdomTree Live Cattle ETC
  HE: 'CATL.LSE',        // No direct hogs ETF, use cattle as proxy
  GF: 'CATL.LSE',        // No direct feeder cattle ETF, use cattle as proxy

  // Crypto
  BTC: 'BTC-USD.CC',     // Bitcoin
  ETH: 'ETH-USD.CC',     // Ethereum
};

/**
 * Get the EODHD ticker symbol for an internal market symbol
 */
export function getEodTicker(symbol: string): string | undefined {
  return EOD_SYMBOL_MAP[symbol];
}
