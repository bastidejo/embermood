import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

/* Endpoint léger pour remplacer UN SEUL film ("Déjà vu ?") — réponse courte, peu de tokens, coût minimal */
export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'Clé OpenAI manquante. Ajoutez OPENAI_API_KEY dans .env.local' }, { status: 500 })
  }

  const { answers, excludeTitles } = await req.json()
  const { style, platforms, restrictions } = answers || {}

  if (!Array.isArray(excludeTitles) || excludeTitles.length === 0) {
    return NextResponse.json({ error: 'Liste de films déjà vus manquante' }, { status: 400 })
  }

  const platformsTxt = platforms?.length
    ? `Plateformes disponibles : ${platforms.join(', ')}.`
    : 'Pas de plateformes précisées, suggère un classique populaire.'

  const prompt = `Propose UN SEUL film ou série différent des titres suivants (déjà vus, à exclure absolument) : ${excludeTitles.join(', ')}.

Style de soirée : ${style || 'non précisé'}.
${platformsTxt}
${restrictions?.length ? `Restrictions alimentaires (sans impact sur le film, ignore) : ${restrictions.join(', ')}.` : ''}

Réponds UNIQUEMENT avec un JSON valide, structuré exactement ainsi, sans markdown :
{ "titre": "Titre du film", "synopsis": "Synopsis court en 2 phrases", "duree": "1h45", "genre": "Comédie" }`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('Réponse vide de l\'IA')

    const data = JSON.parse(content)
    return NextResponse.json(data)
  } catch (err: unknown) {
    console.error('Erreur OpenAI (regenerate-film):', err)
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
