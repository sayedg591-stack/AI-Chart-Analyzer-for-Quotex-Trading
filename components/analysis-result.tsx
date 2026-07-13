"use client"

import {
  ArrowDownRight,
  ArrowUpRight,
  GraduationCap,
  Minus,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  MoveRight,
  Activity,
  Layers,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { Analysis } from "@/lib/analysis"

function DirectionCard({ analysis }: { analysis: Analysis }) {
  const dir = analysis.direction
  const isUp = dir === "up"
  const isDown = dir === "down"

  const tone = isUp
    ? "border-primary/40 bg-primary/10 text-primary"
    : isDown
      ? "border-destructive/40 bg-destructive/10 text-destructive"
      : "border-border bg-muted text-muted-foreground"

  const Icon = isUp ? ArrowUpRight : isDown ? ArrowDownRight : Minus
  const label = isUp ? "UP" : isDown ? "DOWN" : "WAIT"

  return (
    <Card className={cn("border", tone)}>
      <CardContent className="flex items-center gap-4 py-5">
        <div
          className={cn(
            "flex size-14 shrink-0 items-center justify-center rounded-full",
            isUp ? "bg-primary/20" : isDown ? "bg-destructive/20" : "bg-foreground/10",
          )}
        >
          <Icon className="size-7" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-widest opacity-70">Suggested call</p>
          <p className="font-mono text-3xl font-bold leading-tight">{label}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-widest opacity-70">Confidence</p>
          <p className="font-mono text-2xl font-bold">{Math.round(analysis.confidence)}%</p>
        </div>
      </CardContent>
    </Card>
  )
}

function LevelList({
  title,
  levels,
  icon,
}: {
  title: string
  levels: string[]
  icon: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        {icon}
        <span>{title}</span>
      </div>
      {levels.length === 0 ? (
        <p className="text-sm text-muted-foreground">None clearly visible.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {levels.map((lvl, i) => (
            <li key={i} className="rounded-md bg-muted px-3 py-1.5 font-mono text-sm">
              {lvl}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function AnalysisResult({ analysis }: { analysis: Analysis }) {
  if (!analysis.isChart) {
    return (
      <Card className="border-destructive/40 bg-destructive/10">
        <CardContent className="flex items-start gap-3 py-5 text-destructive">
          <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">That doesn&apos;t look like a trading chart.</p>
            <p className="mt-1 text-sm opacity-90">
              Upload a clear screenshot of a candlestick or price chart from Quotex and try again.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const TrendIcon =
    analysis.trend === "bullish" ? TrendingUp : analysis.trend === "bearish" ? TrendingDown : MoveRight

  return (
    <div className="flex flex-col gap-4">
      <DirectionCard analysis={analysis} />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="gap-1.5 font-mono">
          {analysis.symbol}
        </Badge>
        <Badge variant="secondary" className="font-mono">
          {analysis.timeframe}
        </Badge>
        <Badge variant="outline" className="gap-1.5 capitalize">
          <TrendIcon className="size-3.5" aria-hidden />
          {analysis.trend}
        </Badge>
        <Badge variant="outline" className="font-mono">
          Expiry: {analysis.suggestedExpiry}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Market read</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">{analysis.summary}</p>
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
              <span>Signal strength</span>
              <span className="font-mono">{Math.round(analysis.confidence)}%</span>
            </div>
            <Progress value={analysis.confidence} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-5 py-5 sm:grid-cols-2">
          <LevelList
            title="Support"
            levels={analysis.supportLevels}
            icon={<TrendingUp className="size-4 text-primary" aria-hidden />}
          />
          <LevelList
            title="Resistance"
            levels={analysis.resistanceLevels}
            icon={<TrendingDown className="size-4 text-destructive" aria-hidden />}
          />
        </CardContent>
      </Card>

      {analysis.patterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="size-4" aria-hidden />
              Patterns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.patterns.map((p, i) => (
              <div key={i}>
                {i > 0 && <Separator className="mb-3" />}
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-sm text-muted-foreground">{p.implication}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {analysis.indicators.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4" aria-hidden />
              Indicators
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.indicators.map((ind, i) => (
              <div key={i} className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium">{ind.name}</span>
                <span className="text-right text-sm text-muted-foreground">{ind.reading}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="size-4" aria-hidden />
            Why this call
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">{analysis.education}</p>
        </CardContent>
      </Card>

      {analysis.risks.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <ShieldAlert className="size-4" aria-hidden />
              Risks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-muted-foreground">
              {analysis.risks.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
