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
      'Content-Type': 'text/plain; charset=utf-8',
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
    'restaurante', 'restaurant', 'barbearia', 'barbershop', 'barber', 'peluqueria',
    'salao', 'salon', 'salón', 'academia', 'gym', 'gimnasio', 'clinica', 'clinic', 'clínica',
    'consultorio', 'consultório', 'pet', 'dentista', 'dentist', 'medico', 'médico', 'doctor',
    'pizzaria', 'pizzeria', 'pizza', 'hamburgueria', 'burger', 'hamburgueseria', 'delivery'
  ]
  const mediumDemandCategories = [
    'loja', 'store', 'tienda', 'shop', 'oficina', 'workshop', 'taller',
    'escritorio', 'escritório', 'office', 'oficina', 'advocacia', 'law', 'abogado',
    'contabilidade', 'accounting', 'contabilidad', 'imobiliaria', 'imobiliária', 'real estate', 'inmobiliaria',
    'escola', 'school', 'escuela', 'curso', 'course'
  ]
  
  const isHighDemand = highDemandCategories.some(cat => categoryLower.includes(cat))
  const isMediumDemand = mediumDemandCategories.some(cat => categoryLower.includes(cat))
  
  const labels = {
    'pt-br': { high: 'Alta Oportunidade', medium: 'Media Oportunidade', low: 'Baixa Oportunidade' },
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
    restaurante: `cardapio online com fotos de dar agua na boca, pedidos pelo WhatsApp integrado e reservas automaticas`,
    barbearia: `agendamento online 24h, galeria dos seus melhores cortes e avaliacoes dos clientes`,
    academia: `planos e horarios sempre atualizados, area do aluno para acompanhar treinos e matriculas online`,
    salao: `agendamento facil pelo celular, portfolio dos trabalhos e promocoes em destaque`,
    clinica: `agendamento online, informacoes sobre procedimentos e depoimentos de pacientes satisfeitos`,
    loja: `catalogo completo dos produtos, compras online e integracao com WhatsApp para duvidas rapidas`,
    oficina: `orcamentos online, galeria de servicos realizados e agendamento pratico`,
    pet: `agendamento de banho e tosa online, galeria dos pets atendidos e dicas de cuidados`,
    consultorio: `agendamento 24h, informacoes sobre especialidades e localizacao facil de encontrar`,
    escritorio: `apresentacao profissional dos servicos, cases de sucesso e formulario de contato direto`,
  }

  let benefits = `vitrine profissional dos seus servicos, contato direto pelo WhatsApp e presenca forte no Google`
  for (const [key, value] of Object.entries(categoryBenefits)) {
    if (categoryLower.includes(key)) {
      benefits = value
      break
    }
  }

  const toneSettings = {
    informal: {
      greeting: ['Oi! Tudo bem?', 'E ai, tudo certo?', 'Ola! Tudo joia?'][variation % 3],
      closing: ['Posso te ligar ainda essa semana?', 'Bora bater um papo?', 'Que tal conversarmos?'][variation % 3],
      connector: 'Entao',
      urgency: 'Sabe o que e legal?',
    },
    professional: {
      greeting: ['Prezado(a), boa tarde.', 'Ola, espero que esteja bem.', 'Cumprimentos cordiais.'][variation % 3],
      closing: ['Fico a disposicao para uma reuniao.', 'Aguardo seu retorno para agendarmos uma conversa.', 'Terei prazer em apresentar nossa proposta em detalhes.'][variation % 3],
      connector: 'Diante disso',
      urgency: 'E importante ressaltar que',
    },
    aggressive: {
      greeting: ['Direto ao ponto:', 'Vou ser sincero com voce:', 'Sem rodeios:'][variation % 3],
      closing: ['Me responde HOJE e te faco uma condicao especial.', 'Essa oportunidade nao vai durar. Me chama agora!', 'Nao deixa pra depois. Vamos fechar?'][variation % 3],
      connector: 'A verdade e que',
      urgency: 'FATO:',
    },
  }

  const settings = toneSettings[tone]

  if (hasWebsite) {
    const modernizationReasons = [
      `um site mais rapido e moderno que funciona perfeitamente no celular`,
      `um design atualizado que passa mais confianca para novos clientes`,
      `melhor posicionamento no Google para "${category} em ${city}"`,
    ]
    const reason = modernizationReasons[(variation + 1) % modernizationReasons.length]

    if (tone === 'informal') {
      return `${settings.greeting}

Vi que a ${businessName} ja tem um site, e isso e otimo! Mas deixa eu te fazer uma pergunta: quando foi a ultima vez que ele foi atualizado?

Trabalho com criacao de sites profissionais aqui em ${city} e percebi que muitos negocios de ${category.toLowerCase()} estao perdendo clientes por ter um site desatualizado ou lento no celular.

${settings.urgency} Mais de 80% das pessoas pesquisam no Google antes de escolher onde ir. E sabe o que elas olham primeiro? A aparencia do site e se ele carrega rapido.

Posso criar para a ${businessName} ${reason}.

Alem disso, incluo: ${benefits}.

Que tal batermos um papo rapido de 10 minutos para eu te mostrar algumas ideias? Sem compromisso!

${settings.closing}`
    } else if (tone === 'professional') {
      return `${settings.greeting}

Identificamos que a ${businessName} ja possui presenca digital, o que demonstra visao de mercado. No entanto, gostaria de apresentar uma oportunidade de modernizacao.

Atuo no segmento de desenvolvimento web em ${city}, com foco em ${category.toLowerCase()}. ${settings.urgency} estudos indicam que 80% dos consumidores pesquisam online antes de visitar estabelecimentos locais.

Nossa proposta inclui: ${reason}, alem de ${benefits}.

${settings.connector}, acredito que podemos agregar valor significativo a presenca digital da ${businessName}.

${settings.closing}`
    } else {
      return `${settings.greeting}

A ${businessName} tem site, mas vou te contar uma coisa que talvez voce nao saiba: site desatualizado AFASTA cliente. E pior do que nao ter site.

${settings.urgency} Seus concorrentes em ${city} estao investindo pesado em presenca digital. Enquanto isso, um site lento ou feio esta custando clientes todo dia.

Posso resolver isso RAPIDO: ${reason}, com ${benefits}.

${settings.closing}`
    }
  } else {
    const urgencyPoints = [
      `Seus concorrentes em ${city} ja estao aparecendo no Google quando alguem pesquisa por "${category}". Nao seria hora de aparecer tambem?`,
      `97% das pessoas pesquisam online antes de visitar um negocio local. Quem nao esta no Google, praticamente nao existe.`,
      `Imagina quantos clientes passam pela porta da ${businessName} sem entrar porque nao encontraram voces no Google?`,
    ]
    const urgency = urgencyPoints[(variation + 2) % urgencyPoints.length]

    if (tone === 'informal') {
      return `${settings.greeting}

Sou especialista em criacao de sites para negocios locais aqui em ${city} e encontrei a ${businessName} enquanto pesquisava por ${category.toLowerCase()} na regiao.

${urgency}

Um site profissional para a ${businessName} pode ter: ${benefits}.

E o melhor: nao precisa ser caro nem complicado. Cuido de tudo para voce, desde a criacao ate deixar o site funcionando perfeitamente.

Em poucas semanas, quando alguem pesquisar por "${category.toLowerCase()} em ${city}", a ${businessName} vai aparecer com um site bonito e profissional.

Posso te mostrar alguns exemplos de sites que fiz para outros negocios parecidos? E rapidinho, uns 10 minutinhos de conversa!

${settings.closing}`
    } else if (tone === 'professional') {
      return `${settings.greeting}

Sou desenvolvedor web especializado em negocios locais na regiao de ${city}. Ao realizar um estudo de mercado sobre ${category.toLowerCase()}, identifiquei a ${businessName}.

${settings.urgency} a ausencia de presenca digital pode representar uma perda significativa de oportunidades comerciais. Pesquisas indicam que a maioria dos consumidores realiza buscas online antes de visitar estabelecimentos.

Nossa solucao contempla: ${benefits}.

${settings.connector}, gostaria de apresentar um projeto personalizado para estabelecer a presenca digital da ${businessName} de forma profissional e eficiente.

${settings.closing}`
    } else {
      return `${settings.greeting}

A ${businessName} NAO TEM SITE. Em 2024. Isso e um problema serio.

${settings.urgency} Enquanto voce le essa mensagem, alguem esta pesquisando "${category.toLowerCase()} em ${city}" no Google. E sabe quem aparece? Seus concorrentes. A ${businessName}? Invisivel.

Cada dia sem site e dinheiro perdido. Simples assim.

Eu crio sites profissionais com: ${benefits}.

Sem enrolacao. Entrego rapido. E o investimento se paga em poucos meses com os novos clientes.

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
      closing: ['Can I give you a call this week?', 'Let\'s chat!', 'What do you say we talk?'][variation % 3],
      connector: 'So',
      urgency: 'Here\'s the thing:',
    },
    professional: {
      greeting: ['Good afternoon.', 'Hello, I hope this message finds you well.', 'Greetings.'][variation % 3],
      closing: ['I\'m available for a meeting at your convenience.', 'I look forward to scheduling a conversation.', 'I would be pleased to present our proposal in detail.'][variation % 3],
      connector: 'With that in mind',
      urgency: 'It\'s important to note that',
    },
    aggressive: {
      greeting: ['Let me be direct:', 'I\'ll be straight with you:', 'No beating around the bush:'][variation % 3],
      closing: ['Reply TODAY and I\'ll give you a special deal.', 'This opportunity won\'t last. Message me now!', 'Don\'t put it off. Let\'s close this deal!'][variation % 3],
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
    restaurante: `menu online con fotos que dan hambre, pedidos por WhatsApp integrado y reservas automaticas`,
    peluqueria: `reservas online 24h, galeria de tus mejores cortes y opiniones de clientes`,
    barberia: `reservas online 24h, galeria de tus mejores cortes y opiniones de clientes`,
    gimnasio: `planes y horarios siempre actualizados, area del cliente para seguir entrenamientos e inscripciones online`,
    salon: `reservas faciles desde el celular, portafolio de trabajos y promociones destacadas`,
    clinica: `citas online, informacion sobre procedimientos y testimonios de pacientes satisfechos`,
    tienda: `catalogo completo de productos, compras online e integracion con WhatsApp para dudas rapidas`,
    taller: `presupuestos online, galeria de servicios realizados y reservas practicas`,
    pet: `citas de bano y corte online, galeria de mascotas atendidas y consejos de cuidado`,
    consultorio: `citas 24h, informacion sobre especialidades y ubicacion facil de encontrar`,
    oficina: `presentacion profesional de servicios, casos de exito y formulario de contacto directo`,
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
      greeting: ['Hola! Que tal?', 'Hey! Como estas?', 'Hola! Como va todo?'][variation % 3],
      closing: ['Te puedo llamar esta semana?', 'Charlamos un rato?', 'Que te parece si hablamos?'][variation % 3],
      connector: 'Entonces',
      urgency: 'Mira esto:',
    },
    professional: {
      greeting: ['Estimado/a, buenas tardes.', 'Hola, espero que se encuentre bien.', 'Cordiales saludos.'][variation % 3],
      closing: ['Quedo a disposicion para una reunion.', 'Espero su respuesta para agendar una conversacion.', 'Sera un placer presentar nuestra propuesta en detalle.'][variation % 3],
      connector: 'Por lo tanto',
      urgency: 'Es importante destacar que',
    },
    aggressive: {
      greeting: ['Voy al grano:', 'Te soy sincero:', 'Sin rodeos:'][variation % 3],
      closing: ['Respondeme HOY y te hago una condicion especial.', 'Esta oportunidad no va a durar. Escribime ahora!', 'No lo dejes para despues. Cerramos?'][variation % 3],
      connector: 'La verdad es que',
      urgency: 'HECHO:',
    },
  }

  const settings = toneSettings[tone]

  if (hasWebsite) {
    const modernizationReasons = [
      `un sitio mas rapido y moderno que funciona perfecto en el celular`,
      `un diseno actualizado que transmite mas confianza a nuevos clientes`,
      `mejor posicionamiento en Google para "${category} en ${city}"`,
    ]
    const reason = modernizationReasons[(variation + 1) % modernizationReasons.length]

    if (tone === 'informal') {
      return `${settings.greeting}

Vi que ${businessName} ya tiene un sitio web, y eso esta genial! Pero dejame hacerte una pregunta: cuando fue la ultima vez que lo actualizaron?

Trabajo creando sitios web profesionales aqui en ${city} y he notado que muchos negocios de ${category.toLowerCase()} estan perdiendo clientes por tener un sitio desactualizado o lento en el celular.

${settings.urgency} Mas del 80% de las personas buscan en Google antes de decidir donde ir. Y sabes que miran primero? Como se ve el sitio y si carga rapido.

Puedo crear para ${businessName} ${reason}.

Ademas, incluyo: ${benefits}.

Que te parece si charlamos unos 10 minutos para mostrarte algunas ideas? Sin compromiso!

${settings.closing}`
    } else if (tone === 'professional') {
      return `${settings.greeting}

He identificado que ${businessName} ya cuenta con presencia digital, lo cual demuestra vision de mercado. Sin embargo, me gustaria presentar una oportunidad de modernizacion.

Trabajo en desarrollo web en ${city}, con enfoque en ${category.toLowerCase()}. ${settings.urgency} estudios indican que el 80% de los consumidores investigan online antes de visitar establecimientos locales.

Nuestra propuesta incluye: ${reason}, ademas de ${benefits}.

${settings.connector}, creo que podemos agregar valor significativo a la presencia digital de ${businessName}.

${settings.closing}`
    } else {
      return `${settings.greeting}

${businessName} tiene sitio web, pero te voy a contar algo que quizas no sabias: un sitio desactualizado ALEJA clientes. Es peor que no tener sitio.

${settings.urgency} Tus competidores en ${city} estan invirtiendo fuerte en presencia digital. Mientras tanto, un sitio lento o feo te esta costando clientes todos los dias.

Puedo resolver esto RAPIDO: ${reason}, con ${benefits}.

${settings.closing}`
    }
  } else {
    const urgencyPoints = [
      `Tus competidores en ${city} ya aparecen en Google cuando alguien busca "${category}". No seria hora de aparecer vos tambien?`,
      `El 97% de las personas buscan online antes de visitar un negocio local. Si no estas en Google, practicamente no existis.`,
      `Imaginate cuantos clientes pasan por la puerta de ${businessName} sin entrar porque no los encontraron en Google?`,
    ]
    const urgency = urgencyPoints[(variation + 2) % urgencyPoints.length]

    if (tone === 'informal') {
      return `${settings.greeting}

Soy especialista en crear sitios web para negocios locales aqui en ${city} y encontre ${businessName} mientras investigaba ${category.toLowerCase()} en la zona.

${urgency}

Un sitio profesional para ${businessName} puede tener: ${benefits}.

Y lo mejor: no tiene que ser caro ni complicado. Me encargo de todo, desde la creacion hasta dejarlo funcionando perfecto.

En pocas semanas, cuando alguien busque "${category.toLowerCase()} en ${city}", ${businessName} va a aparecer con un sitio lindo y profesional.

Te puedo mostrar algunos ejemplos de sitios que hice para otros negocios parecidos? Son solo 10 minutitos de charla!

${settings.closing}`
    } else if (tone === 'professional') {
      return `${settings.greeting}

Soy desarrollador web especializado en negocios locales en la zona de ${city}. Al realizar un estudio de mercado sobre ${category.toLowerCase()}, identifique a ${businessName}.

${settings.urgency} la ausencia de presencia digital puede representar una perdida significativa de oportunidades comerciales. Las investigaciones indican que la mayoria de los consumidores realizan busquedas online antes de visitar establecimientos.

Nuestra solucion contempla: ${benefits}.

${settings.connector}, me gustaria presentar un proyecto personalizado para establecer la presencia digital de ${businessName} de forma profesional y eficiente.

${settings.closing}`
    } else {
      return `${settings.greeting}

${businessName} NO TIENE SITIO WEB. En 2024. Esto es un problema serio.

${settings.urgency} Mientras lees este mensaje, alguien esta buscando "${category.toLowerCase()} en ${city}" en Google. Y sabes quien aparece? Tus competidores. ${businessName}? Invisible.

Cada dia sin sitio web es plata perdida. Asi de simple.

Yo creo sitios profesionales con: ${benefits}.

Sin vueltas. Entrego rapido. Y la inversion se paga sola en pocos meses con los nuevos clientes.

${settings.closing}`
    }
  }
}
