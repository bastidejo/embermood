import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'Clé OpenAI manquante. Ajoutez OPENAI_API_KEY dans .env.local' }, { status: 500 })
  }

  const answers = await req.json()
  const { people, type, location, style, budget, restrictions, platforms } = answers

  const restrictionsTxt = restrictions?.length
    ? `Restrictions alimentaires : ${restrictions.join(', ')}.`
    : 'Pas de restrictions alimentaires.'

  const platformsTxt = platforms?.length
    ? `Plateformes disponibles : ${platforms.join(', ')}.`
    : 'Pas de plateformes précisées.'

  const budgetTxt = budget >= 100 ? '100€ ou plus' : `${budget}€`

  const prompt = `Tu es Embermood, un assistant qui planifie des soirées parfaites.

Contexte de la soirée :
- Nombre de personnes : ${people}
- Type : ${type}
- Lieu : ${location}
- Style : ${style}
- Budget par personne : ${budgetTxt}
- ${restrictionsTxt}
- ${platformsTxt}

Génère un planning de soirée complet et adapté. Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans explication, structuré exactement ainsi :

{
  "planning": [
    { "moment": "Apéro & accueil", "description": "..." },
    { "moment": "Activité principale", "description": "..." },
    { "moment": "Repas", "description": "..." },
    { "moment": "Activité secondaire", "description": "..." },
    { "moment": "After / Fin de soirée", "description": "..." }
  ],
  "menu": {
    "entree": { "nom": "Nom du plat", "recette": "Recette simplifiée en 3-5 étapes courtes" },
    "plat": { "nom": "Nom du plat", "recette": "Recette simplifiée en 3-5 étapes courtes" },
    "dessert": { "nom": "Nom du plat", "recette": "Recette simplifiée en 3-5 étapes courtes" }
  },
  "courses": [
    { "rayon": "Fruits & Légumes", "items": ["item 1", "item 2"] },
    { "rayon": "Viandes & Poissons", "items": ["item 1"] },
    { "rayon": "Épicerie", "items": ["item 1", "item 2", "item 3"] },
    { "rayon": "Boissons", "items": ["item 1", "item 2"] },
    { "rayon": "Produits frais", "items": ["item 1"] }
  ],
  "jeux": [
    { "nom": "Nom du jeu", "description": "Description courte", "joueurs": "2-6 joueurs", "duree": "30 min" },
    { "nom": "Nom du jeu", "description": "Description courte", "joueurs": "3-8 joueurs", "duree": "45 min" },
    { "nom": "Nom du jeu", "description": "Description courte", "joueurs": "2-4 joueurs", "duree": "20 min" }
  ],
  "films": [
    { "titre": "Titre du film", "synopsis": "Synopsis court en 2 phrases", "duree": "1h45", "genre": "Comédie" },
    { "titre": "Titre du film", "synopsis": "Synopsis court en 2 phrases", "duree": "2h10", "genre": "Action" }
  ]
}

Adapte TOUT au contexte : restrictions alimentaires, budget, lieu, nombre de personnes et style de soirée.
Pour les films, tiens compte des plateformes disponibles (si aucune, suggère des classiques populaires).
Les quantités dans la liste de courses doivent être pour ${people}.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('Réponse vide de l\'IA')

    const data = JSON.parse(content)
    return NextResponse.json(data)
  } catch (err: unknown) {
    console.error('Erreur OpenAI:', err)
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
