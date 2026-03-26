/**
 * Maps internal market symbols to EODHD (eodhistoricaldata.com) ticker symbols.
 *
 * Format: { internalSymbol: 'TICKER.EXCHANGE' }
 *
 * We use the most liquid/representative instrument for each asset:
 * - Commodities: Continuous futures on their native exchange
 * - Equity indices: Index ETFs (better liquidity than futures on EOD)
 * - Currencies: Forex pairs
 * - Crypto: Crypto tickers
 * - Bonds: Treasury ETFs
 */

export const EOD_SYMBOL_MAP: Record<string, string> = {
  // Equities - using index ETFs for best EOD coverage
  ES: 'SPY.US',          // S&P 500 via SPDR ETF
  NQ: 'QQQ.US',          // NASDAQ 100 via Invesco ETF
  YM: 'DIA.US',          // Dow Jones via SPDR ETF
  RTY: 'IWM.US',         // Russell 2000 via iShares ETF

  // Treasury Bonds & Notes - using Treasury ETFs
  ZB: 'TLT.US',          // 20+ Year Treasury Bond ETF
  ZN: 'IEF.US',          // 7-10 Year Treasury Note ETF
  ZF: 'IEI.US',          // 3-7 Year Treasury Note ETF
  ZT: 'SHY.US',          // 1-3 Year Treasury Note ETF

  // Energies - continuous futures
  CL: 'CL.COMEX',        // Crude Oil
  NG: 'NG.COMEX',        // Natural Gas
  RB: 'RB.COMEX',        // RBOB Gasoline
  HO: 'HO.COMEX',        // Heating Oil

  // Metals - continuous futures
  GC: 'GC.COMEX',        // Gold
  SI: 'SI.COMEX',        // Silver
  HG: 'HG.COMEX',        // Copper
  PL: 'PL.COMEX',        // Platinum

  // Currencies - forex pairs
  '6E': 'EURUSD.FOREX',  // Euro
  '6J': 'JPYUSD.FOREX',  // Japanese Yen
  '6B': 'GBPUSD.FOREX',  // British Pound
  '6A': 'AUDUSD.FOREX',  // Australian Dollar
  '6C': 'CADUSD.FOREX',  // Canadian Dollar
  '6S': 'CHFUSD.FOREX',  // Swiss Franc
  DX: 'DX.INDX',         // US Dollar Index

  // Agriculturals - continuous futures
  ZC: 'ZC.CBOT',         // Corn
  ZS: 'ZS.CBOT',         // Soybeans
  ZW: 'ZW.CBOT',         // Wheat
  ZL: 'ZL.CBOT',         // Soybean Oil
  ZM: 'ZM.CBOT',         // Soybean Meal
  KC: 'KC.NYBOT',        // Coffee
  SB: 'SB.NYBOT',        // Sugar
  CT: 'CT.NYBOT',        // Cotton
  CC: 'CC.NYBOT',        // Cocoa

  // Livestock
  LE: 'LE.CME',          // Live Cattle
  HE: 'HE.CME',          // Lean Hogs
  GF: 'GF.CME',          // Feeder Cattle

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
