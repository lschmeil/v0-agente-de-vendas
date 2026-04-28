import { streamText } from 'ai'

export async function POST(req: Request) {
  const { businessName, category, city, hasWebsite } = await req.json()

  if (!businessName || !category || !city) {
    return Response.json(
      { error: 'Nome do negócio, categoria e cidade são obrigatórios' },
      { status: 400 }
    )
  }

  const websiteStatus = hasWebsite
    ? 'JÁ possui um website (sugerir modernização ou melhorias)'
    : 'NÃO possui website (enfatizar oportunidade de sair na frente da concorrência)'

  const result = streamText({
    model: 'anthropic/claude-sonnet-4-20250514',
    messages: [
      {
        role: 'user',
        content: `Você é o PitchAgent, um especialista em vendas de serviços de criação de websites para negócios locais no Brasil.

INFORMAÇÕES DO NEGÓCIO:
- Nome: ${businessName}
- Categoria/Setor: ${category}
- Cidade: ${city}
- Website: ${websiteStatus}

TAREFA:
Gere um pitch de vendas personalizado para WhatsApp convencendo o dono deste negócio a contratar um site profissional.

REGRAS PARA O PITCH:
- Mensagem em português brasileiro, informal mas profissional
- Comece com saudação mencionando o nome do negócio
- Demonstre conhecimento sobre o setor deles e desafios típicos
- Destaque benefícios específicos de ter um site para aquele tipo de negócio na cidade
- ${hasWebsite ? 'Sugira modernização, velocidade, SEO ou recursos novos' : 'Enfatize que a concorrência pode estar online antes deles'}
- Use 2-4 emojis no máximo (não exagere)
- Entre 150-250 palavras
- Termine com pergunta para incentivar resposta
- Call-to-action claro mas não agressivo

FORMATO:
Responda APENAS com o pitch pronto para copiar e colar no WhatsApp.
Não inclua aspas, explicações, cabeçalhos ou marcações - apenas a mensagem final.`,
      },
    ],
  })

  return result.toTextStreamResponse()
}
