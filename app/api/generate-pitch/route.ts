export async function POST(req: Request) {
  const { businessName, category, city, hasWebsite } = await req.json()

  if (!businessName || !category || !city) {
    return Response.json(
      { error: 'Nome do negócio, categoria e cidade são obrigatórios' },
      { status: 400 }
    )
  }

  const pitch = generatePitch(businessName, category, city, hasWebsite)

  // Simulate streaming by sending the pitch in chunks
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const words = pitch.split(' ')
      for (let i = 0; i < words.length; i++) {
        const word = words[i] + (i < words.length - 1 ? ' ' : '')
        controller.enqueue(encoder.encode(word))
        await new Promise((resolve) => setTimeout(resolve, 30))
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  })
}

function generatePitch(
  businessName: string,
  category: string,
  city: string,
  hasWebsite: boolean
): string {
  const categoryLower = category.toLowerCase()

  // Category-specific benefits
  const categoryBenefits: Record<string, string> = {
    restaurante: `cardápio online com fotos de dar água na boca, pedidos pelo WhatsApp integrado e reservas automáticas`,
    barbearia: `agendamento online 24h, galeria dos seus melhores cortes e avaliações dos clientes`,
    academia: `planos e horários sempre atualizados, área do aluno para acompanhar treinos e matrículas online`,
    salão: `agendamento fácil pelo celular, portfólio dos trabalhos e promoções em destaque`,
    clínica: `agendamento online, informações sobre procedimentos e depoimentos de pacientes satisfeitos`,
    loja: `catálogo completo dos produtos, compras online e integração com WhatsApp para dúvidas rápidas`,
    oficina: `orçamentos online, galeria de serviços realizados e agendamento prático`,
    pet: `agendamento de banho e tosa online, galeria dos pets atendidos e dicas de cuidados`,
    consultório: `agendamento 24h, informações sobre especialidades e localização fácil de encontrar`,
    escritório: `apresentação profissional dos serviços, cases de sucesso e formulário de contato direto`,
  }

  // Find matching category or use default
  let benefits = `vitrine profissional dos seus serviços, contato direto pelo WhatsApp e presença forte no Google`
  for (const [key, value] of Object.entries(categoryBenefits)) {
    if (categoryLower.includes(key)) {
      benefits = value
      break
    }
  }

  // Different approaches based on website status
  if (hasWebsite) {
    const modernizationReasons = [
      `site mais rápido e moderno que funciona perfeitamente no celular`,
      `design atualizado que passa mais confiança para novos clientes`,
      `melhor posicionamento no Google para "${category} em ${city}"`,
      `integração com WhatsApp Business para converter visitantes em clientes`,
    ]
    const randomReason =
      modernizationReasons[
        Math.floor(Math.random() * modernizationReasons.length)
      ]

    return `Oi! Tudo bem? 👋

Vi que a ${businessName} já tem um site, e isso é ótimo! Mas deixa eu te fazer uma pergunta: quando foi a última vez que ele foi atualizado?

Trabalho com criação de sites profissionais aqui em ${city} e percebi que muitos negócios de ${category.toLowerCase()} estão perdendo clientes por ter um site desatualizado ou lento no celular.

Hoje, mais de 80% das pessoas pesquisam no Google antes de escolher onde ir. E sabe o que elas olham primeiro? A aparência do site e se ele carrega rápido.

Posso criar para a ${businessName} um ${randomReason}.

Além disso, incluo: ${benefits}.

Que tal batermos um papo rápido de 10 minutos para eu te mostrar algumas ideias? Sem compromisso, só para você ver o que é possível fazer.

Posso te ligar ainda essa semana? 📱`
  } else {
    const urgencyPoints = [
      `Seus concorrentes em ${city} já estão aparecendo no Google quando alguém pesquisa por "${category}". Não seria hora de aparecer também?`,
      `Sabia que 97% das pessoas pesquisam online antes de visitar um negócio local? Quem não está no Google, praticamente não existe.`,
      `Imagina quantos clientes passam pela porta da ${businessName} sem entrar porque não encontraram vocês no Google?`,
    ]
    const randomUrgency =
      urgencyPoints[Math.floor(Math.random() * urgencyPoints.length)]

    return `Oi! Tudo bem? 👋

Sou especialista em criação de sites para negócios locais aqui em ${city} e encontrei a ${businessName} enquanto pesquisava por ${category.toLowerCase()} na região.

${randomUrgency}

Um site profissional para a ${businessName} pode ter: ${benefits}.

E o melhor: não precisa ser caro nem complicado. Cuido de tudo para você, desde a criação até deixar o site funcionando perfeitamente.

Em poucas semanas, quando alguém pesquisar por "${category.toLowerCase()} em ${city}", a ${businessName} vai aparecer com um site bonito e profissional.

Posso te mostrar alguns exemplos de sites que fiz para outros negócios parecidos? É rapidinho, uns 10 minutinhos de conversa! 📱

Quando seria melhor para você?`
  }
}
