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
type Language = 'pt-br' | 'en' | 'es' | 'es-ar'
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
  const [pitch, setPitch] = useState('')
  const [opportunityScore, setOpportunityScore] = useState<OpportunityScore | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [variation, setVariation] = useState(0)

  const isFormValid = businessName.trim() && category.trim() && city.trim()

  const generatePitch = useCallback(async (useVariation = false) => {
    if (!isFormValid) {
      setError('Por favor, preencha todos os campos obrigatórios')
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
          variation: newVariation,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao gerar pitch')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('Erro ao processar resposta')
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
      setError('Ocorreu um erro ao gerar o pitch. Tente novamente.')
      console.error('Error generating pitch:', err)
    } finally {
      setIsLoading(false)
    }
  }, [businessName, category, city, hasWebsite, tone, isFormValid, variation])

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
        return '🔥'
      case 'medium':
        return '⚡'
      case 'low':
        return '💡'
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

  const toneOptions: { value: Tone; label: string; emoji: string; description: string }[] = [
    { value: 'informal', label: 'Informal', emoji: '😊', description: 'Amigável e descontraído' },
    { value: 'professional', label: 'Profissional', emoji: '👔', description: 'Formal e corporativo' },
    { value: 'aggressive', label: 'Agressivo', emoji: '🎯', description: 'Direto e urgente' },
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
            <span>Gerador de Pitch para Vendas</span>
          </div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            PitchAgent
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            Preencha as informações do negócio local e receba um pitch de vendas
            personalizado para WhatsApp
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
              Informações do negócio
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
                  placeholder="Nome do negócio (ex: Barbearia do João)"
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
                  placeholder="Categoria (ex: Barbearia, Restaurante, Academia)"
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
                  placeholder="Cidade (ex: São Paulo)"
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
                    O negócio já tem website?
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {hasWebsite
                      ? 'Sim, já possui um site'
                      : 'Não, ainda não tem site'}
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

              {/* Tone Selector */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Tom do pitch</p>
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
                Gerando pitch personalizado...
              </>
            ) : (
              <>
                <SparklesIcon className="h-5 w-5" />
                Gerar Pitch de Vendas
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
                  Pitch pronto para WhatsApp
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
                      Novo
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
                          Copiado!
                        </>
                      ) : (
                        <>
                          <CopyIcon className="h-4 w-4" />
                          Copiar
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
                    {opportunityScore.level === 'high' && 'Negócio com alto potencial de conversão'}
                    {opportunityScore.level === 'medium' && 'Boa oportunidade de venda'}
                    {opportunityScore.level === 'low' && 'Pode precisar de mais convencimento'}
                  </span>
                </div>
              )}

              <Textarea
                value={pitch}
                readOnly
                placeholder={
                  isLoading
                    ? 'Gerando um pitch personalizado para este negócio...'
                    : ''
                }
                className="min-h-[280px] resize-none border-border bg-secondary/50 leading-relaxed text-foreground"
              />

              {/* Character Counter */}
              {pitch && !isLoading && (
                <div className="mt-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${isIdealForWhatsApp ? 'text-primary' : 'text-yellow-400'}`}>
                      {charCount} caracteres
                    </span>
                    {isIdealForWhatsApp ? (
                      <span className="text-muted-foreground">- Tamanho ideal para WhatsApp</span>
                    ) : (
                      <span className="text-yellow-400">- Considere reduzir para WhatsApp</span>
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
                    Gerar nova variação
                  </Button>
                  <p className="text-center text-xs text-muted-foreground sm:hidden">
                    Gera uma versão diferente mantendo os mesmos dados
                  </p>
                </div>
              )}

              {pitch && !isLoading && (
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  Clique em &quot;Copiar&quot; e cole diretamente no WhatsApp
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Dica: Use informações do Google Maps ou Instagram do negócio para preencher os campos
          </p>
        </footer>
      </div>
    </div>
  )
}
