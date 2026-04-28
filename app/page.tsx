'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { LinkIcon, SparklesIcon, CopyIcon, CheckIcon, RefreshCwIcon, MapPinIcon, InstagramIcon } from 'lucide-react'

export default function PitchAgentPage() {
  const [url, setUrl] = useState('')
  const [pitch, setPitch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const isValidUrl = (input: string) => {
    try {
      const urlObj = new URL(input)
      return urlObj.hostname.includes('google.com/maps') || 
             urlObj.hostname.includes('maps.google') ||
             urlObj.hostname.includes('goo.gl') ||
             urlObj.hostname.includes('instagram.com') ||
             urlObj.hostname.includes('instagr.am')
    } catch {
      return false
    }
  }

  const generatePitch = useCallback(async () => {
    if (!url.trim()) {
      setError('Por favor, cole um link do Google Maps ou Instagram')
      return
    }

    if (!isValidUrl(url)) {
      setError('Por favor, cole um link válido do Google Maps ou Instagram')
      return
    }

    setError('')
    setIsLoading(true)
    setPitch('')

    try {
      const response = await fetch('/api/generate-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
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
      console.error('[v0] Error generating pitch:', err)
    } finally {
      setIsLoading(false)
    }
  }, [url])

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(pitch)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('[v0] Failed to copy:', err)
    }
  }, [pitch])

  const resetForm = useCallback(() => {
    setUrl('')
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
            <span>Agente de IA para Vendas</span>
          </div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            PitchAgent
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            Cole o link do Google Maps ou Instagram de um negócio local e receba um pitch de vendas personalizado para WhatsApp
          </p>
        </header>

        {/* Main Card */}
        <Card className="border-border/50 bg-card/50 p-6 backdrop-blur-sm sm:p-8">
          {/* Step 1: Input */}
          <div className="mb-6">
            <label className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                1
              </span>
              Cole o link do negócio
            </label>
            
            <div className="relative">
              <LinkIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value)
                  setError('')
                }}
                placeholder="https://maps.google.com/... ou https://instagram.com/..."
                className="h-14 w-full rounded-lg border border-border bg-input pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                disabled={isLoading}
              />
            </div>

            {/* Platform hints */}
            <div className="mt-3 flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                <MapPinIcon className="h-3.5 w-3.5" />
                Google Maps
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                <InstagramIcon className="h-3.5 w-3.5" />
                Instagram
              </div>
            </div>

            {error && (
              <p className="mt-3 text-sm text-destructive">{error}</p>
            )}
          </div>

          {/* Generate Button */}
          <Button
            onClick={generatePitch}
            disabled={isLoading || !url.trim()}
            className="h-12 w-full gap-2 text-base font-semibold"
            size="lg"
          >
            {isLoading ? (
              <>
                <Spinner className="h-5 w-5" />
                Analisando e gerando pitch...
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
                      variant="ghost"
                      size="sm"
                      onClick={resetForm}
                      className="gap-1.5 text-muted-foreground hover:text-foreground"
                    >
                      <RefreshCwIcon className="h-4 w-4" />
                      Novo
                    </Button>
                    <Button
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
                placeholder={isLoading ? 'Analisando o negócio e gerando um pitch personalizado...' : ''}
                className="min-h-[280px] resize-none border-border bg-secondary/50 text-foreground leading-relaxed"
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
            Dica: Busque o negócio no Google Maps ou encontre o perfil no Instagram antes de colar o link aqui
          </p>
        </footer>
      </div>
    </div>
  )
}
