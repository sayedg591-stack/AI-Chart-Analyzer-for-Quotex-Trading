"use client"

import { useCallback, useRef, useState } from "react"
import { ImageUp, Loader2, Sparkles, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Analysis } from "@/lib/analysis"
import { analyzeChartImage } from "@/lib/vision-analysis"
import { AnalysisResult } from "@/components/analysis-result"

type Status = "idle" | "loading" | "done" | "error"

const MAX_BYTES = 8 * 1024 * 1024 // 8MB
const MAX_DIM = 900 // downscale large screenshots before pixel analysis

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error("Could not read file"))
    reader.readAsDataURL(file)
  })
}

function getImageData(src: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height))
      const cw = Math.max(1, Math.round(img.width * scale))
      const ch = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement("canvas")
      canvas.width = cw
      canvas.height = ch
      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      if (!ctx) {
        reject(new Error("Canvas is not supported in this browser."))
        return
      }
      ctx.drawImage(img, 0, 0, cw, ch)
      resolve(ctx.getImageData(0, 0, cw, ch))
    }
    img.onerror = () => reject(new Error("Could not load the image."))
    img.src = src
  })
}

export function ChartAnalyzer() {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    setError(null)
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (PNG or JPG).")
      return
    }
    if (file.size > MAX_BYTES) {
      setError("Image is too large. Please use an image under 8MB.")
      return
    }
    const url = await readFileAsDataUrl(file)
    setDataUrl(url)
    setAnalysis(null)
    setStatus("idle")
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const reset = () => {
    setDataUrl(null)
    setAnalysis(null)
    setStatus("idle")
    setError(null)
    setNotes("")
    if (inputRef.current) inputRef.current.value = ""
  }

  const analyze = async () => {
    if (!dataUrl) return
    setStatus("loading")
    setError(null)
    setAnalysis(null)
    try {
      const imageData = await getImageData(dataUrl)
      // Give the loading state a beat to paint, then run the CV engine.
      await new Promise((r) => setTimeout(r, 350))
      const result = analyzeChartImage(imageData, notes.trim() || undefined)
      setAnalysis(result)
      setStatus("done")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
      setStatus("error")
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Uploader */}
      {!dataUrl ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click()
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors",
            dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40",
          )}
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
            <ImageUp className="size-6" aria-hidden />
          </div>
          <div>
            <p className="font-medium">Drop a chart screenshot</p>
            <p className="text-sm text-muted-foreground">or tap to browse — PNG or JPG, up to 8MB</p>
          </div>
        </div>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={dataUrl || "/placeholder.svg"} alt="Uploaded trading chart preview" className="max-h-72 w-full object-contain bg-black/30" />
            <Button
              size="icon"
              variant="secondary"
              onClick={reset}
              className="absolute right-2 top-2 size-8 rounded-full"
              aria-label="Remove image"
            >
              <X className="size-4" />
            </Button>
          </div>
        </Card>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />

      {dataUrl && (
        <div className="flex flex-col gap-3">
          <label htmlFor="notes" className="text-sm font-medium">
            Notes for the analyst <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. EUR/USD, 1m timeframe, looking for a scalp entry"
            rows={2}
            className="w-full resize-none rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none ring-ring/50 placeholder:text-muted-foreground focus-visible:ring-2"
          />
          <Button onClick={analyze} disabled={status === "loading"} size="lg" className="gap-2">
            {status === "loading" ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Analyzing chart…
              </>
            ) : (
              <>
                <Sparkles className="size-4" aria-hidden />
                {analysis ? "Re-analyze chart" : "Analyze chart"}
              </>
            )}
          </Button>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      )}

      {status === "loading" && (
        <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
          <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
          <p className="text-sm">Reading candles, trend structure, and levels…</p>
        </div>
      )}

      {analysis && status === "done" && <AnalysisResult analysis={analysis} />}
    </div>
  )
}
