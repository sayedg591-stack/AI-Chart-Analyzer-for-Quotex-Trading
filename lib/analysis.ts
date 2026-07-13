export type Trend = "bullish" | "bearish" | "sideways"
export type Direction = "up" | "down" | "neutral"

export type Analysis = {
  /** True only if the image actually shows a financial price/candlestick chart. */
  isChart: boolean
  /** Traded instrument/pair (parsed from user notes, else 'Unknown'). */
  symbol: string
  /** Chart timeframe (parsed from user notes, else 'Unknown'). */
  timeframe: string
  /** Dominant market trend detected on the chart. */
  trend: Trend
  /** Suggested directional call for the next candles. */
  direction: Direction
  /** Confidence in the directional call, 0-100. */
  confidence: number
  /** Concise read of what the chart is doing right now. */
  summary: string
  /** Approximate support zones (chart-relative). */
  supportLevels: string[]
  /** Approximate resistance zones (chart-relative). */
  resistanceLevels: string[]
  /** Notable structural patterns detected. */
  patterns: { name: string; implication: string }[]
  /** Computed metric readings. */
  indicators: { name: string; reading: string }[]
  /** Suggested trade expiry / holding window. */
  suggestedExpiry: string
  /** Short educational explanation of the reasoning. */
  education: string
  /** Key risks or reasons the call could fail. */
  risks: string[]
}

export const trendMeta: Record<Trend, { label: string }> = {
  bullish: { label: "Bullish" },
  bearish: { label: "Bearish" },
  sideways: { label: "Sideways" },
}

export const directionMeta: Record<Direction, { label: string }> = {
  up: { label: "UP" },
  down: { label: "DOWN" },
  neutral: { label: "WAIT" },
}
