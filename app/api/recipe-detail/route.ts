import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

/* Endpoint à la demande pour la recette complète d'un plat — appelé uniquement au clic sur "Recette complète", jamais à la génération initiale (coût maîtrisé) */
export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'Clé OpenAI manquante. Ajoutez OPENAI_API_KEY dans .env.local' }, { status: 500 })
  }

  const { nom, answers } = await req.json()
  const { restrictions, peopleCount } = answers || {}

  if (!nom) {
    return NextResponse.json({ error: 'Nom du plat manquant' }, { status: 400 })
  }

  const restrictionsTxt = restrictions?.length
    ? `Respecte impérativement ces restrictions alimentaires : ${restrictions.join(', ')}.`
    : ''

  const prompt = `Donne la recette complète et détaillée du plat "${nom}", pour ${peopleCount || 4} personne(s).
${restrictionsTxt}

Réponds UNIQUEMENT avec un JSON valide, structuré exactement ainsi, sans markdown :
{
  "ingredients": ["quantité + ingrédient 1", "quantité + ingrédient 2", "..."],
  "etapes": ["Étape 1 détaillée", "Étape 2 détaillée", "..."],
  "tempsPrep": "15 min",
  "tempsCuisson": "30 min"
}`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 700,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('Réponse vide de l\'IA')

    const data = JSON.parse(content)
    return NextResponse.json(data)
  } catch (err: unknown) {
    console.error('Erreur OpenAI (recipe-detail):', err)
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
