import { streamText, Output } from 'ai'
import * as z from 'zod'

const businessAnalysisSchema = z.object({
  businessName: z.string().describe('Nome do negócio'),
  category: z.string().describe('Categoria/setor do negócio (ex: restaurante, barbearia, loja de roupas)'),
  description: z.string().describe('Descrição breve do negócio baseada nas informações encontradas'),
  hasWebsite: z.boolean().describe('Se o negócio parece ter um site próprio'),
  locationCity: z.string().nullable().describe('Cidade onde está localizado'),
  highlights: z.array(z.string()).describe('Pontos fortes identificados do negócio'),
})

export async function POST(req: Request) {
  const { url } = await req.json()

  if (!url) {
    return Response.json({ error: 'URL é obrigatória' }, { status: 400 })
  }

  // First, analyze the business from the URL
  const analysisResult = await fetch('https://r.jina.ai/' + encodeURIComponent(url), {
    headers: {
      'Accept': 'text/plain',
    },
  })
  
  const pageContent = await analysisResult.text()

  // Generate structured analysis of the business
  const { output: businessAnalysis } = await import('ai').then(({ generateText, Output }) => 
    generateText({
      model: 'openai/gpt-4o-mini',
      output: Output.object({
        schema: businessAnalysisSchema,
      }),
      messages: [
        {
          role: 'system',
          content: `Você é um especialista em análise de negócios. Analise o conteúdo da página fornecida e extraia informações sobre o negócio.
          
Se for um link do Google Maps, extraia: nome do estabelecimento, categoria, se tem website próprio listado, cidade.
Se for um link do Instagram, extraia: nome do perfil/negócio, categoria baseada no conteúdo, se há link de website na bio.

Seja preciso e objetivo. Se não conseguir identificar alguma informação, use valores padrão razoáveis.`
        },
        {
          role: 'user',
          content: `URL analisada: ${url}\n\nConteúdo da página:\n${pageContent.slice(0, 15000)}`
        }
      ],
    })
  )

  // Now generate the sales pitch
  const result = streamText({
    model: 'openai/gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Você é um especialista em vendas de serviços de criação de websites para negócios locais no Brasil. 
        
Seu objetivo é criar mensagens de WhatsApp persuasivas e personalizadas para convencer donos de negócios locais a contratar um site profissional.

REGRAS IMPORTANTES:
1. A mensagem deve ser em português brasileiro, informal mas profissional
2. Comece com uma saudação personalizada mencionando o nome do negócio
3. Demonstre que você conhece o negócio deles (use as informações fornecidas)
4. Destaque os benefícios de ter um site profissional para o tipo específico de negócio
5. Se eles NÃO têm website, enfatize a oportunidade de sair na frente da concorrência
6. Se eles TÊM website, sugira uma modernização ou melhoria
7. Termine com um call-to-action claro mas não agressivo
8. Use emojis com moderação (2-4 no máximo)
9. A mensagem deve ter entre 150-250 palavras
10. Inclua uma pergunta no final para incentivar resposta

Formato: Mensagem pronta para copiar e colar no WhatsApp. Não inclua aspas ou marcações.`
      },
      {
        role: 'user',
        content: `Gere um pitch de vendas para este negócio:

Nome: ${businessAnalysis?.businessName || 'Negócio'}
Categoria: ${businessAnalysis?.category || 'Não identificada'}
Descrição: ${businessAnalysis?.description || 'Negócio local'}
Tem website próprio: ${businessAnalysis?.hasWebsite ? 'Sim' : 'Não'}
Cidade: ${businessAnalysis?.locationCity || 'Brasil'}
Pontos fortes: ${businessAnalysis?.highlights?.join(', ') || 'Não identificados'}

URL original: ${url}`
      }
    ],
  })

  return result.toTextStreamResponse()
}
