import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

export async function POST(req: Request) {
  const { url } = await req.json()

  if (!url) {
    return Response.json({ error: 'URL é obrigatória' }, { status: 400 })
  }

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514', {
      // Enable web search tool for Anthropic
    }),
    providerOptions: {
      anthropic: {
        thinking: { type: 'disabled' },
      },
    },
    // Use Anthropic's built-in web search capability
    tools: {
      web_search: anthropic.tools.webSearch({
        maxUses: 3,
      }),
    },
    maxSteps: 5,
    messages: [
      {
        role: 'system',
        content: `Você é o PitchAgent, um especialista em vendas de serviços de criação de websites para negócios locais no Brasil.

TAREFA:
1. Use a ferramenta de busca na web para pesquisar informações sobre o negócio na URL fornecida
2. Extraia: nome do negócio, categoria/setor, cidade, se tem website próprio, pontos fortes
3. Gere um pitch de vendas personalizado para WhatsApp

REGRAS PARA O PITCH:
- Mensagem em português brasileiro, informal mas profissional
- Comece com saudação mencionando o nome do negócio
- Demonstre conhecimento sobre o negócio deles
- Destaque benefícios específicos de ter um site para aquele tipo de negócio
- Se NÃO tem website: enfatize oportunidade de sair na frente
- Se TEM website: sugira modernização ou melhorias
- Use 2-4 emojis no máximo
- Entre 150-250 palavras
- Termine com pergunta para incentivar resposta
- Call-to-action claro mas não agressivo

FORMATO DE RESPOSTA:
Responda APENAS com o pitch pronto para copiar e colar no WhatsApp. 
Não inclua aspas, explicações, cabeçalhos ou marcações - apenas a mensagem final.`,
      },
      {
        role: 'user',
        content: `Pesquise informações sobre este negócio e gere um pitch de vendas personalizado:

URL: ${url}

Use a ferramenta de busca para encontrar informações sobre o negócio, depois gere o pitch de vendas em português brasileiro.`,
      },
    ],
  })

  return result.toTextStreamResponse()
}
