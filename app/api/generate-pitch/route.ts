export async function POST(req: Request) {
  const { businessName, category, city, hasWebsite, tone, variation } = await req.json()

  if (!businessName || !category || !city) {
    return Response.json(
      { error: 'Nome do negócio, categoria e cidade são obrigatórios' },
      { status: 400 }
    )
  }

  const opportunityScore = calculateOpportunityScore(category, hasWebsite)
  const pitch = generatePitch(businessName, category, city, hasWebsite, tone || 'informal', variation || 0)

  const responseData = {
    opportunityScore,
    pitch,
  }

  // Simulate streaming by sending the response in chunks
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      // First send the opportunity score
      controller.enqueue(encoder.encode(JSON.stringify({ type: 'score', data: opportunityScore }) + '\n'))
      await new Promise((resolve) => setTimeout(resolve, 100))
      
      // Then stream the pitch word by word
      const words = pitch.split(' ')
      for (let i = 0; i < words.length; i++) {
        const word = words[i] + (i < words.length - 1 ? ' ' : '')
        controller.enqueue(encoder.encode(JSON.stringify({ type: 'pitch', data: word }) + '\n'))
        await new Promise((resolve) => setTimeout(resolve, 25))
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

type OpportunityLevel = 'high' | 'medium' | 'low'

function calculateOpportunityScore(category: string, hasWebsite: boolean): { level: OpportunityLevel; label: string } {
  const categoryLower = category.toLowerCase()
  
  // High-demand categories that benefit most from websites
  const highDemandCategories = ['restaurante', 'barbearia', 'salão', 'academia', 'clínica', 'consultório', 'pet', 'dentista', 'médico', 'pizzaria', 'hamburgueria', 'delivery']
  const mediumDemandCategories = ['loja', 'oficina', 'escritório', 'advocacia', 'contabilidade', 'imobiliária', 'escola', 'curso']
  
  const isHighDemand = highDemandCategories.some(cat => categoryLower.includes(cat))
  const isMediumDemand = mediumDemandCategories.some(cat => categoryLower.includes(cat))
  
  if (!hasWebsite && isHighDemand) {
    return { level: 'high', label: 'Alta Oportunidade' }
  } else if (!hasWebsite && isMediumDemand) {
    return { level: 'medium', label: 'Média Oportunidade' }
  } else if (!hasWebsite) {
    return { level: 'medium', label: 'Média Oportunidade' }
  } else if (hasWebsite && isHighDemand) {
    return { level: 'medium', label: 'Média Oportunidade' }
  } else {
    return { level: 'low', label: 'Baixa Oportunidade' }
  }
}

function generatePitch(
  businessName: string,
  category: string,
  city: string,
  hasWebsite: boolean,
  tone: 'informal' | 'professional' | 'aggressive',
  variation: number
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

  let benefits = `vitrine profissional dos seus serviços, contato direto pelo WhatsApp e presença forte no Google`
  for (const [key, value] of Object.entries(categoryBenefits)) {
    if (categoryLower.includes(key)) {
      benefits = value
      break
    }
  }

  // Tone-specific greetings and closings
  const toneSettings = {
    informal: {
      greeting: ['Oi! Tudo bem? 👋', 'E aí, tudo certo? 👋', 'Olá! Tudo joia? 👋'][variation % 3],
      closing: ['Posso te ligar ainda essa semana? 📱', 'Bora bater um papo? 📱', 'Que tal conversarmos? 📱'][variation % 3],
      connector: 'Então',
      urgency: 'Sabe o que é legal?',
    },
    professional: {
      greeting: ['Prezado(a), boa tarde.', 'Olá, espero que esteja bem.', 'Cumprimentos cordiais.'][variation % 3],
      closing: ['Fico à disposição para uma reunião.', 'Aguardo seu retorno para agendarmos uma conversa.', 'Terei prazer em apresentar nossa proposta em detalhes.'][variation % 3],
      connector: 'Diante disso',
      urgency: 'É importante ressaltar que',
    },
    aggressive: {
      greeting: ['Direto ao ponto:', 'Vou ser sincero com você:', 'Sem rodeios:'][variation % 3],
      closing: ['Me responde HOJE e te faço uma condição especial. ⚡', 'Essa oportunidade não vai durar. Me chama agora! 🔥', 'Não deixa pra depois. Vamos fechar? 💪'][variation % 3],
      connector: 'A verdade é que',
      urgency: 'FATO:',
    },
  }

  const settings = toneSettings[tone]

  if (hasWebsite) {
    const modernizationReasons = [
      `um site mais rápido e moderno que funciona perfeitamente no celular`,
      `um design atualizado que passa mais confiança para novos clientes`,
      `melhor posicionamento no Google para "${category} em ${city}"`,
    ]
    const reason = modernizationReasons[(variation + 1) % modernizationReasons.length]

    if (tone === 'informal') {
      return `${settings.greeting}

Vi que a ${businessName} já tem um site, e isso é ótimo! Mas deixa eu te fazer uma pergunta: quando foi a última vez que ele foi atualizado?

Trabalho com criação de sites profissionais aqui em ${city} e percebi que muitos negócios de ${category.toLowerCase()} estão perdendo clientes por ter um site desatualizado ou lento no celular.

${settings.urgency} Mais de 80% das pessoas pesquisam no Google antes de escolher onde ir. E sabe o que elas olham primeiro? A aparência do site e se ele carrega rápido.

Posso criar para a ${businessName} ${reason}.

Além disso, incluo: ${benefits}.

Que tal batermos um papo rápido de 10 minutos para eu te mostrar algumas ideias? Sem compromisso!

${settings.closing}`
    } else if (tone === 'professional') {
      return `${settings.greeting}

Identificamos que a ${businessName} já possui presença digital, o que demonstra visão de mercado. No entanto, gostaria de apresentar uma oportunidade de modernização.

Atuo no segmento de desenvolvimento web em ${city}, com foco em ${category.toLowerCase()}. ${settings.urgency} estudos indicam que 80% dos consumidores pesquisam online antes de visitar estabelecimentos locais.

Nossa proposta inclui: ${reason}, além de ${benefits}.

${settings.connector}, acredito que podemos agregar valor significativo à presença digital da ${businessName}.

${settings.closing}`
    } else {
      return `${settings.greeting}

A ${businessName} tem site, mas vou te contar uma coisa que talvez você não saiba: site desatualizado AFASTA cliente. É pior do que não ter site.

${settings.urgency} Seus concorrentes em ${city} estão investindo pesado em presença digital. Enquanto isso, um site lento ou feio está custando clientes todo dia.

Posso resolver isso RÁPIDO: ${reason}, com ${benefits}.

${settings.closing}`
    }
  } else {
    const urgencyPoints = [
      `Seus concorrentes em ${city} já estão aparecendo no Google quando alguém pesquisa por "${category}". Não seria hora de aparecer também?`,
      `97% das pessoas pesquisam online antes de visitar um negócio local. Quem não está no Google, praticamente não existe.`,
      `Imagina quantos clientes passam pela porta da ${businessName} sem entrar porque não encontraram vocês no Google?`,
    ]
    const urgency = urgencyPoints[(variation + 2) % urgencyPoints.length]

    if (tone === 'informal') {
      return `${settings.greeting}

Sou especialista em criação de sites para negócios locais aqui em ${city} e encontrei a ${businessName} enquanto pesquisava por ${category.toLowerCase()} na região.

${urgency}

Um site profissional para a ${businessName} pode ter: ${benefits}.

E o melhor: não precisa ser caro nem complicado. Cuido de tudo para você, desde a criação até deixar o site funcionando perfeitamente.

Em poucas semanas, quando alguém pesquisar por "${category.toLowerCase()} em ${city}", a ${businessName} vai aparecer com um site bonito e profissional.

Posso te mostrar alguns exemplos de sites que fiz para outros negócios parecidos? É rapidinho, uns 10 minutinhos de conversa!

${settings.closing}`
    } else if (tone === 'professional') {
      return `${settings.greeting}

Sou desenvolvedor web especializado em negócios locais na região de ${city}. Ao realizar um estudo de mercado sobre ${category.toLowerCase()}, identifiquei a ${businessName}.

${settings.urgency} a ausência de presença digital pode representar uma perda significativa de oportunidades comerciais. Pesquisas indicam que a maioria dos consumidores realiza buscas online antes de visitar estabelecimentos.

Nossa solução contempla: ${benefits}.

${settings.connector}, gostaria de apresentar um projeto personalizado para estabelecer a presença digital da ${businessName} de forma profissional e eficiente.

${settings.closing}`
    } else {
      return `${settings.greeting}

A ${businessName} NÃO TEM SITE. Em 2024. Isso é um problema sério.

${settings.urgency} Enquanto você lê essa mensagem, alguém está pesquisando "${category.toLowerCase()} em ${city}" no Google. E sabe quem aparece? Seus concorrentes. A ${businessName}? Invisível.

Cada dia sem site é dinheiro perdido. Simples assim.

Eu crio sites profissionais com: ${benefits}.

Sem enrolação. Entrego rápido. E o investimento se paga em poucos meses com os novos clientes.

${settings.closing}`
    }
  }
}
