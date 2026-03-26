/**
 * Maps internal market symbols to EODHD (eodhistoricaldata.com) ticker symbols.
 *
 * EODHD doesn't support raw futures tickers, so we use the best available
 * proxy for each asset: ETFs for commodities/bonds, forex pairs for
 * currencies, and crypto tickers directly.
 */

interface EodMapping {
  ticker: string;
  name: string;
}

export const EOD_SYMBOL_MAP: Record<string, EodMapping> = {
  // Equities - index ETFs
  ES:  { ticker: 'SPY.US',         name: 'SPDR S&P 500 ETF' },
  NQ:  { ticker: 'QQQ.US',         name: 'Invesco QQQ NASDAQ 100 ETF' },
  YM:  { ticker: 'DIA.US',         name: 'SPDR Dow Jones ETF' },
  RTY: { ticker: 'IWM.US',         name: 'iShares Russell 2000 ETF' },

  // Treasury Bonds & Notes
  ZB:  { ticker: 'TLT.US',         name: 'iShares 20+ Year Treasury Bond ETF' },
  ZN:  { ticker: 'IEF.US',         name: 'iShares 7-10 Year Treasury ETF' },
  ZF:  { ticker: 'IEI.US',         name: 'iShares 3-7 Year Treasury ETF' },
  ZT:  { ticker: 'SHY.US',         name: 'iShares 1-3 Year Treasury ETF' },

  // Energies
  CL:  { ticker: 'USO.US',         name: 'United States Oil Fund' },
  NG:  { ticker: 'UNG.US',         name: 'United States Natural Gas Fund' },
  RB:  { ticker: 'UGA.US',         name: 'United States Gasoline Fund' },
  HO:  { ticker: 'USO.US',         name: 'United States Oil Fund (proxy)' },

  // Metals
  GC:  { ticker: 'GLD.US',         name: 'SPDR Gold Shares' },
  SI:  { ticker: 'SLV.US',         name: 'iShares Silver Trust' },
  HG:  { ticker: 'CPER.US',        name: 'United States Copper Index Fund' },
  PL:  { ticker: 'PPLT.US',        name: 'abrdn Physical Platinum Shares' },

  // Currencies
  '6E': { ticker: 'EURUSD.FOREX',  name: 'EUR/USD Spot' },
  '6J': { ticker: 'JPYUSD.FOREX',  name: 'JPY/USD Spot' },
  '6B': { ticker: 'GBPUSD.FOREX',  name: 'GBP/USD Spot' },
  '6A': { ticker: 'AUDUSD.FOREX',  name: 'AUD/USD Spot' },
  '6C': { ticker: 'CADUSD.FOREX',  name: 'CAD/USD Spot' },
  '6S': { ticker: 'CHFUSD.FOREX',  name: 'CHF/USD Spot' },
  DX:  { ticker: 'UUP.US',         name: 'Invesco DB US Dollar Index Fund' },

  // Agriculturals
  ZC:  { ticker: 'CORN.US',        name: 'Teucrium Corn Fund' },
  ZS:  { ticker: 'SOYB.US',        name: 'Teucrium Soybean Fund' },
  ZW:  { ticker: 'WEAT.US',        name: 'Teucrium Wheat Fund' },
  ZL:  { ticker: 'SOYB.US',        name: 'Teucrium Soybean Fund (proxy)' },
  ZM:  { ticker: 'SOYB.US',        name: 'Teucrium Soybean Fund (proxy)' },
  KC:  { ticker: 'COFF.LSE',       name: 'WisdomTree Coffee ETC' },
  SB:  { ticker: 'CANE.US',        name: 'Teucrium Sugar Fund' },
  CT:  { ticker: 'COTN.LSE',       name: 'WisdomTree Cotton ETC' },
  CC:  { ticker: 'COCO.LSE',       name: 'WisdomTree Cocoa ETC' },

  // Livestock
  LE:  { ticker: 'CATL.LSE',       name: 'WisdomTree Live Cattle ETC' },
  HE:  { ticker: 'CATL.LSE',       name: 'WisdomTree Live Cattle ETC (proxy)' },
  GF:  { ticker: 'CATL.LSE',       name: 'WisdomTree Live Cattle ETC (proxy)' },

  // Crypto
  BTC: { ticker: 'BTC-USD.CC',     name: 'Bitcoin USD' },
  ETH: { ticker: 'ETH-USD.CC',     name: 'Ethereum USD' },
};

/**
 * Get the EODHD ticker symbol for an internal market symbol
 */
export function getEodTicker(symbol: string): string | undefined {
  return EOD_SYMBOL_MAP[symbol]?.ticker;
}

/**
 * Get the full mapping (ticker + name) for an internal market symbol
 */
export function getEodMapping(symbol: string): EodMapping | undefined {
  return EOD_SYMBOL_MAP[symbol];
}
