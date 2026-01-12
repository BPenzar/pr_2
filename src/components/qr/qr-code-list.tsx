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
import {
  QR_ERROR_CORRECTION_LEVEL,
  QR_MARGIN,
  getQrLogoDataUrl,
  getQrLogoImageSettings,
  renderQrWithLogoDataUrl,
} from '@/lib/qr-logo'

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
const PAGE_MARGIN_TOP_MM = 14.6
const QR_SIZE_MM = 50
const FOOTER_OFFSET_MM = 6
const TOP_TITLE_OFFSET_MM = 5
const TOP_SUBTITLE_GAP_MM = 4.2
const TEXT_LINE_HEIGHT = 1.15
const MM_TO_PT = 72 / 25.4
const DOWNLOAD_QR_SIZE = 2048
const TOP_TITLE_SIZE_PT = 10.3
const TOP_SUBTITLE_SIZE_PT = 7.6
const BOTTOM_TITLE_SIZE_PT = 8
const TOP_TITLE_LINES = 1
const TOP_SUBTITLE_LINES = 1
const BOTTOM_TITLE_LINES = 1

const TITLE_COLOR = rgb(0, 0, 0)

export function QRCodeList({ formId, formName }: QRCodeListProps) {
  const [showGenerator, setShowGenerator] = useState(false)
  const { data: qrCodes, isLoading } = useQRCodes(formId)
  const deleteQRCode = useDeleteQRCode()
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isEnsuringDefault, setIsEnsuringDefault] = useState(false)
  const [ensureError, setEnsureError] = useState<string | null>(null)
  const [printTopText, setPrintTopText] = useState('Feedback Collector')
  const [printTopSubtitle, setPrintTopSubtitle] = useState('')
  const [printBottomText, setPrintBottomText] = useState('Leave us your feedback.')
  const [topTitleWeight, setTopTitleWeight] = useState<'regular' | 'bold'>('bold')
  const [bottomTitleWeight, setBottomTitleWeight] = useState<'regular' | 'bold'>('regular')
  const [activePrintQr, setActivePrintQr] = useState<any | null>(null)
  const [printPreviewUrl, setPrintPreviewUrl] = useState<string | null>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [qrLogoDataUrl, setQrLogoDataUrl] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const autoEnsureRef = useRef(false)
  const printPanelRef = useRef<HTMLDivElement>(null)
  const qrImageCacheRef = useRef<{
    id: string
    bytes: ArrayBuffer
    logoDataUrl: string | null
    size: number
  } | null>(null)

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
    let isActive = true

    getQrLogoDataUrl()
      .then((dataUrl) => {
        if (isActive) {
          setQrLogoDataUrl(dataUrl)
        }
      })
      .catch((error) => {
        console.error('Failed to load QR logo:', error)
      })

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    qrImageCacheRef.current = null
  }, [qrLogoDataUrl])

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
    const startY = Math.max(0, PAGE_MARGIN_TOP_MM)
    let error: string | null = null

    if (requiredWidthMm > PAGE_WIDTH_MM) {
      error = 'Page width is too small for this layout.'
    } else if (requiredHeightMm + startY > PAGE_HEIGHT_MM) {
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

  const layoutLabel = 'A4 70 x 67.9 mm'

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

  const getDataUrlMimeType = useCallback((dataUrl: string) => {
    const match = dataUrl.match(/^data:(.*?)(;|,)/)
    return match?.[1] ?? 'image/png'
  }, [])

  const createBlobFromDataUrl = useCallback(
    (dataUrl: string) => {
      const bytes = decodeDataUrlToArrayBuffer(dataUrl)
      return new Blob([bytes], { type: getDataUrlMimeType(dataUrl) })
    },
    [decodeDataUrlToArrayBuffer, getDataUrlMimeType]
  )

  const getQrPngBytes = useCallback(async (qrCode: any) => {
    const cached = qrImageCacheRef.current
    const renderSize = 2048
    if (
      cached &&
      cached.id === qrCode.id &&
      cached.logoDataUrl === qrLogoDataUrl &&
      cached.size === renderSize
    ) {
      return cached.bytes
    }

    const baseDataUrl = await QRCode.toDataURL(qrCode.full_url, {
      width: renderSize,
      margin: QR_MARGIN,
      errorCorrectionLevel: QR_ERROR_CORRECTION_LEVEL,
    })
    const finalDataUrl = await renderQrWithLogoDataUrl(baseDataUrl, renderSize)
    const bytes = decodeDataUrlToArrayBuffer(finalDataUrl)
    qrImageCacheRef.current = {
      id: qrCode.id,
      bytes,
      logoDataUrl: qrLogoDataUrl,
      size: renderSize,
    }
    return bytes
  }, [decodeDataUrlToArrayBuffer, qrLogoDataUrl])

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
          const footerOffsetPt = FOOTER_OFFSET_MM * MM_TO_PT
          const qrSizePt = QR_SIZE_MM * MM_TO_PT
          const textPaddingPt = 1.5 * MM_TO_PT
          const maxTextWidth = labelWidthPt - 2 * textPaddingPt
          const topTitleOffsetPt = TOP_TITLE_OFFSET_MM * MM_TO_PT
          const subtitleGapPt = TOP_SUBTITLE_GAP_MM * MM_TO_PT

          const topTextValue = printTopText.trim()
          const topSubtitleValue = printTopSubtitle.trim()
          const bottomTextValue = printBottomText.trim()

          const topFont = topTitleWeight === 'bold' ? boldFont : regularFont
          const bottomFont = bottomTitleWeight === 'bold' ? boldFont : regularFont
          const subtitleFont = regularFont
          const topTextSize = topTextValue ? TOP_TITLE_SIZE_PT : 0
          const subtitleTextSize = topSubtitleValue ? TOP_SUBTITLE_SIZE_PT : 0
          const bottomTextSize = bottomTextValue ? BOTTOM_TITLE_SIZE_PT : 0
          const topMetrics = {
            ascent: topFont.heightAtSize(TOP_TITLE_SIZE_PT, { descender: false }),
            descender:
              topFont.heightAtSize(TOP_TITLE_SIZE_PT) -
              topFont.heightAtSize(TOP_TITLE_SIZE_PT, { descender: false }),
          }
          const subtitleMetrics = {
            ascent: subtitleFont.heightAtSize(TOP_SUBTITLE_SIZE_PT, { descender: false }),
            descender:
              subtitleFont.heightAtSize(TOP_SUBTITLE_SIZE_PT) -
              subtitleFont.heightAtSize(TOP_SUBTITLE_SIZE_PT, { descender: false }),
          }
          const bottomMetrics = {
            ascent: bottomFont.heightAtSize(BOTTOM_TITLE_SIZE_PT, { descender: false }),
            descender:
              bottomFont.heightAtSize(BOTTOM_TITLE_SIZE_PT) -
              bottomFont.heightAtSize(BOTTOM_TITLE_SIZE_PT, { descender: false }),
          }
          const topLines = topTextValue
            ? wrapText(topTextValue, topFont, topTextSize, maxTextWidth, TOP_TITLE_LINES)
            : []
          const subtitleLines = topSubtitleValue
            ? wrapText(
                topSubtitleValue,
                subtitleFont,
                subtitleTextSize,
                maxTextWidth,
                TOP_SUBTITLE_LINES
              )
            : []
          const bottomLines = bottomTextValue
            ? wrapText(
                bottomTextValue,
                bottomFont,
                bottomTextSize,
                maxTextWidth,
                BOTTOM_TITLE_LINES
              )
            : []
          const topLineHeight = topTextSize * TEXT_LINE_HEIGHT
          const subtitleLineHeight = subtitleTextSize * TEXT_LINE_HEIGHT
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

            const footerTopEdge = yBottom + footerOffsetPt
            const topTitleAnchorY = yTop - topTitleOffsetPt
            const subtitleBaselineY =
              subtitleLines.length > 0 ? topTitleAnchorY - subtitleGapPt : null
            const topBlockBottomEdge =
              subtitleLines.length > 0
                ? (subtitleBaselineY ?? 0) - subtitleMetrics.descender
                : topTitleAnchorY - subtitleGapPt - subtitleMetrics.descender
            const titleBaselineY =
              subtitleLines.length > 0
                ? topTitleAnchorY
                : topBlockBottomEdge + topMetrics.descender
            const availableHeight = topBlockBottomEdge - footerTopEdge
            const textQrGap = Math.max(0, (availableHeight - qrSizePt) / 2)
            const qrX = x + (labelWidthPt - qrSizePt) / 2
            const qrY = footerTopEdge + textQrGap

            page.drawImage(qrImage, {
              x: qrX,
              y: qrY,
              width: qrSizePt,
              height: qrSizePt,
            })

            if (topLines.length) {
              const topStartY = titleBaselineY + topLineHeight * (topLines.length - 1)
              topLines.forEach((lineText, index) => {
                const textWidth = topFont.widthOfTextAtSize(lineText, topTextSize)
                const textY = topStartY - topLineHeight * index
                page.drawText(lineText, {
                  x: x + (labelWidthPt - textWidth) / 2,
                  y: textY,
                  size: topTextSize,
                  font: topFont,
                  color: TITLE_COLOR,
                })
              })
            }

            if (subtitleLines.length && subtitleBaselineY !== null) {
              const subtitleStartY =
                subtitleBaselineY + subtitleLineHeight * (subtitleLines.length - 1)
              subtitleLines.forEach((lineText, index) => {
                const textWidth = subtitleFont.widthOfTextAtSize(lineText, subtitleTextSize)
                const textY = subtitleStartY - subtitleLineHeight * index
                page.drawText(lineText, {
                  x: x + (labelWidthPt - textWidth) / 2,
                  y: textY,
                  size: subtitleTextSize,
                  font: subtitleFont,
                  color: TITLE_COLOR,
                })
              })
            }

            if (bottomLines.length) {
              const bottomBaselineY =
                footerTopEdge - bottomMetrics.ascent
              bottomLines.forEach((lineText, index) => {
                const textWidth = bottomFont.widthOfTextAtSize(lineText, bottomTextSize)
                const textY = bottomBaselineY - bottomLineHeight * index
                page.drawText(lineText, {
                  x: x + (labelWidthPt - textWidth) / 2,
                  y: textY,
                  size: bottomTextSize,
                  font: bottomFont,
                  color: TITLE_COLOR,
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
    bottomTitleWeight,
    printBottomText,
    printTopText,
    printTopSubtitle,
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

  const handleDownloadQR = async (qrCode: any) => {
    try {
      const size = DOWNLOAD_QR_SIZE
      const baseDataUrl = await QRCode.toDataURL(qrCode.full_url, {
        width: size,
        margin: QR_MARGIN,
        errorCorrectionLevel: QR_ERROR_CORRECTION_LEVEL,
      })
      const finalDataUrl = await renderQrWithLogoDataUrl(baseDataUrl, size)
      const blob = createBlobFromDataUrl(finalDataUrl)
      const url = URL.createObjectURL(blob)
      const downloadLink = document.createElement('a')
      downloadLink.href = url
      downloadLink.download = `qr-code-${qrCode.location_name || qrCode.short_url}-${size}px.png`
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download QR code:', error)
    }
  }

  const handleDownloadSVG = (qrCode: any) => {
    const svg = document.querySelector(`#qr-${qrCode.id}`) as SVGElement
    if (!svg) return

    const svgClone = svg.cloneNode(true) as SVGElement
    svgClone.setAttribute('width', DOWNLOAD_QR_SIZE.toString())
    svgClone.setAttribute('height', DOWNLOAD_QR_SIZE.toString())

    const svgData = new XMLSerializer().serializeToString(svgClone)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)
    const downloadLink = document.createElement('a')
    downloadLink.href = svgUrl
    downloadLink.download = `qr-code-${qrCode.location_name || qrCode.short_url}-${DOWNLOAD_QR_SIZE}px.svg`
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
              <div className="flex flex-col gap-3">
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
                  <Label htmlFor="print-subtitle-top" className="text-xs text-muted-foreground">
                    Subtitle (top)
                  </Label>
                  <Input
                    id="print-subtitle-top"
                    type="text"
                    value={printTopSubtitle}
                    onChange={(event) => setPrintTopSubtitle(event.target.value)}
                    placeholder="e.g., Digitalizacija & Automatizacija poslovnih procesa"
                    className="h-9"
                  />
                </div>
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
                  <div className="grid gap-2">
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
                  </div>
                </div>
                <div className="grid gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Bottom title
                  </p>
                  <div className="grid gap-2">
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
                        level={QR_ERROR_CORRECTION_LEVEL}
                        includeMargin={true}
                        imageSettings={
                          qrLogoDataUrl
                            ? getQrLogoImageSettings(160, qrLogoDataUrl)
                            : undefined
                        }
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
                        onClick={() => void handleDownloadQR(qrCode)}
                        className="flex-1"
                      >
                        <DownloadIcon className="w-4 h-4 mr-1" />
                        PNG
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadSVG(qrCode)}
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
