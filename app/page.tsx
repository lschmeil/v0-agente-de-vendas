'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { Input } from '@/components/ui/input'
import {
  SparklesIcon,
  CopyIcon,
  CheckIcon,
  RefreshCwIcon,
  BuildingIcon,
  TagIcon,
  MapPinIcon,
  GlobeIcon,
  FlameIcon,
  ZapIcon,
  LightbulbIcon,
  ShuffleIcon,
} from 'lucide-react'

type Tone = 'informal' | 'professional' | 'aggressive'
type Language = 'pt-br' | 'en' | 'es'
type OpportunityLevel = 'high' | 'medium' | 'low'

interface OpportunityScore {
  level: OpportunityLevel
  label: string
}

export default function PitchAgentPage() {
  const [businessName, setBusinessName] = useState('')
  const [category, setCategory] = useState('')
  const [city, setCity] = useState('')
  const [hasWebsite, setHasWebsite] = useState(false)
  const [tone, setTone] = useState<Tone>('informal')
  const [language, setLanguage] = useState<Language>('pt-br')
  const [pitch, setPitch] = useState('')
  const [opportunityScore, setOpportunityScore] = useState<OpportunityScore | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [variation, setVariation] = useState(0)

  const isFormValid = businessName.trim() && category.trim() && city.trim()

  const generatePitch = useCallback(async (useVariation = false) => {
    if (!isFormValid) {
      setError('Please fill in all required fields')
      return
    }

    setError('')
    setIsLoading(true)
    setPitch('')
    setOpportunityScore(null)

    const newVariation = useVariation ? variation + 1 : 0
    if (useVariation) {
      setVariation(newVariation)
    }

    try {
      const response = await fetch('/api/generate-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: businessName.trim(),
          category: category.trim(),
          city: city.trim(),
          hasWebsite,
          tone,
          language,
          variation: newVariation,
        }),
      })

      if (!response.ok) {
        throw new Error('Error generating pitch')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('Error processing response')
      }

      let fullPitch = ''
      let buffer = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.trim()) {
            try {
              const parsed = JSON.parse(line)
              if (parsed.type === 'score') {
                setOpportunityScore(parsed.data)
              } else if (parsed.type === 'pitch') {
                fullPitch += parsed.data
                setPitch(fullPitch)
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (err) {
      setError('An error occurred while generating the pitch. Please try again.')
      console.error('Error generating pitch:', err)
    } finally {
      setIsLoading(false)
    }
  }, [businessName, category, city, hasWebsite, tone, language, isFormValid, variation])

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(pitch)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [pitch])

  const resetForm = useCallback(() => {
    setBusinessName('')
    setCategory('')
    setCity('')
    setHasWebsite(false)
    setTone('informal')
    setLanguage('pt-br')
    setPitch('')
    setOpportunityScore(null)
    setError('')
    setCopied(false)
    setVariation(0)
  }, [])

  const getOpportunityIcon = (level: OpportunityLevel) => {
    switch (level) {
      case 'high':
        return <FlameIcon className="h-5 w-5" />
      case 'medium':
        return <ZapIcon className="h-5 w-5" />
      case 'low':
        return <LightbulbIcon className="h-5 w-5" />
    }
  }

  const getOpportunityEmoji = (level: OpportunityLevel) => {
    switch (level) {
      case 'high':
        return ''
      case 'medium':
        return ''
      case 'low':
        return ''
    }
  }

  const getOpportunityColor = (level: OpportunityLevel) => {
    switch (level) {
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'low':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    }
  }

  const getOpportunityDescription = (level: OpportunityLevel) => {
    switch (level) {
      case 'high':
        return 'Business with high conversion potential'
      case 'medium':
        return 'Good sales opportunity'
      case 'low':
        return 'May need more convincing'
    }
  }

  const toneOptions: { value: Tone; label: string; emoji: string; description: string }[] = [
    { value: 'informal', label: 'Informal', emoji: '', description: 'Friendly and relaxed' },
    { value: 'professional', label: 'Professional', emoji: '', description: 'Formal and corporate' },
    { value: 'aggressive', label: 'Aggressive', emoji: '', description: 'Direct and urgent' },
  ]

  const languageOptions: { value: Language; flag: string; label: string }[] = [
    { value: 'pt-br', flag: '', label: 'Portuguese' },
    { value: 'en', flag: '', label: 'English' },
    { value: 'es', flag: '', label: 'Spanish' },
  ]

  const charCount = pitch.length
  const isIdealForWhatsApp = charCount > 0 && charCount <= 1000

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm text-primary">
            <SparklesIcon className="h-4 w-4" />
            <span>Sales Pitch Generator</span>
          </div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            PitchAgent
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            Enter local business information and get a personalized sales pitch
            ready to send via WhatsApp
          </p>
        </header>

        {/* Main Card */}
        <Card className="border-border/50 bg-card/50 p-6 backdrop-blur-sm sm:p-8">
          {/* Step 1: Input Form */}
          <div className="mb-6">
            <label className="mb-4 flex items-center gap-2 text-sm font-medium text-foreground">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                1
              </span>
              Business Information
            </label>

            <div className="space-y-4">
              {/* Business Name */}
              <div className="relative">
                <BuildingIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={businessName}
                  onChange={(e) => {
                    setBusinessName(e.target.value)
                    setError('')
                  }}
                  placeholder="Business name (e.g., Joe's Barbershop)"
                  className="h-12 pl-12"
                  disabled={isLoading}
                />
              </div>

              {/* Category */}
              <div className="relative">
                <TagIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value)
                    setError('')
                  }}
                  placeholder="Category (e.g., Barbershop, Restaurant, Gym)"
                  className="h-12 pl-12"
                  disabled={isLoading}
                />
              </div>

              {/* City */}
              <div className="relative">
                <MapPinIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value)
                    setError('')
                  }}
                  placeholder="City (e.g., New York)"
                  className="h-12 pl-12"
                  disabled={isLoading}
                />
              </div>

              {/* Has Website Toggle */}
              <button
                type="button"
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-border bg-input p-4 text-left transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setHasWebsite(!hasWebsite)}
                disabled={isLoading}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    hasWebsite
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  <GlobeIcon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    Does the business have a website?
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {hasWebsite
                      ? 'Yes, they already have a website'
                      : 'No, they don\'t have a website yet'}
                  </p>
                </div>
                <div
                  className={`h-6 w-11 rounded-full p-0.5 transition-colors ${
                    hasWebsite ? 'bg-primary' : 'bg-border'
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full bg-white transition-transform ${
                      hasWebsite ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </button>

              {/* Pitch Language Selector */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Pitch Language</p>
                <div className="grid grid-cols-3 gap-3">
                  {languageOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setLanguage(option.value)}
                      disabled={isLoading}
                      className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                        language === option.value
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border bg-input text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }`}
                    >
                      <span className="text-2xl">{option.flag}</span>
                      <span className="text-sm font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone Selector */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Pitch Tone</p>
                <div className="grid grid-cols-3 gap-3">
                  {toneOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTone(option.value)}
                      disabled={isLoading}
                      className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                        tone === option.value
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border bg-input text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }`}
                    >
                      <span className="text-xl">{option.emoji}</span>
                      <span className="text-sm font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          </div>

          {/* Generate Button */}
          <Button
            type="button"
            onClick={() => generatePitch(false)}
            disabled={isLoading || !isFormValid}
            className="h-12 w-full gap-2 text-base font-semibold"
            size="lg"
          >
            {isLoading ? (
              <>
                <Spinner className="h-5 w-5" />
                Generating personalized pitch...
              </>
            ) : (
              <>
                <SparklesIcon className="h-5 w-5" />
                Generate Sales Pitch
              </>
            )}
          </Button>

          {/* Step 2: Output */}
          {(pitch || isLoading || opportunityScore) && (
            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    2
                  </span>
                  Pitch ready for WhatsApp
                </label>

                {pitch && !isLoading && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={resetForm}
                      className="gap-1.5 text-muted-foreground hover:text-foreground"
                    >
                      <RefreshCwIcon className="h-4 w-4" />
                      New
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={copyToClipboard}
                      className="gap-1.5"
                    >
                      {copied ? (
                        <>
                          <CheckIcon className="h-4 w-4 text-primary" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <CopyIcon className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Opportunity Score Badge */}
              {opportunityScore && (
                <div className={`mb-4 flex items-center gap-2 rounded-lg border px-4 py-3 ${getOpportunityColor(opportunityScore.level)}`}>
                  {getOpportunityIcon(opportunityScore.level)}
                  <span className="font-semibold">
                    {opportunityScore.label} {getOpportunityEmoji(opportunityScore.level)}
                  </span>
                  <span className="ml-auto text-sm opacity-80">
                    {getOpportunityDescription(opportunityScore.level)}
                  </span>
                </div>
              )}

              <Textarea
                value={pitch}
                readOnly
                placeholder={
                  isLoading
                    ? 'Generating a personalized pitch for this business...'
                    : ''
                }
                className="min-h-[280px] resize-none border-border bg-secondary/50 leading-relaxed text-foreground"
              />

              {/* Character Counter */}
              {pitch && !isLoading && (
                <div className="mt-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${isIdealForWhatsApp ? 'text-primary' : 'text-yellow-400'}`}>
                      {charCount} characters
                    </span>
                    {isIdealForWhatsApp ? (
                      <span className="text-muted-foreground">- Ideal size for WhatsApp</span>
                    ) : (
                      <span className="text-yellow-400">- Consider shortening for WhatsApp</span>
                    )}
                  </div>
                </div>
              )}

              {/* Regenerate Button */}
              {pitch && !isLoading && (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => generatePitch(true)}
                    className="flex-1 gap-2"
                  >
                    <ShuffleIcon className="h-4 w-4" />
                    Generate new variation
                  </Button>
                  <p className="text-center text-xs text-muted-foreground sm:hidden">
                    Generates a different version keeping the same data
                  </p>
                </div>
              )}

              {pitch && !isLoading && (
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  Click &quot;Copy&quot; and paste directly into WhatsApp
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Tip: Use information from Google Maps or Instagram of the business to fill in the fields
          </p>
        </footer>
      </div>
    </div>
  )
}
