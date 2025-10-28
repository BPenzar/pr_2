'use client'

import { useState, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCreateQRCode } from '@/hooks/use-qr-codes'
import { DownloadIcon, ShareIcon, CopyIcon } from 'lucide-react'

interface QRCodeGeneratorProps {
  formId: string
  formName: string
  onSuccess?: () => void
}

export function QRCodeGenerator({ formId, formName, onSuccess }: QRCodeGeneratorProps) {
  const [locationName, setLocationName] = useState('')
  const [generatedQR, setGeneratedQR] = useState<{
    shortUrl: string
    fullUrl: string
    id: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const createQRCode = useCreateQRCode()

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      const result = await createQRCode.mutateAsync({
        formId,
        locationName: locationName.trim() || undefined,
      })

      setGeneratedQR({
        shortUrl: result.shortUrl,
        fullUrl: result.fullUrl,
        id: result.id,
      })

      onSuccess?.()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDownloadSVG = () => {
    if (!svgRef.current || !generatedQR) return

    const svgData = new XMLSerializer().serializeToString(svgRef.current)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)

    const downloadLink = document.createElement('a')
    downloadLink.href = svgUrl
    downloadLink.download = `qr-code-${generatedQR.shortUrl}.svg`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
    URL.revokeObjectURL(svgUrl)
  }

  const handleDownloadPNG = () => {
    if (!svgRef.current || !generatedQR) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const svgData = new XMLSerializer().serializeToString(svgRef.current)
    const img = new Image()

    img.onload = () => {
      canvas.width = 512
      canvas.height = 512
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const downloadLink = document.createElement('a')
        downloadLink.href = url
        downloadLink.download = `qr-code-${generatedQR.shortUrl}.png`
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)
        URL.revokeObjectURL(url)
      }, 'image/png')
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  const handleCopyUrl = async () => {
    if (!generatedQR) return

    try {
      await navigator.clipboard.writeText(generatedQR.fullUrl)
      // You might want to show a toast notification here
    } catch (err) {
      console.error('Failed to copy URL:', err)
    }
  }

  const handleShare = async () => {
    if (!generatedQR) return

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Feedback Form: ${formName}`,
          text: 'Please provide your feedback by scanning this QR code or visiting the link',
          url: generatedQR.fullUrl,
        })
      } catch (err) {
        console.error('Failed to share:', err)
      }
    } else {
      // Fallback to copying URL
      handleCopyUrl()
    }
  }

  return (
    <div className="space-y-6">
      {!generatedQR ? (
        <Card>
          <CardHeader>
            <CardTitle>Generate QR Code</CardTitle>
            <CardDescription>
              Create a QR code for your form: {formName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="locationName">Location Name (optional)</Label>
                <Input
                  id="locationName"
                  placeholder="e.g., Main Entrance, Table 5, Reception Desk"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  disabled={createQRCode.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Help identify where responses are coming from
                </p>
              </div>

              <Button
                type="submit"
                disabled={createQRCode.isPending}
                className="w-full"
              >
                {createQRCode.isPending ? 'Generating...' : 'Generate QR Code'}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* QR Code Display */}
          <Card>
            <CardHeader>
              <CardTitle>Your QR Code</CardTitle>
              <CardDescription>
                Point cameras at this code to open the feedback form
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-lg border">
                <QRCodeSVG
                  ref={svgRef}
                  value={generatedQR.fullUrl}
                  size={256}
                  level="M"
                  includeMargin={true}
                />
              </div>

              <div className="text-center space-y-2">
                <p className="font-mono text-sm text-muted-foreground">
                  {generatedQR.shortUrl}
                </p>
                <p className="text-sm text-muted-foreground">
                  {generatedQR.fullUrl}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Download & Share</CardTitle>
              <CardDescription>
                Save or share your QR code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button variant="outline" onClick={handleDownloadPNG}>
                  <DownloadIcon className="w-4 h-4 mr-2" />
                  Download PNG
                </Button>
                <Button variant="outline" onClick={handleDownloadSVG}>
                  <DownloadIcon className="w-4 h-4 mr-2" />
                  Download SVG
                </Button>
                <Button variant="outline" onClick={handleCopyUrl}>
                  <CopyIcon className="w-4 h-4 mr-2" />
                  Copy URL
                </Button>
                <Button variant="outline" onClick={handleShare}>
                  <ShareIcon className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Generate Another */}
          <Card>
            <CardContent className="pt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setGeneratedQR(null)
                  setLocationName('')
                  setError(null)
                }}
                className="w-full"
              >
                Generate Another QR Code
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}