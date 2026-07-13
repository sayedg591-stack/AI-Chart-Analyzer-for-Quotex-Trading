import { CandlestickChart, Info } from "lucide-react"
import { ChartAnalyzer } from "@/components/chart-analyzer"

export default function Page() {
  return (
    <main className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-2.5 px-4 py-3.5">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <CandlestickChart className="size-5" aria-hidden />
          </div>
          <div className="leading-tight">
            <p className="font-semibold tracking-tight">ChartSense</p>
            <p className="text-xs text-muted-foreground">AI Chart Analyzer for Quotex</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6">
        <section className="mb-6">
          <h1 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
            Turn any chart screenshot into a trade read
          </h1>
          <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
            Upload a screenshot of your Quotex chart. ChartSense reads the candles, trend, and levels right in your
            browser — no account or API key needed — then returns a directional call with confidence and an educational
            breakdown.
          </p>
        </section>

        <ChartAnalyzer />

        <div className="mt-8 flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            ChartSense provides automated technical analysis for educational purposes only. It is not financial advice.
            Trading binary options carries a high risk of losing money — never trade more than you can afford to lose.
          </p>
        </div>
      </div>
    </main>
  )
}
