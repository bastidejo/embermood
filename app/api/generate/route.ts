import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'Clé OpenAI manquante. Ajoutez OPENAI_API_KEY dans .env.local' }, { status: 500 })
  }

  const answers = await req.json()
  const {
    people, peopleCount, type, moment, location, locationDetail, style, budget,
    restrictions, platforms, filmsSeries, jeuxSociete, alcool, musique, cuisine,
  } = answers

  const restrictionsTxt = restrictions?.length
    ? `Restrictions alimentaires : ${restrictions.join(', ')}.`
    : 'Pas de restrictions alimentaires.'

  const platformsTxt = platforms?.length
    ? `Plateformes disponibles : ${platforms.join(', ')}.`
    : 'Pas de plateformes précisées.'

  const budgetTxt = budget >= 100 ? '100€ ou plus' : `${budget}€`

  const lieuTxt = locationDetail ? `${location} — ${locationDetail}` : location

  /* Goûts (collectés uniquement quand la soirée est "À la maison") */
  const goutsLignes = [
    filmsSeries?.length ? `Genres de films/séries préférés : ${filmsSeries.join(', ')}.` : '',
    jeuxSociete?.length ? `Genres de jeux de société préférés : ${jeuxSociete.join(', ')}.` : '',
    alcool ? `Alcool : ${alcool}.` : '',
    musique && musique !== 'Peu importe' ? `Ambiance musicale souhaitée : ${musique}.` : '',
    cuisine && cuisine !== 'Peu importe' ? `Cuisine préférée : ${cuisine}.` : '',
  ].filter(Boolean).join('\n- ')

  const isGoingOut = location === 'Sortie nocturne'
  const sortieTxt = isGoingOut
    ? `\nImportant : la soirée a lieu EN SORTIE (${locationDetail || 'sortie nocturne'}), pas à la maison. Adapte tout en conséquence :
- "menu" : suggestions de plats/boissons à commander sur place (pas de recette à préparer soi-même).
- "courses" : laisse les listes vides ou ne garde que ce qu'il faut emporter avant de sortir (tenue, réservation, argent liquide, etc. si pertinent), pas une liste de courses alimentaires.
- "films" : ne propose AUCUN film ni plateforme de streaming, ce n'est pas pertinent pour une sortie.
- "jeux" : propose des jeux/activités adaptés à un contexte de sortie (ambiance, glace-breakers, jeux à faire sur place ou avant de partir), pas des jeux de société classiques.`
    : ''

  const prompt = `Tu es Embermood, un assistant qui planifie des soirées parfaites.

Contexte de la soirée :
- Nombre de personnes : ${people} (exactement ${peopleCount})
- Type : ${type}
- Moment : ${moment}
- Lieu : ${lieuTxt}
- Style : ${style}
- Budget par personne : ${budgetTxt}
- ${restrictionsTxt}
- ${platformsTxt}
${goutsLignes ? `- ${goutsLignes}` : ''}
${sortieTxt}

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

Adapte TOUT au contexte : restrictions alimentaires, budget, lieu, nombre de personnes et style de soirée. Chaque section doit rester cohérente avec les choix faits, ne propose rien de contradictoire avec le lieu ou le type de soirée.
Pour les films, tiens compte des plateformes disponibles (si aucune, suggère des classiques populaires).
Les quantités dans la liste de courses doivent être pour exactement 