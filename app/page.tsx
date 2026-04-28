'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CheckIcon, CopyIcon, Loader2Icon, SparklesIcon, LinkIcon, ShuffleIcon, MapPinIcon, BuildingIcon, GlobeIcon } from 'lucide-react'

type Tone = 'informal' | 'professional' | 'aggressive'
type Language = 'pt-br' | 'en' | 'es'
type OpportunityLevel = 'high' | 'medium' | 'low'

interface BusinessInfo {
  name: string
  category: string
  city: string | null
  hasWebsite: boolean
  description: string
}

interface OpportunityScore {
  level: OpportunityLevel
  label: string
}

export default function PitchAgent() {
  const [url, setUrl] = useState('')
  const [tone, setTone] = useState<Tone>('informal')
  const [language, setLanguage] = useState<Language>('pt-br')
  const [pitch, setPitch] = useState('')
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null)
  const [opportunity, setOpportunity] = useState<OpportunityScore | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const isValidUrl = (input: string) => {
    const patterns = [
      /google\.(com|com\.[a-z]{2})\/maps/i,
      /maps\.google\.(com|com\.[a-z]{2})/i,
      /goo\.gl\/maps/i,
      /instagram\.com/i,
      /instagr\.am/i,
    ]
    return patterns.some(pattern => pattern.test(input))
  }

  const generatePitch = async (regenerate = false) => {
    if (!url.trim()) {
      setError('Please enter a Google Maps or Instagram URL')
      return
    }

    if (!isValidUrl(url)) {
      setError('Please enter a valid Google Maps or Instagram link')
      return
    }

    setError('')
    setIsLoading(true)
    if (!regenerate) {
      setPitch('')
      setBusinessInfo(null)
      setOpportunity(null)
    }

    try {
      const response = await fetch('/api/generate-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, tone, language }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate pitch')
      }

      const data = await response.json()
      setPitch(data.pitch)
      setBusinessInfo(data.businessInfo)
      setOpportunity(data.opportunity)
    } catch {
      setError('Failed to analyze URL and generate pitch. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(pitch)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tones: { value: Tone; label: string; icon: string }[] = [
    { value: 'informal', label: 'Informal', icon: '😊' },
    { value: 'professional', label: 'Professional', icon: '👔' },
    { value: 'aggressive', label: 'Aggressive', icon: '🎯' },
  ]

  const languages: { value: Language; label: string; flag: string }[] = [
    { value: 'pt-br', label: 'Portuguese', flag: '🇧🇷' },
    { value: 'en', label: 'English', flag: '🇺🇸' },
    { value: 'es', label: 'Spanish', flag: '🇪🇸' },
  ]

  const opportunityColors: Record<OpportunityLevel, string> = {
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  }

  const opportunityIcons: Record<OpportunityLevel, string> = {
    high: '🔥',
    medium: '⚡',
    low: '💡',
  }

  const charCount = pitch.length
  const isIdealLength = charCount > 0 && charCount <= 1000

  return (
    <main className="min-h-screen bg-background px-4 py-8 md:py-12">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-primary">
            <SparklesIcon className="h-5 w-5" />
            <span className="text-sm font-medium">AI-Powered Sales Pitch Generator</span>
          </div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            PitchAgent
          </h1>
          <p className="text-lg text-muted-foreground">
            Paste a Google Maps or Instagram link and get a personalized sales pitch ready for WhatsApp
          </p>
        </div>

        {/* Input Card */}
        <Card className="mb-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <LinkIcon className="h-5 w-5 text-primary" />
              Business URL
            </CardTitle>
            <CardDescription>
              Enter a Google Maps or Instagram link to analyze the business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* URL Input */}
            <div className="space-y-2">
              <Input
                type="url"
                placeholder="https://maps.google.com/... or https://instagram.com/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="h-12 bg-input/50 text-base"
              />
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPinIcon className="h-3 w-3" />
                  Google Maps
                </span>
                <span className="flex items-center gap-1">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  Instagram
                </span>
              </div>
            </div>

            {/* Language Selector */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <GlobeIcon className="h-4 w-4 text-primary" />
                Pitch Language
              </label>
              <div className="grid grid-cols-3 gap-2">
                {languages.map((lang) => (
                  <button
                    key={lang.value}
                    type="button"
                    onClick={() => setLanguage(lang.value)}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-medium transition-all ${
                      language === lang.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-secondary/30 text-muted-foreground hover:border-primary/50 hover:text-foreground'
                    }`}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span className="hidden sm:inline">{lang.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tone Selector */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Pitch Tone</label>
              <div className="grid grid-cols-3 gap-2">
                {tones.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTone(t.value)}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-medium transition-all ${
                      tone === t.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-secondary/30 text-muted-foreground hover:border-primary/50 hover:text-foreground'
                    }`}
                  >
                    <span>{t.icon}</span>
                    <span className="hidden sm:inline">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Generate Button */}
            <Button
              type="button"
              onClick={() => generatePitch()}
              disabled={isLoading || !url.trim()}
              className="h-12 w-full gap-2 text-base font-semibold"
            >
              {isLoading ? (
                <>
                  <Loader2Icon className="h-5 w-5 animate-spin" />
                  Analyzing URL...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-5 w-5" />
                  Generate Sales Pitch
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Business Info Card */}
        {businessInfo && !isLoading && (
          <Card className="mb-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BuildingIcon className="h-5 w-5 text-primary" />
                Business Detected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium text-foreground">{businessInfo.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-medium capitalize text-foreground">{businessInfo.category}</span>
                </div>
                {businessInfo.city && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-medium text-foreground">{businessInfo.city}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Has Website</span>
                  <span className={`font-medium ${businessInfo.hasWebsite ? 'text-yellow-400' : 'text-green-400'}`}>
                    {businessInfo.hasWebsite ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Output Card */}
        {(pitch || isLoading) && (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Generated Pitch</CardTitle>
                {pitch && !isLoading && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="gap-2"
                  >
                    {copied ? (
                      <>
                        <CheckIcon className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <CopyIcon className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Opportunity Score */}
              {opportunity && !isLoading && (
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${opportunityColors[opportunity.level]}`}
                  >
                    <span>{opportunityIcons[opportunity.level]}</span>
                    {opportunity.label}
                  </span>
                </div>
              )}

              {/* Pitch Output */}
              {isLoading ? (
                <div className="flex min-h-[200px] items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Analyzing business and generating pitch...</p>
                  </div>
                </div>
              ) : (
                <Textarea
                  value={pitch}
                  readOnly
                  className="min-h-[200px] resize-none bg-input/30 text-base leading-relaxed"
                />
              )}

              {/* Character Counter */}
              {pitch && !isLoading && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {charCount} characters
                  </span>
                  <span className={isIdealLength ? 'text-green-400' : 'text-yellow-400'}>
                    {isIdealLength ? 'Ideal for WhatsApp' : 'Consider shortening for WhatsApp'}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              {pitch && !isLoading && (
                <div className="flex flex-col gap-3 pt-2">
                  {/* WhatsApp Button */}
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(pitch)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] font-semibold text-white transition-colors hover:bg-[#20BD5A]"
                  >
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Send via WhatsApp
                  </a>

                  {/* Regenerate Button */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => generatePitch(true)}
                    className="h-11 w-full gap-2"
                  >
                    <ShuffleIcon className="h-4 w-4" />
                    Generate new variation
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-muted-foreground">
          <p>Powered by AI to help you close more deals</p>
        </footer>
      </div>
    </main>
  )
}
