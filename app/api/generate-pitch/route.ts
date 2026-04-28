import { createGroq } from '@ai-sdk/groq'
import { generateText } from 'ai'

type Tone = 'informal' | 'professional' | 'aggressive'
type Language = 'pt-br' | 'en' | 'es'
type OpportunityLevel = 'high' | 'medium' | 'low'

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { url, tone, language } = await request.json() as {
      url: string
      tone: Tone
      language: Language
    }

    if (!url) {
      return Response.json({ error: 'URL is required' }, { status: 400 })
    }

    // Fetch URL content using Jina Reader API (free, no auth required)
    let pageContent = ''
    try {
      const jinaUrl = `https://r.jina.ai/${encodeURIComponent(url)}`
      const response = await fetch(jinaUrl, {
        headers: {
          'Accept': 'text/plain',
        },
      })
      if (response.ok) {
        pageContent = await response.text()
        pageContent = pageContent.slice(0, 8000)
      }
    } catch {
      pageContent = `URL provided: ${url}`
    }

    // Analyze the URL content with Groq to extract business info
    const analysisPrompt = `Analyze this webpage content and extract business information. Return ONLY a JSON object with these fields:
- businessName: the name of the business (string)
- category: the type/category of business like "restaurant", "barbershop", "salon", "gym", "clinic", "store", etc. (string)
- city: the city/location if found (string or null)
- hasWebsite: whether this business appears to have its own professional website, or if this is just a social media/Google listing (boolean - false if it's just Instagram or Google Maps listing)
- description: a brief description of what the business does/offers (string)
- highlights: any notable features, services, or selling points (array of strings, max 3 items)

Webpage content:
${pageContent}

URL: ${url}

Return ONLY valid JSON, no markdown, no explanation.`

    const analysisResult = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt: analysisPrompt,
      temperature: 0.3,
    })

    let businessInfo: {
      businessName: string
      category: string
      city: string | null
      hasWebsite: boolean
      description: string
      highlights: string[]
    }

    try {
      let jsonStr = analysisResult.text.trim()
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim()
      }
      businessInfo = JSON.parse(jsonStr)
    } catch {
      businessInfo = {
        businessName: 'Business',
        category: 'local business',
        city: null,
        hasWebsite: false,
        description: 'Local business',
        highlights: [],
      }
    }

    // Calculate opportunity score
    const opportunity = calculateOpportunityScore(businessInfo.category, businessInfo.hasWebsite, language)

    // Generate the pitch
    const pitchPrompt = buildPitchPrompt(businessInfo, tone, language)

    const pitchResult = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt: pitchPrompt,
      temperature: 0.8,
    })

    return Response.json({
      pitch: pitchResult.text.trim(),
      businessInfo: {
        name: businessInfo.businessName,
        category: businessInfo.category,
        city: businessInfo.city,
        hasWebsite: businessInfo.hasWebsite,
        description: businessInfo.description,
      },
      opportunity,
    }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    })

  } catch (error) {
    console.error('Error generating pitch:', error)
    return Response.json(
      { error: 'Failed to generate pitch' },
      { status: 500 }
    )
  }
}

function calculateOpportunityScore(category: string, hasWebsite: boolean, language: Language): { level: OpportunityLevel; label: string } {
  const categoryLower = category.toLowerCase()
  
  const highDemandCategories = [
    'restaurante', 'restaurant', 'barbearia', 'barbershop', 'barber', 'peluquería',
    'salão', 'salon', 'salón', 'academia', 'gym', 'gimnasio', 'clínica', 'clinic',
    'consultório', 'consultorio', 'pet', 'dentista', 'dentist', 'médico', 'doctor',
    'pizzaria', 'pizzeria', 'pizza', 'hamburgueria', 'burger', 'hamburguesería', 'delivery',
    'café', 'coffee', 'cafetería', 'padaria', 'bakery', 'panadería', 'bar', 'pub',
    'spa', 'estética', 'esthetics', 'manicure', 'nail', 'uñas',
    'tatuagem', 'tattoo', 'tatuaje', 'fisioterapia', 'physiotherapy',
    'veterinário', 'veterinary', 'veterinario', 'hotel', 'pousada', 'hostel'
  ]
  
  const mediumDemandCategories = [
    'loja', 'store', 'tienda', 'shop', 'oficina', 'workshop', 'taller',
    'escritório', 'office', 'advocacia', 'law', 'abogado', 'advogado', 'lawyer',
    'contabilidade', 'accounting', 'contabilidad', 'imobiliária', 'real estate', 'inmobiliaria',
    'escola', 'school', 'escuela', 'curso', 'course', 'auto', 'car', 'carro',
    'mecânica', 'mechanic', 'mecánico', 'elétrica', 'electric', 'eléctrica',
    'construção', 'construction', 'construcción', 'arquitetura', 'architecture', 'arquitectura',
    'fotografia', 'photography', 'fotografía', 'design', 'marketing', 'agência', 'agency', 'agencia'
  ]
  
  const lowDemandCategories = [
    'indústria', 'industry', 'industria', 'fábrica', 'factory',
    'atacado', 'wholesale', 'mayorista', 'distribuidora', 'distributor'
  ]
  
  const isHighDemand = highDemandCategories.some(cat => categoryLower.includes(cat))
  const isMediumDemand = mediumDemandCategories.some(cat => categoryLower.includes(cat))
  const isLowDemand = lowDemandCategories.some(cat => categoryLower.includes(cat))
  
  const labels = {
    'pt-br': { high: 'Alta Oportunidade', medium: 'Média Oportunidade', low: 'Baixa Oportunidade' },
    'en': { high: 'High Opportunity', medium: 'Medium Opportunity', low: 'Low Opportunity' },
    'es': { high: 'Alta Oportunidad', medium: 'Oportunidad Media', low: 'Baja Oportunidad' },
  }
  
  const langLabels = labels[language] || labels['en']
  
  if (!hasWebsite) {
    return { level: 'high', label: langLabels.high }
  }
  
  if (hasWebsite && isHighDemand) {
    return { level: 'medium', label: langLabels.medium }
  }
  
  if (hasWebsite && isMediumDemand) {
    return { level: 'medium', label: langLabels.medium }
  }
  
  if (hasWebsite && isLowDemand) {
    return { level: 'low', label: langLabels.low }
  }
  
  return { level: 'medium', label: langLabels.medium }
}

function buildPitchPrompt(
  businessInfo: {
    businessName: string
    category: string
    city: string | null
    hasWebsite: boolean
    description: string
    highlights: string[]
  },
  tone: Tone,
  language: Language
): string {
  const toneInstructions = {
    informal: {
      'pt-br': 'Use um tom amigável e descontraído, como se estivesse conversando com um amigo. Use expressões brasileiras naturais como "E aí", "beleza", "show", "top". Seja caloroso mas profissional.',
      'en': 'Use a friendly, casual tone like chatting with a friend. Use natural expressions like "Hey", "awesome", "amazing". Be warm but professional.',
      'es': 'Usa un tono amigable y relajado, como si hablaras con un amigo. Usa expresiones naturales como "Hola", "genial", "increíble". Sé cálido pero profesional.',
    },
    professional: {
      'pt-br': 'Use um tom formal e corporativo. Seja direto e objetivo, focando em dados e resultados. Use linguagem empresarial mas acessível.',
      'en': 'Use a formal, corporate tone. Be direct and objective, focusing on data and results. Use business language but keep it accessible.',
      'es': 'Usa un tono formal y corporativo. Sé directo y objetivo, enfocándote en datos y resultados. Usa lenguaje empresarial pero accesible.',
    },
    aggressive: {
      'pt-br': 'Use um tom direto e urgente. Crie senso de urgência e escassez. Destaque o que o negócio está perdendo por não ter um site. Seja persuasivo e incisivo.',
      'en': 'Use a direct and urgent tone. Create a sense of urgency and scarcity. Highlight what the business is missing by not having a website. Be persuasive and incisive.',
      'es': 'Usa un tono directo y urgente. Crea un sentido de urgencia y escasez. Destaca lo que el negocio está perdiendo por no tener un sitio web. Sé persuasivo e incisivo.',
    },
  }

  const languageInstructions = {
    'pt-br': `Write the entire pitch in Brazilian Portuguese. Use proper Portuguese accents (ã, ç, á, é, í, ó, ú, â, ê, ô). Use Brazilian expressions and greetings naturally.`,
    'en': `Write the entire pitch in American English. Use natural American expressions and greetings.`,
    'es': `Write the entire pitch in Spanish. Use proper Spanish accents (á, é, í, ó, ú, ñ, ¡, ¿). Use natural Spanish expressions and greetings.`,
  }

  const websiteContext = businessInfo.hasWebsite
    ? 'This business already has a website. Focus on offering a REDESIGN or MODERNIZATION of their current site, mentioning improvements, mobile optimization, SEO, and modern design trends.'
    : 'This business does NOT have a website yet. Focus on the OPPORTUNITY they are missing - customers searching online, competitors who do have websites, 24/7 visibility, professional credibility.'

  const highlightsText = businessInfo.highlights.length > 0
    ? `Notable features/services: ${businessInfo.highlights.join(', ')}`
    : ''

  return `You are an expert sales copywriter creating a WhatsApp message to pitch website development services to a local business owner.

Business Information:
- Name: ${businessInfo.businessName}
- Category: ${businessInfo.category}
- Location: ${businessInfo.city || 'not specified'}
- Description: ${businessInfo.description}
${highlightsText}

Context: ${websiteContext}

${languageInstructions[language]}

Tone: ${toneInstructions[tone][language]}

Requirements:
1. Start with a personalized greeting mentioning the business name
2. Show you know something specific about their business
3. Present the value proposition clearly
4. Include a soft call-to-action
5. Keep it under 800 characters (ideal for WhatsApp)
6. Do NOT use markdown formatting
7. Do NOT include subject lines or signatures
8. Use appropriate emojis sparingly (2-4 maximum)

Generate ONLY the pitch message, nothing else.`
}
