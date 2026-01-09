'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { QRCodeSVG } from 'qrcode.react'
import QRCode from 'qrcode'
import { useQRCodes, useDeleteQRCode } from '@/hooks/use-qr-codes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { QRCodeGenerator } from './qr-code-generator'
import { QrCodeIcon, PlusIcon, TrashIcon, EyeIcon, DownloadIcon, PrinterIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ensureDefaultQRCode } from '@/lib/qr-codes'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

interface QRCodeListProps {
  formId: string
  formName: string
}

const PAGE_WIDTH_MM = 210
const PAGE_HEIGHT_MM = 297
const LABEL_COLS = 3
const LABEL_ROWS = 4
const LABEL_WIDTH_MM = 70
const LABEL_HEIGHT_MM = 67.7
const QR_SIZE_MM = 50
const HEADER_OFFSET_MM = 6
const FOOTER_OFFSET_MM = 6
const QR_TEXT_GAP_MM = 3.5
const TEXT_SIZE_MIN = 6
const TEXT_SIZE_MAX = 16
const TEXT_LINE_HEIGHT = 1.15
const MAX_TITLE_LINES = 2
const MM_TO_PT = 72 / 25.4

const TITLE_COLORS = {
  black: rgb(0, 0, 0),
  gray: rgb(0.2, 0.2, 0.2),
  blue: rgb(0.1, 0.2, 0.6),
  red: rgb(0.7, 0.15, 0.15),
}

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const clampLines = (value: number) => clampNumber(value, 1, MAX_TITLE_LINES)

const clampTextSize = (value: number, lines: number, offsetMm: number) => {
  if (lines <= 1) {
    return clampNumber(value, TEXT_SIZE_MIN, TEXT_SIZE_MAX)
  }

  const offsetPt = offsetMm * MM_TO_PT
  const maxSize = Math.min(TEXT_SIZE_MAX, offsetPt / (TEXT_LINE_HEIGHT * (lines - 1)))
  return clampNumber(value, TEXT_SIZE_MIN, maxSize)
}

export function QRCodeList({ formId, formName }: QRCodeListProps) {
  const [showGenerator, setShowGenerator] = useState(false)
  const { data: qrCodes, isLoading } = useQRCodes(formId)
  const deleteQRCode = useDeleteQRCode()
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isEnsuringDefault, setIsEnsuringDefault] = useState(false)
  const [ensureError, setEnsureError] = useState<string | null>(null)
  const [downloadSize, setDownloadSize] = useState(512)
  const [printTopText, setPrintTopText] = useState('Feedback Collector')
  const [printBottomText, setPrintBottomText] = useState('Leave us your feedback.')
  const [topTitleWeight, setTopTitleWeight] = useState<'regular' | 'bold'>('bold')
  const [bottomTitleWeight, setBottomTitleWeight] = useState<'regular' | 'bold'>('regular')
  const [topTitleColor, setTopTitleColor] = useState<keyof typeof TITLE_COLORS>('black')
  const [bottomTitleColor, setBottomTitleColor] = useState<keyof typeof TITLE_COLORS>('black')
  const [topTitleLines, setTopTitleLines] = useState(1)
  const [bottomTitleLines, setBottomTitleLines] = useState(1)
  const [topTitleSize, setTopTitleSize] = useState(9)
  const [bottomTitleSize, setBottomTitleSize] = useState(8)
  const [activePrintQr, setActivePrintQr] = useState<any | null>(null)
  const [printPreviewUrl, setPrintPreviewUrl] = useState<string | null>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const autoEnsureRef = useRef(false)
  const printPanelRef = useRef<HTMLDivElement>(null)
  const qrImageCacheRef = useRef<{ id: string; bytes: ArrayBuffer } | null>(null)

  const handleEnsureDefault = useCallback(async () => {
    if (isEnsuringDefault) return

    setIsEnsuringDefault(true)
    setEnsureError(null)

    try {
      await ensureDefaultQRCode(formId)
      await queryClient.invalidateQueries({ queryKey: ['qr-codes', formId] })
    } catch (error: any) {
      const message = error?.message ?? 'Failed to generate default QR code'
      setEnsureError(message)
    } finally {
      setIsEnsuringDefault(false)
    }
  }, [formId, isEnsuringDefault, queryClient])

  useEffect(() => {
    if (isLoading) return
    if (qrCodes && qrCodes.length > 0) return
    if (autoEnsureRef.current) return

    autoEnsureRef.current = true
    void handleEnsureDefault()
  }, [handleEnsureDefault, isLoading, qrCodes])

  useEffect(() => {
    if (qrCodes && qrCodes.length > 0) {
      autoEnsureRef.current = false
    }
  }, [qrCodes])

  useEffect(() => {
    if (!copiedId) return
    const timer = setTimeout(() => setCopiedId(null), 2000)
    return () => clearTimeout(timer)
  }, [copiedId])

  const totalCodes = qrCodes?.length ?? 0

  const handleDelete = async (qrCodeId: string) => {
    try {
      await deleteQRCode.mutateAsync({ id: qrCodeId, formId })
    } catch (error) {
      console.error('Failed to delete QR code:', error)
    } finally {
      setConfirmDeleteId(null)
    }
  }

  const handleCopyUrl = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(id)
    } catch (error) {
      console.error('Failed to copy URL:', error)
    }
  }

  const layoutSettings = useMemo(() => {
    const rows = LABEL_ROWS
    const cols = LABEL_COLS
    const labelWidthMm = LABEL_WIDTH_MM
    const labelHeightMm = LABEL_HEIGHT_MM
    const labelsPerSheet = rows * cols
    const requiredWidthMm = labelWidthMm * cols
    const requiredHeightMm = labelHeightMm * rows
    const startX = Math.max(0, (PAGE_WIDTH_MM - requiredWidthMm) / 2)
    const startY = Math.max(0, (PAGE_HEIGHT_MM - requiredHeightMm) / 2)
    let error: string | null = null

    if (requiredWidthMm > PAGE_WIDTH_MM) {
      error = 'Page width is too small for this layout.'
    } else if (requiredHeightMm > PAGE_HEIGHT_MM) {
      error = 'Page height is too small for this layout.'
    }

    return {
      rows,
      cols,
      labelWidthMm,
      labelHeightMm,
      labelsPerSheet,
      startX,
      startY,
      gap: 0,
      requiredWidthMm,
      requiredHeightMm,
      error,
    }
  }, [])

  const labelsPerSheet = layoutSettings.labelsPerSheet

  const pdfFileName = useMemo(() => {
    if (!activePrintQr) return 'qr-stickers.pdf'
    const raw = String(activePrintQr.location_name || activePrintQr.short_url || 'qr')
    const safe = raw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    return `qr-stickers-${safe || 'qr'}.pdf`
  }, [activePrintQr])

  const layoutLabel = 'A4 70 x 67.7 mm'

  const updatePreviewUrl = useCallback((nextUrl: string | null) => {
    setPrintPreviewUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev)
      }
      return nextUrl
    })
  }, [])

  const decodeDataUrlToArrayBuffer = useCallback((dataUrl: string) => {
    const [, meta, data] = dataUrl.match(/^data:(.*?),(.*)$/) ?? []
    if (!meta || !data) {
      throw new Error('Invalid data URL')
    }

    if (meta.includes(';base64')) {
      const binary = atob(data)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i)
      }
      return bytes.buffer
    }

    const decoded = decodeURIComponent(data)
    const bytes = new Uint8Array(decoded.length)
    for (let i = 0; i < decoded.length; i += 1) {
      bytes[i] = decoded.charCodeAt(i)
    }
    return bytes.buffer
  }, [])

  const getQrPngBytes = useCallback(async (qrCode: any) => {
    const cached = qrImageCacheRef.current
    if (cached && cached.id === qrCode.id) {
      return cached.bytes
    }

    const dataUrl = await QRCode.toDataURL(qrCode.full_url, {
      width: 1024,
      margin: 2,
      errorCorrectionLevel: 'M',
    })
    const bytes = decodeDataUrlToArrayBuffer(dataUrl)
    qrImageCacheRef.current = { id: qrCode.id, bytes }
    return bytes
  }, [decodeDataUrlToArrayBuffer])

  const wrapText = useCallback(
    (text: string, font: any, fontSize: number, maxWidth: number, maxLines: number) => {
      const words = text.split(/\s+/).filter(Boolean)
      const lines: string[] = []
      let line = ''
      let overflow = false

      const addEllipsis = (value: string) => {
        const ellipsis = '...'
        let trimmed = value.trim()
        while (trimmed && font.widthOfTextAtSize(trimmed + ellipsis, fontSize) > maxWidth) {
          trimmed = trimmed.slice(0, -1)
        }
        return trimmed ? `${trimmed}${ellipsis}` : ellipsis
      }

      const pushLine = (value: string) => {
        if (lines.length < maxLines) {
          lines.push(value)
          return true
        }
        overflow = true
        return false
      }

      for (const word of words) {
        const next = line ? `${line} ${word}` : word
        if (font.widthOfTextAtSize(next, fontSize) <= maxWidth) {
          line = next
          continue
        }

        if (line) {
          if (!pushLine(line)) break
          line = ''
        }

        if (font.widthOfTextAtSize(word, fontSize) <= maxWidth) {
          line = word
          continue
        }

        let fragment = ''
        for (const char of word) {
          const testFragment = fragment + char
          if (font.widthOfTextAtSize(testFragment, fontSize) <= maxWidth) {
            fragment = testFragment
          } else {
            if (!pushLine(fragment)) break
            fragment = char
          }
        }
        line = fragment
        if (overflow) break
      }

      if (!overflow && line) {
        pushLine(line)
      }

      if (overflow && lines.length) {
        lines[lines.length - 1] = addEllipsis(lines[lines.length - 1])
      }

      return lines
    },
    []
  )

  useEffect(() => {
    if (!activePrintQr) {
      setPdfError(null)
      setIsGeneratingPdf(false)
      updatePreviewUrl(null)
      return
    }

    const timeout = setTimeout(() => {
      const generatePdf = async () => {
        setIsGeneratingPdf(true)
        setPdfError(null)

        try {
          if (layoutSettings.error) {
            throw new Error(layoutSettings.error)
          }

          if (layoutSettings.labelsPerSheet <= 0) {
            throw new Error('No labels fit on the page.')
          }

          const totalLabels = layoutSettings.labelsPerSheet

          const qrBytes = await getQrPngBytes(activePrintQr)
          const pdfDoc = await PDFDocument.create()
          const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
          const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
          const qrImage = await pdfDoc.embedPng(qrBytes)

          const pageWidthPt = PAGE_WIDTH_MM * MM_TO_PT
          const pageHeightPt = PAGE_HEIGHT_MM * MM_TO_PT
          const startXPt = layoutSettings.startX * MM_TO_PT
          const startYPt = layoutSettings.startY * MM_TO_PT
          const gapPt = layoutSettings.gap * MM_TO_PT
          const labelWidthPt = layoutSettings.labelWidthMm * MM_TO_PT
          const labelHeightPt = layoutSettings.labelHeightMm * MM_TO_PT
          const headerOffsetPt = HEADER_OFFSET_MM * MM_TO_PT
          const footerOffsetPt = FOOTER_OFFSET_MM * MM_TO_PT
          const qrSizePt = QR_SIZE_MM * MM_TO_PT
          const qrGapPt = QR_TEXT_GAP_MM * MM_TO_PT
          const textPaddingPt = 1.5 * MM_TO_PT
          const maxTextWidth = labelWidthPt - 2 * textPaddingPt

          const topTextValue = printTopText.trim()
          const bottomTextValue = printBottomText.trim()

          const topFont = topTitleWeight === 'bold' ? boldFont : regularFont
          const bottomFont = bottomTitleWeight === 'bold' ? boldFont : regularFont
          const topTextSize = topTextValue
            ? clampTextSize(topTitleSize, topTitleLines, HEADER_OFFSET_MM)
            : 0
          const bottomTextSize = bottomTextValue
            ? clampTextSize(bottomTitleSize, bottomTitleLines, FOOTER_OFFSET_MM)
            : 0
          const topLines = topTextValue
            ? wrapText(topTextValue, topFont, topTextSize, maxTextWidth, topTitleLines)
            : []
          const bottomLines = bottomTextValue
            ? wrapText(
                bottomTextValue,
                bottomFont,
                bottomTextSize,
                maxTextWidth,
                bottomTitleLines
              )
            : []
          const topLineHeight = topTextSize * TEXT_LINE_HEIGHT
          const bottomLineHeight = bottomTextSize * TEXT_LINE_HEIGHT

          let pageIndex = -1

          for (let labelIndex = 0; labelIndex < totalLabels; labelIndex++) {
            if (labelIndex % layoutSettings.labelsPerSheet === 0) {
              pdfDoc.addPage([pageWidthPt, pageHeightPt])
              pageIndex++
            }

            const page = pdfDoc.getPage(pageIndex)
            const localIndex = labelIndex % layoutSettings.labelsPerSheet
            const row = Math.floor(localIndex / layoutSettings.cols)
            const col = localIndex % layoutSettings.cols

            const x = startXPt + col * (labelWidthPt + gapPt)
            const yTop = pageHeightPt - startYPt - row * (labelHeightPt + gapPt)
            const yBottom = yTop - labelHeightPt

            const headerY = yTop - headerOffsetPt
            const footerY = yBottom + footerOffsetPt
            const qrCenterY = (headerY - qrGapPt + footerY + qrGapPt) / 2
            const qrX = x + (labelWidthPt - qrSizePt) / 2
            const qrY = qrCenterY - qrSizePt / 2

            page.drawImage(qrImage, {
              x: qrX,
              y: qrY,
              width: qrSizePt,
              height: qrSizePt,
            })

            if (topLines.length) {
              const topStartY = headerY + topLineHeight * (topLines.length - 1)
              topLines.forEach((lineText, index) => {
                const textWidth = topFont.widthOfTextAtSize(lineText, topTextSize)
                const textY = topStartY - topLineHeight * index
                page.drawText(lineText, {
                  x: x + (labelWidthPt - textWidth) / 2,
                  y: textY,
                  size: topTextSize,
                  font: topFont,
                  color: TITLE_COLORS[topTitleColor],
                })
              })
            }

            if (bottomLines.length) {
              bottomLines.forEach((lineText, index) => {
                const textWidth = bottomFont.widthOfTextAtSize(lineText, bottomTextSize)
                const textY = footerY - bottomLineHeight * index
                page.drawText(lineText, {
                  x: x + (labelWidthPt - textWidth) / 2,
                  y: textY,
                  size: bottomTextSize,
                  font: bottomFont,
                  color: TITLE_COLORS[bottomTitleColor],
                })
              })
            }
          }

          const pdfBytes = await pdfDoc.save()
          const pdfBuffer = Uint8Array.from(pdfBytes).buffer
          const blob = new Blob([pdfBuffer], { type: 'application/pdf' })
          const url = URL.createObjectURL(blob)
          updatePreviewUrl(url)
        } catch (error: any) {
          console.error('Failed to generate PDF preview:', error)
          setPdfError(error?.message ?? 'Failed to generate PDF preview.')
          updatePreviewUrl(null)
        } finally {
          setIsGeneratingPdf(false)
        }
      }

      void generatePdf()
    }, 200)

    return () => clearTimeout(timeout)
  }, [
    activePrintQr,
    getQrPngBytes,
    layoutSettings,
    bottomTitleColor,
    bottomTitleLines,
    bottomTitleSize,
    bottomTitleWeight,
    printBottomText,
    printTopText,
    topTitleColor,
    topTitleLines,
    topTitleSize,
    topTitleWeight,
    updatePreviewUrl,
    wrapText,
  ])

  useEffect(() => {
    if (!activePrintQr) return
    const timer = setTimeout(() => {
      printPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
    return () => clearTimeout(timer)
  }, [activePrintQr])

  const handleDownloadQR = (qrCode: any, size: number) => {
    const svg = document.querySelector(`#qr-${qrCode.id}`) as SVGElement
    if (!svg) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const img = new Image()

    img.onload = () => {
      canvas.width = size
      canvas.height = size
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const downloadLink = document.createElement('a')
        downloadLink.href = url
        downloadLink.download = `qr-code-${qrCode.location_name || qrCode.short_url}-${size}px.png`
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)
        URL.revokeObjectURL(url)
      }, 'image/png')
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  const handleDownloadSVG = (qrCode: any, size: number) => {
    const svg = document.querySelector(`#qr-${qrCode.id}`) as SVGElement
    if (!svg) return

    const svgClone = svg.cloneNode(true) as SVGElement
    svgClone.setAttribute('width', size.toString())
    svgClone.setAttribute('height', size.toString())

    const svgData = new XMLSerializer().serializeToString(svgClone)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)
    const downloadLink = document.createElement('a')
    downloadLink.href = svgUrl
    downloadLink.download = `qr-code-${qrCode.location_name || qrCode.short_url}-${size}px.svg`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
    URL.revokeObjectURL(svgUrl)
  }

  const togglePrintSheet = (qrCode: any) => {
    setActivePrintQr((current: any) => (current?.id === qrCode.id ? null : qrCode))
  }

  const handleDownloadPdf = () => {
    if (!printPreviewUrl) return
    const downloadLink = document.createElement('a')
    downloadLink.href = printPreviewUrl
    downloadLink.download = pdfFileName
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
        <div className="h-32 bg-gray-200 animate-pulse rounded"></div>
      </div>
    )
  }

  if (showGenerator) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold">Generate QR Code</h3>
          <Button
            variant="outline"
            onClick={() => setShowGenerator(false)}
          >
            Back to List
          </Button>
        </div>
        <QRCodeGenerator
          formId={formId}
          formName={formName}
          onSuccess={() => setShowGenerator(false)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">QR Codes</h3>
          <p className="text-sm text-muted-foreground">
            Manage QR codes for {formName}
          </p>
        </div>
        <Button
          onClick={() => setShowGenerator(true)}
          disabled={isEnsuringDefault}
          className="w-full sm:w-auto"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          {qrCodes && qrCodes.length > 0 ? 'Generate Additional QR Code' : 'Generate QR Code'}
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-white p-3">
        <Label htmlFor="download-size" className="text-xs text-muted-foreground">
          Download size
        </Label>
        <select
          id="download-size"
          className="h-9 rounded-md border border-input bg-background px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={downloadSize}
          onChange={(event) => setDownloadSize(Number(event.target.value))}
        >
          <option value={256}>256px</option>
          <option value={512}>512px</option>
          <option value={1024}>1024px</option>
        </select>
      </div>

      {isEnsuringDefault && (
        <Alert>
          <AlertDescription>
            Generating a default QR code for this form...
          </AlertDescription>
        </Alert>
      )}

      {totalCodes === 1 && !isEnsuringDefault && !ensureError && (
        <Alert>
          <AlertDescription>
            Each form keeps one default QR code so links you have shared stay active. Generate additional QR codes for different locations—any extra code can be removed later.
          </AlertDescription>
        </Alert>
      )}

      {ensureError && (
        <Alert variant="destructive">
          <AlertDescription className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <span>{ensureError}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleEnsureDefault}
              disabled={isEnsuringDefault}
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {activePrintQr && (
        <Card ref={printPanelRef} className="border-slate-200">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">Sticker Print Sheet (PDF)</CardTitle>
                <CardDescription>
                  {activePrintQr.location_name || activePrintQr.short_url || 'QR code'}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setActivePrintQr(null)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor="print-title-top" className="text-xs text-muted-foreground">
                  Title (top)
                </Label>
                <Input
                  id="print-title-top"
                  type="text"
                  value={printTopText}
                  onChange={(event) => setPrintTopText(event.target.value)}
                  placeholder="e.g., Scan for feedback"
                  className="h-9"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="print-title-bottom" className="text-xs text-muted-foreground">
                  Title (bottom)
                </Label>
                <Input
                  id="print-title-bottom"
                  type="text"
                  value={printBottomText}
                  onChange={(event) => setPrintBottomText(event.target.value)}
                  placeholder="e.g., Thank you!"
                  className="h-9"
                />
              </div>
            </div>
            <details className="rounded-lg border bg-slate-50 p-3">
              <summary className="cursor-pointer text-sm font-medium text-slate-700">
                Title options
              </summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Top title
                  </p>
                  <div className="grid gap-2 sm:grid-cols-4">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="top-title-weight" className="text-xs text-muted-foreground">
                        Weight
                      </Label>
                      <select
                        id="top-title-weight"
                        className="h-9 rounded-md border border-input bg-background px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={topTitleWeight}
                        onChange={(event) =>
                          setTopTitleWeight(event.target.value as 'regular' | 'bold')
                        }
                      >
                        <option value="regular">Regular</option>
                        <option value="bold">Bold</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="top-title-size" className="text-xs text-muted-foreground">
                        Size (pt)
                      </Label>
                      <Input
                        id="top-title-size"
                        type="number"
                        min={TEXT_SIZE_MIN}
                        max={TEXT_SIZE_MAX}
                        step="0.5"
                        value={topTitleSize}
                        onChange={(event) => {
                          const next = Number(event.target.value)
                          setTopTitleSize(
                            clampTextSize(
                              Number.isFinite(next) ? next : TEXT_SIZE_MIN,
                              topTitleLines,
                              HEADER_OFFSET_MM
                            )
                          )
                        }}
                        className="h-9"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="top-title-color" className="text-xs text-muted-foreground">
                        Color
                      </Label>
                      <select
                        id="top-title-color"
                        className="h-9 rounded-md border border-input bg-background px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={topTitleColor}
                        onChange={(event) =>
                          setTopTitleColor(event.target.value as keyof typeof TITLE_COLORS)
                        }
                      >
                        <option value="black">Black</option>
                        <option value="gray">Dark gray</option>
                        <option value="blue">Blue</option>
                        <option value="red">Red</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="top-title-lines" className="text-xs text-muted-foreground">
                        Lines
                      </Label>
                      <select
                        id="top-title-lines"
                        className="h-9 rounded-md border border-input bg-background px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={topTitleLines}
                        onChange={(event) => {
                          const nextLines = clampLines(Number(event.target.value))
                          setTopTitleLines(nextLines)
                          setTopTitleSize((current) =>
                            clampTextSize(current, nextLines, HEADER_OFFSET_MM)
                          )
                        }}
                      >
                        <option value={1}>1 line</option>
                        <option value={2}>2 lines</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="grid gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Bottom title
                  </p>
                  <div className="grid gap-2 sm:grid-cols-4">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="bottom-title-weight" className="text-xs text-muted-foreground">
                        Weight
                      </Label>
                      <select
                        id="bottom-title-weight"
                        className="h-9 rounded-md border border-input bg-background px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={bottomTitleWeight}
                        onChange={(event) =>
                          setBottomTitleWeight(event.target.value as 'regular' | 'bold')
                        }
                      >
                        <option value="regular">Regular</option>
                        <option value="bold">Bold</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="bottom-title-size" className="text-xs text-muted-foreground">
                        Size (pt)
                      </Label>
                      <Input
                        id="bottom-title-size"
                        type="number"
                        min={TEXT_SIZE_MIN}
                        max={TEXT_SIZE_MAX}
                        step="0.5"
                        value={bottomTitleSize}
                        onChange={(event) => {
                          const next = Number(event.target.value)
                          setBottomTitleSize(
                            clampTextSize(
                              Number.isFinite(next) ? next : TEXT_SIZE_MIN,
                              bottomTitleLines,
                              FOOTER_OFFSET_MM
                            )
                          )
                        }}
                        className="h-9"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="bottom-title-color" className="text-xs text-muted-foreground">
                        Color
                      </Label>
                      <select
                        id="bottom-title-color"
                        className="h-9 rounded-md border border-input bg-background px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={bottomTitleColor}
                        onChange={(event) =>
                          setBottomTitleColor(event.target.value as keyof typeof TITLE_COLORS)
                        }
                      >
                        <option value="black">Black</option>
                        <option value="gray">Dark gray</option>
                        <option value="blue">Blue</option>
                        <option value="red">Red</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="bottom-title-lines" className="text-xs text-muted-foreground">
                        Lines
                      </Label>
                      <select
                        id="bottom-title-lines"
                        className="h-9 rounded-md border border-input bg-background px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={bottomTitleLines}
                        onChange={(event) => {
                          const nextLines = clampLines(Number(event.target.value))
                          setBottomTitleLines(nextLines)
                          setBottomTitleSize((current) =>
                            clampTextSize(current, nextLines, FOOTER_OFFSET_MM)
                          )
                        }}
                      >
                        <option value={1}>1 line</option>
                        <option value={2}>2 lines</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </details>

            <div className="rounded-lg border bg-white p-3">
              <div className="aspect-[210/297] w-full overflow-hidden rounded-md border bg-gray-50">
                {isGeneratingPdf ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Generating PDF preview...
                  </div>
                ) : pdfError ? (
                  <div className="flex h-full items-center justify-center text-sm text-red-600">
                    {pdfError}
                  </div>
                ) : printPreviewUrl ? (
                  <iframe
                    title="Sticker sheet preview"
                    className="h-full w-full"
                    src={printPreviewUrl}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Preview not available yet.
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                {layoutLabel} • {labelsPerSheet || 0} labels per sheet • {layoutSettings.labelWidthMm.toFixed(1)} x {layoutSettings.labelHeightMm.toFixed(1)} mm
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  variant="outline"
                  onClick={() => setActivePrintQr(null)}
                >
                  Close
                </Button>
                <Button
                  onClick={handleDownloadPdf}
                  disabled={!printPreviewUrl || isGeneratingPdf}
                >
                  Download PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!qrCodes || qrCodes.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-12">
            <div className="text-center">
              <QrCodeIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No QR codes yet</h3>
              <p className="text-gray-600 mb-6">
                Generate your first QR code to start collecting feedback
              </p>
              <Button onClick={() => setShowGenerator(true)}>
                <PlusIcon className="w-4 h-4 mr-2" />
                Generate First QR Code
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {qrCodes.map((qrCode) => {
            const isOnlyQRCode = totalCodes === 1
            const isDefaultCode = (qrCode.location_name || '').toLowerCase() === 'default'

            return (
              <Card key={qrCode.id}>
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">
                        {qrCode.location_name || 'Unnamed Location'}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {qrCode.short_url}
                      </CardDescription>
                    </div>
                    {isDefaultCode ? (
                      <Badge variant="outline" className="text-xs uppercase tracking-wide">
                        Default
                      </Badge>
                    ) : confirmDeleteId === qrCode.id ? (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(qrCode.id)}
                          disabled={deleteQRCode.isPending}
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={deleteQRCode.isPending}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmDeleteId(qrCode.id)}
                        disabled={deleteQRCode.isPending}
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* QR Code Visual */}
                    <div className="flex justify-center bg-white p-4 rounded-lg border">
                      <QRCodeSVG
                        id={`qr-${qrCode.id}`}
                        value={qrCode.full_url}
                        size={160}
                        level="M"
                        includeMargin={true}
                      />
                    </div>

                    {/* QR Code Stats */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">Scans</span>
                      <Badge variant="secondary">
                        {qrCode.scan_count}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">Created</span>
                      <span className="text-sm">
                        {formatDistanceToNow(new Date(qrCode.created_at))} ago
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(qrCode.full_url, '_blank')}
                        className="flex-1"
                      >
                        <EyeIcon className="w-4 h-4 mr-1" />
                        Live
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadQR(qrCode, downloadSize)}
                        className="flex-1"
                      >
                        <DownloadIcon className="w-4 h-4 mr-1" />
                        PNG
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadSVG(qrCode, downloadSize)}
                        className="flex-1"
                      >
                        <DownloadIcon className="w-4 h-4 mr-1" />
                        SVG
                      </Button>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePrintSheet(qrCode)}
                        className="flex-1"
                      >
                        <PrinterIcon className="w-4 h-4 mr-1" />
                        Sticker Print Sheet (PDF)
                      </Button>
                    </div>

                    {/* URL Display */}
                    <div className="text-xs text-muted-foreground font-mono bg-gray-50 p-2 rounded break-all">
                      {qrCode.full_url}
                    </div>
                    {copiedId === qrCode.id && (
                      <div className="text-xs text-green-600">Link copied to clipboard</div>
                    )}
                    {confirmDeleteId === qrCode.id && (
                      <div className="text-xs text-red-600">
                        Deleting removes this QR code permanently. Printed codes will stop working.
                      </div>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleCopyUrl(qrCode.id, qrCode.full_url)}
                      className="w-full"
                    >
                      Copy Link
                    </Button>
                    {isOnlyQRCode && (
                      <p className="text-xs text-muted-foreground text-center">
                        This default QR code stays active so your shared links keep working. Create additional codes for different locations and delete those extras any time.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
