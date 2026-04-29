# PitchAgent 🚀

An AI agent that analyzes a Google Maps or Instagram link from any local business and instantly generates a personalized sales pitch ready to send on WhatsApp.

## ✨ Features

- 🔗 Analyzes business via Google Maps or Instagram link
- 🤖 AI-powered pitch generation using Groq (llama-3.3-70b)
- 🌎 Multilingual support: Portuguese, English and Spanish
- 🎯 Tone selector: Informal, Professional or Aggressive
- 📊 Opportunity score based on business profile
- 📱 One-click WhatsApp button
- 📏 Character counter optimized for WhatsApp

## 🛠️ Built With

- [v0](https://v0.dev) — UI generation
- [Vercel](https://vercel.com) — Deployment
- [Groq](https://groq.com) — AI inference (llama-3.3-70b-versatile)
- [Firecrawl](https://firecrawl.dev) — URL scraping

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Groq API Key
- Firecrawl API Key

### Environment Variables

```env
GROQ_API_KEY=your_groq_api_key
FIRECRAWL_API_KEY=your_firecrawl_api_key
```

### Installation

```bash
git clone https://github.com/lschmeil/pitchagent
cd pitchagent
npm install
npm run dev
```

## 📖 How It Works

1. Paste a Google Maps or Instagram link of any local business
2. Select your preferred language and tone
3. Click **Generate Sales Pitch**
4. Get a personalized pitch ready to send on WhatsApp

## 🏆 Built at

Zero to Agent Florianópolis — April 2026

## 📄 License

MIT
