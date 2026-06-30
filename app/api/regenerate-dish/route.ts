import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const COURSE_LABELS: Record<string, string> = {
  entree: 'entrée',
  plat: 'plat principal',
  dessert: 'dessert',
}

/* Endpoint léger pour remplacer UN SEUL plat ("Pas envie ?") — réponse courte, peu de tokens, coût minimal */
export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'Clé OpenAI manquante. Ajoutez OPENAI_API_KEY dans .env.local' }, { status: 500 })
  }

  const { answers, course, excludeNames } = await req.json()
  const { restrictions, budget, cuisine, peopleCount } = answers || {}

  if (!course || !COURSE_LABELS[course]) {
    return NextResponse.json({ error: 'Plat invalide' }, { status: 400 })
  }
  if (!Array.isArray(excludeNames) || excludeNames.length === 0) {
    return NextResponse.json({ error: 'Liste de plats déjà proposés manquante' }, { status: 400 })
  }

  const restrictionsTxt = restrictions?.length
    ? `Restrictions alimentaires à respecter impérativement : ${restrictions.join(', ')}.`
    : 'Pas de restrictions alimentaires.'

  const cuisineTxt = cuisine && cuisine !== 'Peu importe' ? `Cuisine préférée : ${cuisine}.` : ''
  const budgetTxt = budget >= 100 ? '100€ ou plus' : `${budget}€`

  const prompt = `Propose UN SEUL ${COURSE_LABELS[course]} différent des plats suivants (déjà proposés, à exclure absolument) : ${excludeNames.join(', ')}.

${restrictionsTxt}
${cuisineTxt}
Budget par personne : ${budgetTxt}.
Pour ${peopleCount || 'plusieurs'} personne(s).

Réponds UNIQUEMENT avec un JSON valide, structuré exactement ainsi, sans markdown :
{ "nom": "Nom du plat", "recette": "Recette simplifiée en 3-5 étapes courtes et numérotées" }`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9,
      max_tokens: 250,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('Réponse vide de l\'IA')

    const data = JSON.parse(content)
    return NextResponse.json(data)
  } catch (err: unknown) {
    console.error('Erreur OpenAI (regenerate-dish):', err)
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
