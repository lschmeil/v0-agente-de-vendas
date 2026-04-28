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
} from 'lucide-react'

export default function PitchAgentPage() {
  const [businessName, setBusinessName] = useState('')
  const [category, setCategory] = useState('')
  const [city, setCity] = useState('')
  const [hasWebsite, setHasWebsite] = useState(false)
  const [pitch, setPitch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const isFormValid = businessName.trim() && category.trim() && city.trim()

  const generatePitch = useCallback(async () => {
    if (!isFormValid) {
      setError('Por favor, preencha todos os campos obrigatórios')
      return
    }

    setError('')
    setIsLoading(true)
    setPitch('')

    try {
      const response = await fetch('/api/generate-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: businessName.trim(),
          category: category.trim(),
          city: city.trim(),
          hasWebsite,
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
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        fullPitch += chunk
        setPitch(fullPitch)
      }
    } catch (err) {
      setError('Ocorreu um erro ao gerar o pitch. Tente novamente.')
      console.error('Error generating pitch:', err)
    } finally {
      setIsLoading(false)
    }
  }, [businessName, category, city, hasWebsite, isFormValid])

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
    setPitch('')
    setError('')
    setCopied(false)
  }, [])

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
            </div>

            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          </div>

          {/* Generate Button */}
          <Button
            type="button"
            onClick={generatePitch}
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
          {(pitch || isLoading) && (
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

              {pitch && !isLoading && (
                <p className="mt-3 text-center text-sm text-muted-foreground">
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
