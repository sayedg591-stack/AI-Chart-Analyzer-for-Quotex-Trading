import type { Analysis } from "@/lib/analysis"

/**
 * Fully client-side chart analysis — no external AI, no API key, no billing.
 *
 * The engine inspects the uploaded screenshot pixel-by-pixel:
 *  - classifies pixels as bullish (green) / bearish (red) candles using HSV
 *  - measures the trend by fitting a line through per-column price centroids
 *  - measures recent momentum (latest candles vs the prior stretch)
 *  - measures volatility from the vertical spread of candle pixels
 *  - locates support / resistance zones from a horizontal density histogram
 */

type RGB = { r: number; g: number; b: number }

function rgbToHsv({ r, g, b }: RGB) {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6
    else if (max === gn) h = (bn - rn) / d + 2
    else h = (rn - gn) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  const s = max === 0 ? 0 : d / max
  return { h, s, v: max }
}

type PixelKind = "green" | "red" | "none"

function classify(rgb: RGB): PixelKind {
  const { h, s, v } = rgbToHsv(rgb)
  // background (very dark or very light/desaturated grid + panels)
  if (v < 0.16 || s < 0.2) return "none"
  if (h >= 70 && h <= 175) return "green" // bullish candles (green / teal / lime)
  if (h <= 22 || h >= 330) return "red" // bearish candles (red / pink-red)
  return "none"
}

function median(nums: number[]) {
  if (nums.length === 0) return 0
  const s = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

function parseSymbol(notes?: string): string {
  if (!notes) return "Unknown"
  const pair = notes.match(/\b([A-Za-z]{2,6})\s*[/\-]\s*([A-Za-z]{2,6})\b/)
  if (pair) return `${pair[1].toUpperCase()}/${pair[2].toUpperCase()}`
  const single = notes.match(/\b(BTC|ETH|XAU|GOLD|EUR|USD|GBP|JPY|SPX|NAS|OTC)\w*\b/i)
  return single ? single[0].toUpperCase() : "Unknown"
}

function parseTimeframe(notes?: string): string {
  if (!notes) return "Unknown"
  const tf = notes.match(/\b(\d+)\s*(s|sec|secs|m|min|mins|h|hr|hour|hours|d|day)\b/i)
  if (!tf) return "Unknown"
  const n = tf[1]
  const unit = tf[2].toLowerCase()
  if (unit.startsWith("s")) return `${n}s`
  if (unit.startsWith("h")) return `${n}H`
  if (unit.startsWith("d")) return `${n}D`
  return `${n}m`
}

export function analyzeChartImage(image: ImageData, notes?: string): Analysis {
  const { width: w, height: h, data } = image

  const colCount = new Array<number>(w).fill(0)
  const colSumY = new Array<number>(w).fill(0)
  const colMinY = new Array<number>(w).fill(Number.POSITIVE_INFINITY)
  const colMaxY = new Array<number>(w).fill(Number.NEGATIVE_INFINITY)
  const rowHist = new Array<number>(h).fill(0)

  let greenCount = 0
  let redCount = 0

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const kind = classify({ r: data[i], g: data[i + 1], b: data[i + 2] })
      if (kind === "none") continue
      if (kind === "green") greenCount++
      else redCount++
      colCount[x]++
      colSumY[x] += y
      if (y < colMinY[x]) colMinY[x] = y
      if (y > colMaxY[x]) colMaxY[x] = y
      rowHist[y]++
    }
  }

  const candlePixels = greenCount + redCount
  const coverage = candlePixels / (w * h)

  // Not a chart if there's almost no candle-colored content.
  if (coverage < 0.004 || candlePixels < 300) {
    return notChart()
  }

  // Active columns = columns that actually contain candle content.
  const centroids: { x: number; y: number }[] = []
  const spreads: number[] = []
  for (let x = 0; x < w; x++) {
    if (colCount[x] < 2) continue
    centroids.push({ x, y: colSumY[x] / colCount[x] })
    spreads.push((colMaxY[x] - colMinY[x]) / h)
  }

  if (centroids.length < 8) return notChart()

  // Linear regression of price-centroid over x (least squares).
  const n = centroids.length
  let sx = 0
  let sy = 0
  let sxx = 0
  let sxy = 0
  for (const p of centroids) {
    sx += p.x
    sy += p.y
    sxx += p.x * p.x
    sxy += p.x * p.y
  }
  const denom = n * sxx - sx * sx
  const slope = denom === 0 ? 0 : (n * sxy - sx * sy) / denom // dy/dx in pixels

  const xMin = centroids[0].x
  const xMax = centroids[centroids.length - 1].x
  // Price rises when y decreases → negate. Normalize by chart height.
  const riseFrac = (-slope * (xMax - xMin)) / h

  // Momentum: last quarter of active columns vs the quarter before it.
  const q = Math.max(2, Math.floor(n / 4))
  const lastMeanY = mean(centroids.slice(n - q).map((p) => p.y))
  const priorMeanY = mean(centroids.slice(n - 2 * q, n - q).map((p) => p.y))
  const recentFrac = (priorMeanY - lastMeanY) / h // positive → rising

  const volatility = clamp(median(spreads), 0, 1)

  // Trend classification.
  let trend: Analysis["trend"]
  if (riseFrac > 0.05) trend = "bullish"
  else if (riseFrac < -0.05) trend = "bearish"
  else trend = "sideways"

  // Combined directional bias.
  const bias = riseFrac * 0.6 + recentFrac * 0.4
  let direction: Analysis["direction"]
  if (Math.abs(bias) < 0.03 || (trend === "sideways" && Math.abs(recentFrac) < 0.06)) {
    direction = "neutral"
  } else {
    direction = bias > 0 ? "up" : "down"
  }

  // Confidence: trend magnitude + momentum agreement, penalized by volatility & conflict.
  const trendScore = clamp(Math.abs(riseFrac) / 0.25, 0, 1)
  const momoScore = clamp(Math.abs(recentFrac) / 0.2, 0, 1)
  const agree = Math.sign(riseFrac) === Math.sign(recentFrac) ? 1 : 0.55
  let confidence = 38 + trendScore * 34 + momoScore * 20
  confidence *= agree
  confidence -= volatility * 12
  if (direction === "neutral") confidence = clamp(confidence, 30, 52)
  confidence = clamp(Math.round(confidence), 28, 92)

  // Support / resistance from the row-density histogram (smoothed peak zones).
  const { support, resistance } = detectLevels(rowHist, h)

  const bullPct = Math.round((greenCount / candlePixels) * 100)
  const bearPct = 100 - bullPct

  const trendWord = trend === "bullish" ? "upward" : trend === "bearish" ? "downward" : "sideways / ranging"
  const momoWord = recentFrac > 0.02 ? "pushing higher" : recentFrac < -0.02 ? "rolling over" : "flattening out"

  const summary =
    `The chart is trending ${trendWord} with price action ${momoWord} into the most recent candles. ` +
    `Candle balance is ${bullPct}% bullish / ${bearPct}% bearish, and volatility looks ${
      volatility > 0.28 ? "elevated" : volatility > 0.14 ? "moderate" : "contained"
    }.`

  const suggestedExpiry = volatility > 0.28 ? "3-5 candles" : "1-3 candles"

  const patterns: Analysis["patterns"] = []
  if (trend === "bullish" && recentFrac > 0.02) {
    patterns.push({ name: "Higher highs / higher lows", implication: "Structure favors continuation to the upside." })
  } else if (trend === "bearish" && recentFrac < -0.02) {
    patterns.push({ name: "Lower highs / lower lows", implication: "Structure favors continuation to the downside." })
  } else if (trend === "sideways") {
    patterns.push({ name: "Consolidation range", implication: "Price is coiling; wait for a breakout of the range." })
  }
  if (Math.sign(riseFrac) !== Math.sign(recentFrac) && Math.abs(recentFrac) > 0.05) {
    patterns.push({
      name: "Possible reversal / pullback",
      implication: "Recent candles are fighting the broader trend — momentum is shifting.",
    })
  }

  const indicators: Analysis["indicators"] = [
    { name: "Trend slope", reading: `${riseFrac >= 0 ? "+" : ""}${(riseFrac * 100).toFixed(1)}% of range across the frame` },
    {
      name: "Recent momentum",
      reading: `${recentFrac >= 0 ? "+" : ""}${(recentFrac * 100).toFixed(1)}% over the last leg`,
    },
    { name: "Candle balance", reading: `${bullPct}% bullish / ${bearPct}% bearish` },
    { name: "Volatility", reading: `${(volatility * 100).toFixed(0)}% avg candle range` },
  ]

  const education =
    `This read is computed directly from the pixels of your screenshot. Each column of the chart is reduced to an ` +
    `average price point, and a best-fit line through those points gives the trend (${trendWord}). The last ~25% of ` +
    `candles are compared against the prior stretch to gauge momentum. When the trend and momentum agree, confidence ` +
    `rises; when they conflict or volatility is high, confidence is trimmed.`

  const risks: string[] = [
    "This is an automated visual estimate, not financial advice.",
    "Axis prices, symbol, and timeframe can't be read from pixels — provide them in the notes for context.",
    "News spikes and low-volume periods can invalidate any technical read.",
  ]
  if (volatility > 0.28) risks.push("High volatility increases the chance of stop-outs and false signals.")
  if (agree < 1) risks.push("Trend and short-term momentum disagree, so the market may be choppy right now.")

  return {
    isChart: true,
    symbol: parseSymbol(notes),
    timeframe: parseTimeframe(notes),
    trend,
    direction,
    confidence,
    summary,
    supportLevels: support,
    resistanceLevels: resistance,
    patterns,
    indicators,
    suggestedExpiry,
    education,
    risks,
  }
}

function mean(nums: number[]) {
  if (nums.length === 0) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function detectLevels(rowHist: number[], h: number): { support: string[]; resistance: string[] } {
  // Smooth the histogram with a small moving average.
  const win = Math.max(2, Math.floor(h / 60))
  const smooth = new Array<number>(h).fill(0)
  for (let y = 0; y < h; y++) {
    let sum = 0
    let cnt = 0
    for (let k = -win; k <= win; k++) {
      const yy = y + k
      if (yy >= 0 && yy < h) {
        sum += rowHist[yy]
        cnt++
      }
    }
    smooth[y] = sum / cnt
  }

  const maxDensity = Math.max(...smooth)
  if (maxDensity <= 0) return { support: [], resistance: [] }

  // Find local peaks that are meaningfully dense.
  const peaks: { y: number; d: number }[] = []
  const minGap = Math.max(6, Math.floor(h / 12))
  for (let y = 1; y < h - 1; y++) {
    if (smooth[y] < maxDensity * 0.4) continue
    if (smooth[y] >= smooth[y - 1] && smooth[y] >= smooth[y + 1]) {
      const near = peaks.find((p) => Math.abs(p.y - y) < minGap)
      if (near) {
        if (smooth[y] > near.d) {
          near.y = y
          near.d = smooth[y]
        }
      } else {
        peaks.push({ y, d: smooth[y] })
      }
    }
  }

  peaks.sort((a, b) => b.d - a.d)
  const top = peaks.slice(0, 4)

  const toZone = (y: number) => {
    const pricePos = 1 - y / h // 0 = bottom, 1 = top of visible range
    const pct = Math.round(pricePos * 100)
    const band = pricePos > 0.66 ? "upper" : pricePos > 0.33 ? "mid" : "lower"
    return { pricePos, label: `${band} zone (~${pct}% of visible range)` }
  }

  const resistance: string[] = []
  const support: string[] = []
  for (const p of top) {
    const z = toZone(p.y)
    if (z.pricePos >= 0.5) resistance.push(z.label)
    else support.push(z.label)
  }

  // Ensure at least one of each if peaks exist.
  if (resistance.length === 0 && top.length) resistance.push(toZone(Math.min(...top.map((p) => p.y))).label)
  if (support.length === 0 && top.length) support.push(toZone(Math.max(...top.map((p) => p.y))).label)

  return {
    support: support.slice(0, 2),
    resistance: resistance.slice(0, 2),
  }
}

function notChart(): Analysis {
  return {
    isChart: false,
    symbol: "Unknown",
    timeframe: "Unknown",
    trend: "sideways",
    direction: "neutral",
    confidence: 0,
    summary: "",
    supportLevels: [],
    resistanceLevels: [],
    patterns: [],
    indicators: [],
    suggestedExpiry: "",
    education: "",
    risks: [],
  }
}
