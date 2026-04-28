export async function POST(req: Request) {
  const { businessName, category, city, hasWebsite, tone, language, variation } = await req.json()

  if (!businessName || !category || !city) {
    return Response.json(
      { error: 'Business name, category and city are required' },
      { status: 400 }
    )
  }

  const opportunityScore = calculateOpportunityScore(category, hasWebsite, language || 'pt-br')
  const pitch = generatePitch(businessName, category, city, hasWebsite, tone || 'informal', language || 'pt-br', variation || 0)

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
      'Content-Type': 'application/json; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  })
}

type OpportunityLevel = 'high' | 'medium' | 'low'
type Language = 'pt-br' | 'en' | 'es'

function calculateOpportunityScore(category: string, hasWebsite: boolean, language: Language): { level: OpportunityLevel; label: string } {
  const categoryLower = category.toLowerCase()
  
  // High-demand categories in all languages
  const highDemandCategories = [
    'restaurante', 'restaurant', 'barbearia', 'barbershop', 'barber', 'peluquería',
    'salão', 'salon', 'salón', 'academia', 'gym', 'gimnasio', 'clínica', 'clinic',
    'consultório', 'consultorio', 'pet', 'dentista', 'dentist', 'médico', 'doctor',
    'pizzaria', 'pizzeria', 'pizza', 'hamburgueria', 'burger', 'hamburguesería', 'delivery'
  ]
  const mediumDemandCategories = [
    'loja', 'store', 'tienda', 'shop', 'oficina', 'workshop', 'taller',
    'escritório', 'office', 'advocacia', 'law', 'abogado',
    'contabilidade', 'accounting', 'contabilidad', 'imobiliária', 'real estate', 'inmobiliaria',
    'escola', 'school', 'escuela', 'curso', 'course'
  ]
  
  const isHighDemand = highDemandCategories.some(cat => categoryLower.includes(cat))
  const isMediumDemand = mediumDemandCategories.some(cat => categoryLower.includes(cat))
  
  const labels = {
    'pt-br': { high: 'Alta Oportunidade', medium: 'Média Oportunidade', low: 'Baixa Oportunidade' },
    'en': { high: 'High Opportunity', medium: 'Medium Opportunity', low: 'Low Opportunity' },
    'es': { high: 'Alta Oportunidad', medium: 'Oportunidad Media', low: 'Baja Oportunidad' },
  }
  
  const langLabels = labels[language] || labels['en']
  
  if (!hasWebsite && isHighDemand) {
    return { level: 'high', label: langLabels.high }
  } else if (!hasWebsite && isMediumDemand) {
    return { level: 'medium', label: langLabels.medium }
  } else if (!hasWebsite) {
    return { level: 'medium', label: langLabels.medium }
  } else if (hasWebsite && isHighDemand) {
    return { level: 'medium', label: langLabels.medium }
  } else {
    return { level: 'low', label: langLabels.low }
  }
}

function generatePitch(
  businessName: string,
  category: string,
  city: string,
  hasWebsite: boolean,
  tone: 'informal' | 'professional' | 'aggressive',
  language: Language,
  variation: number
): string {
  if (language === 'pt-br') {
    return generatePortuguesePitch(businessName, category, city, hasWebsite, tone, variation)
  } else if (language === 'en') {
    return generateEnglishPitch(businessName, category, city, hasWebsite, tone, variation)
  } else {
    return generateSpanishPitch(businessName, category, city, hasWebsite, tone, variation)
  }
}

function generatePortuguesePitch(
  businessName: string,
  category: string,
  city: string,
  hasWebsite: boolean,
  tone: 'informal' | 'professional' | 'aggressive',
  variation: number
): string {
  const categoryLower = category.toLowerCase()

  const categoryBenefits: Record<string, string> = {
    restaurante: `cardápio online com fotos de dar água na boca, pedidos pelo WhatsApp integrado e reservas automáticas`,
    barbearia: `agendamento online 24h, galeria dos seus melhores cortes e avaliações dos clientes`,
    academia: `planos e horários sempre atualizados, área do aluno para acompanhar treinos e matrículas online`,
    salao: `agendamento fácil pelo celular, portfólio dos trabalhos e promoções em destaque`,
    clinica: `agendamento online, informações sobre procedimentos e depoimentos de pacientes satisfeitos`,
    loja: `catálogo completo dos produtos, compras online e integração com WhatsApp para dúvidas rápidas`,
    oficina: `orçamentos online, galeria de serviços realizados e agendamento prático`,
    pet: `agendamento de banho e tosa online, galeria dos pets atendidos e dicas de cuidados`,
    consultorio: `agendamento 24h, informações sobre especialidades e localização fácil de encontrar`,
    escritorio: `apresentação profissional dos serviços, cases de sucesso e formulário de contato direto`,
  }

  let benefits = `vitrine profissional dos seus serviços, contato direto pelo WhatsApp e presença forte no Google`
  for (const [key, value] of Object.entries(categoryBenefits)) {
    if (categoryLower.includes(key)) {
      benefits = value
      break
    }
  }

  const toneSettings = {
    informal: {
      greeting: ['Oi! Tudo bem?', 'E aí, tudo certo?', 'Olá! Tudo joia?'][variation % 3],
      closing: ['Posso te ligar ainda essa semana?', 'Bora bater um papo?', 'Que tal conversarmos?'][variation % 3],
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
      closing: ['Me responde HOJE e te faço uma condição especial.', 'Essa oportunidade não vai durar. Me chama agora!', 'Não deixa pra depois. Vamos fechar?'][variation % 3],
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

function generateEnglishPitch(
  businessName: string,
  category: string,
  city: string,
  hasWebsite: boolean,
  tone: 'informal' | 'professional' | 'aggressive',
  variation: number
): string {
  const categoryLower = category.toLowerCase()

  const categoryBenefits: Record<string, string> = {
    restaurant: `online menu with mouth-watering photos, WhatsApp ordering integration, and automatic reservations`,
    barbershop: `24/7 online booking, gallery of your best cuts, and customer reviews`,
    barber: `24/7 online booking, gallery of your best cuts, and customer reviews`,
    gym: `always updated plans and schedules, member area to track workouts, and online sign-ups`,
    salon: `easy mobile booking, work portfolio, and featured promotions`,
    clinic: `online scheduling, procedure information, and testimonials from satisfied patients`,
    store: `complete product catalog, online shopping, and WhatsApp integration for quick questions`,
    shop: `complete product catalog, online shopping, and WhatsApp integration for quick questions`,
    workshop: `online quotes, gallery of completed services, and convenient scheduling`,
    pet: `online grooming appointments, gallery of pets served, and care tips`,
    office: `professional service presentation, success cases, and direct contact form`,
  }

  let benefits = `professional showcase of your services, direct WhatsApp contact, and strong Google presence`
  for (const [key, value] of Object.entries(categoryBenefits)) {
    if (categoryLower.includes(key)) {
      benefits = value
      break
    }
  }

  const toneSettings = {
    informal: {
      greeting: ['Hey there!', 'Hi! How are you?', 'Hello!'][variation % 3],
      closing: ['Can I give you a call this week?', "Let's chat!", 'What do you say we talk?'][variation % 3],
      connector: 'So',
      urgency: "Here's the thing:",
    },
    professional: {
      greeting: ['Good afternoon.', 'Hello, I hope this message finds you well.', 'Greetings.'][variation % 3],
      closing: ["I'm available for a meeting at your convenience.", 'I look forward to scheduling a conversation.', 'I would be pleased to present our proposal in detail.'][variation % 3],
      connector: 'With that in mind',
      urgency: "It's important to note that",
    },
    aggressive: {
      greeting: ['Let me be direct:', "I'll be straight with you:", 'No beating around the bush:'][variation % 3],
      closing: ["Reply TODAY and I'll give you a special deal.", "This opportunity won't last. Message me now!", "Don't put it off. Let's close this deal!"][variation % 3],
      connector: 'The truth is',
      urgency: 'FACT:',
    },
  }

  const settings = toneSettings[tone]

  if (hasWebsite) {
    const modernizationReasons = [
      `a faster, modern website that works perfectly on mobile`,
      `an updated design that builds trust with new customers`,
      `better Google ranking for "${category} in ${city}"`,
    ]
    const reason = modernizationReasons[(variation + 1) % modernizationReasons.length]

    if (tone === 'informal') {
      return `${settings.greeting}

I noticed ${businessName} already has a website, which is great! But let me ask you something: when was the last time it was updated?

I specialize in creating professional websites here in ${city}, and I've noticed many ${category.toLowerCase()} businesses are losing customers because their website is outdated or slow on mobile.

${settings.urgency} Over 80% of people search Google before deciding where to go. And you know what they look at first? How the site looks and how fast it loads.

I can create for ${businessName} ${reason}.

Plus, I include: ${benefits}.

How about a quick 10-minute chat so I can show you some ideas? No commitment!

${settings.closing}`
    } else if (tone === 'professional') {
      return `${settings.greeting}

I've identified that ${businessName} already has a digital presence, which demonstrates market awareness. However, I'd like to present a modernization opportunity.

I work in web development in ${city}, focusing on ${category.toLowerCase()} businesses. ${settings.urgency} studies show that 80% of consumers research online before visiting local establishments.

Our proposal includes: ${reason}, plus ${benefits}.

${settings.connector}, I believe we can add significant value to ${businessName}'s digital presence.

${settings.closing}`
    } else {
      return `${settings.greeting}

${businessName} has a website, but here's something you might not know: an outdated website DRIVES customers away. It's worse than having no website at all.

${settings.urgency} Your competitors in ${city} are investing heavily in their digital presence. Meanwhile, a slow or ugly website is costing you customers every single day.

I can fix this FAST: ${reason}, with ${benefits}.

${settings.closing}`
    }
  } else {
    const urgencyPoints = [
      `Your competitors in ${city} are already showing up on Google when someone searches for "${category}". Isn't it time you showed up too?`,
      `97% of people search online before visiting a local business. If you're not on Google, you practically don't exist.`,
      `Imagine how many customers walk past ${businessName} without coming in because they couldn't find you on Google?`,
    ]
    const urgency = urgencyPoints[(variation + 2) % urgencyPoints.length]

    if (tone === 'informal') {
      return `${settings.greeting}

I specialize in creating websites for local businesses here in ${city}, and I found ${businessName} while researching ${category.toLowerCase()} in the area.

${urgency}

A professional website for ${businessName} could have: ${benefits}.

And the best part: it doesn't have to be expensive or complicated. I take care of everything for you, from creation to getting the site running perfectly.

In just a few weeks, when someone searches for "${category.toLowerCase()} in ${city}", ${businessName} will show up with a beautiful, professional website.

Can I show you some examples of websites I've made for similar businesses? Just a quick 10-minute chat!

${settings.closing}`
    } else if (tone === 'professional') {
      return `${settings.greeting}

I'm a web developer specializing in local businesses in the ${city} area. While conducting market research on ${category.toLowerCase()}, I identified ${businessName}.

${settings.urgency} the absence of a digital presence can represent a significant loss of business opportunities. Research indicates that most consumers search online before visiting establishments.

Our solution includes: ${benefits}.

${settings.connector}, I would like to present a customized project to establish ${businessName}'s digital presence professionally and efficiently.

${settings.closing}`
    } else {
      return `${settings.greeting}

${businessName} DOESN'T HAVE A WEBSITE. In 2024. This is a serious problem.

${settings.urgency} While you're reading this message, someone is searching "${category.toLowerCase()} in ${city}" on Google. And guess who shows up? Your competitors. ${businessName}? Invisible.

Every day without a website is money lost. Plain and simple.

I create professional websites with: ${benefits}.

No runaround. Fast delivery. And the investment pays for itself within months with new customers.

${settings.closing}`
    }
  }
}

function generateSpanishPitch(
  businessName: string,
  category: string,
  city: string,
  hasWebsite: boolean,
  tone: 'informal' | 'professional' | 'aggressive',
  variation: number
): string {
  const categoryLower = category.toLowerCase()

  const categoryBenefits: Record<string, string> = {
    restaurante: `menú online con fotos que dan hambre, pedidos por WhatsApp integrado y reservas automáticas`,
    peluquería: `reservas online 24h, galería de tus mejores cortes y opiniones de clientes`,
    barbería: `reservas online 24h, galería de tus mejores cortes y opiniones de clientes`,
    gimnasio: `planes y horarios siempre actualizados, área del cliente para seguir entrenamientos e inscripciones online`,
    salón: `reservas fáciles desde el celular, portafolio de trabajos y promociones destacadas`,
    clínica: `citas online, información sobre procedimientos y testimonios de pacientes satisfechos`,
    tienda: `catálogo completo de productos, compras online e integración con WhatsApp para dudas rápidas`,
    taller: `presupuestos online, galería de servicios realizados y reservas prácticas`,
    pet: `citas de baño y corte online, galería de mascotas atendidas y consejos de cuidado`,
    consultorio: `citas 24h, información sobre especialidades y ubicación fácil de encontrar`,
    oficina: `presentación profesional de servicios, casos de éxito y formulario de contacto directo`,
  }

  let benefits = `vitrina profesional de tus servicios, contacto directo por WhatsApp y presencia fuerte en Google`
  for (const [key, value] of Object.entries(categoryBenefits)) {
    if (categoryLower.includes(key)) {
      benefits = value
      break
    }
  }

  const toneSettings = {
    informal: {
      greeting: ['¡Hola! ¿Qué tal?', '¡Hey! ¿Cómo estás?', '¡Hola! ¿Cómo va todo?'][variation % 3],
      closing: ['¿Te puedo llamar esta semana?', '¿Charlamos un rato?', '¿Qué te parece si hablamos?'][variation % 3],
      connector: 'Entonces',
      urgency: 'Mira esto:',
    },
    professional: {
      greeting: ['Estimado/a, buenas tardes.', 'Hola, espero que se encuentre bien.', 'Cordiales saludos.'][variation % 3],
      closing: ['Quedo a disposición para una reunión.', 'Espero su respuesta para agendar una conversación.', 'Será un placer presentar nuestra propuesta en detalle.'][variation % 3],
      connector: 'Por lo tanto',
      urgency: 'Es importante destacar que',
    },
    aggressive: {
      greeting: ['Voy al grano:', 'Te soy sincero:', 'Sin rodeos:'][variation % 3],
      closing: ['¡Respóndeme HOY y te hago una condición especial!', '¡Esta oportunidad no va a durar. Escríbeme ahora!', '¿No lo dejes para después. Cerramos?'][variation % 3],
      connector: 'La verdad es que',
      urgency: 'HECHO:',
    },
  }

  const settings = toneSettings[tone]

  if (hasWebsite) {
    const modernizationReasons = [
      `un sitio más rápido y moderno que funciona perfecto en el celular`,
      `un diseño actualizado que transmite más confianza a nuevos clientes`,
      `mejor posicionamiento en Google para "${category} en ${city}"`,
    ]
    const reason = modernizationReasons[(variation + 1) % modernizationReasons.length]

    if (tone === 'informal') {
      return `${settings.greeting}

Vi que ${businessName} ya tiene un sitio web, ¡y eso está genial! Pero déjame hacerte una pregunta: ¿cuándo fue la última vez que lo actualizaron?

Trabajo creando sitios web profesionales aquí en ${city} y he notado que muchos negocios de ${category.toLowerCase()} están perdiendo clientes por tener un sitio desactualizado o lento en el celular.

${settings.urgency} Más del 80% de las personas buscan en Google antes de decidir dónde ir. ¿Y sabes qué miran primero? Cómo se ve el sitio y si carga rápido.

Puedo crear para ${businessName} ${reason}.

Además, incluyo: ${benefits}.

¿Qué te parece si charlamos unos 10 minutos para mostrarte algunas ideas? ¡Sin compromiso!

${settings.closing}`
    } else if (tone === 'professional') {
      return `${settings.greeting}

He identificado que ${businessName} ya cuenta con presencia digital, lo cual demuestra visión de mercado. Sin embargo, me gustaría presentar una oportunidad de modernización.

Trabajo en desarrollo web en ${city}, con enfoque en ${category.toLowerCase()}. ${settings.urgency} estudios indican que el 80% de los consumidores investigan online antes de visitar establecimientos locales.

Nuestra propuesta incluye: ${reason}, además de ${benefits}.

${settings.connector}, creo que podemos agregar valor significativo a la presencia digital de ${businessName}.

${settings.closing}`
    } else {
      return `${settings.greeting}

${businessName} tiene sitio web, pero te voy a contar algo que quizás no sabías: un sitio desactualizado ALEJA clientes. Es peor que no tener sitio.

${settings.urgency} Tus competidores en ${city} están invirtiendo fuerte en presencia digital. Mientras tanto, un sitio lento o feo te está costando clientes todos los días.

Puedo resolver esto RÁPIDO: ${reason}, con ${benefits}.

${settings.closing}`
    }
  } else {
    const urgencyPoints = [
      `Tus competidores en ${city} ya aparecen en Google cuando alguien busca "${category}". ¿No sería hora de aparecer tú también?`,
      `El 97% de las personas buscan online antes de visitar un negocio local. Si no estás en Google, prácticamente no existes.`,
      `¿Imagínate cuántos clientes pasan por la puerta de ${businessName} sin entrar porque no los encontraron en Google?`,
    ]
    const urgency = urgencyPoints[(variation + 2) % urgencyPoints.length]

    if (tone === 'informal') {
      return `${settings.greeting}

Soy especialista en crear sitios web para negocios locales aquí en ${city} y encontré ${businessName} mientras investigaba ${category.toLowerCase()} en la zona.

${urgency}

Un sitio profesional para ${businessName} puede tener: ${benefits}.

Y lo mejor: no tiene que ser caro ni complicado. Me encargo de todo, desde la creación hasta dejarlo funcionando perfecto.

En pocas semanas, cuando alguien busque "${category.toLowerCase()} en ${city}", ${businessName} va a aparecer con un sitio lindo y profesional.

¿Te puedo mostrar algunos ejemplos de sitios que hice para otros negocios parecidos? ¡Son solo 10 minutitos de charla!

${settings.closing}`
    } else if (tone === 'professional') {
      return `${settings.greeting}

Soy desarrollador web especializado en negocios locales en la zona de ${city}. Al realizar un estudio de mercado sobre ${category.toLowerCase()}, identifiqué a ${businessName}.

${settings.urgency} la ausencia de presencia digital puede representar una pérdida significativa de oportunidades comerciales. Las investigaciones indican que la mayoría de los consumidores realizan búsquedas online antes de visitar establecimientos.

Nuestra solución contempla: ${benefits}.

${settings.connector}, me gustaría presentar un proyecto personalizado para establecer la presencia digital de ${businessName} de forma profesional y eficiente.

${settings.closing}`
    } else {
      return `${settings.greeting}

${businessName} NO TIENE SITIO WEB. En 2024. Esto es un problema serio.

${settings.urgency} Mientras lees este mensaje, alguien está buscando "${category.toLowerCase()} en ${city}" en Google. ¿Y sabes quién aparece? Tus competidores. ¿${businessName}? Invisible.

Cada día sin sitio web es plata perdida. Así de simple.

Yo creo sitios profesionales con: ${benefits}.

Sin vueltas. Entrego rápido. Y la inversión se paga sola en pocos meses con los nuevos clientes.

${settings.closing}`
    }
  }
}
