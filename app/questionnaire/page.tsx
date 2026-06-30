'use client'

import { useState } from 'react'
import Link from 'next/link'

/* ─── Types ─────────────────────────────────────────────── */
type StepKey = 'people' | 'type' | 'moment' | 'location' | 'gouts' | 'style' | 'budget'

type Answers = {
  peopleCount: number
  people: string
  type: string
  moment: string
  location: string
  locationDetail: string
  filmsSeries: string[]
  jeuxSociete: string[]
  alcool: string
  musique: string
  cuisine: string
  style: string
  budget: number
  restrictions: string[]
  platforms: string[]
}

type PlanningItem = { moment: string; description: string }
type RecipeDetail = { ingredients: string[]; etapes: string[]; tempsPrep: string; tempsCuisson: string }
type MenuItem = { nom: string; recette: string; details?: RecipeDetail }
type CourseKey = 'entree' | 'plat' | 'dessert'
type CourseRayon = { rayon: string; items: string[] }
type Jeu = { nom: string; description: string; joueurs: string; duree: string }
type Film = { titre: string; synopsis: string; duree: string; genre: string }

type Results = {
  planning: PlanningItem[]
  menu: { entree: MenuItem; plat: MenuItem; dessert: MenuItem }
  courses: CourseRayon[]
  jeux: Jeu[]
  films: Film[]
}

/* ─── Constantes ─────────────────────────────────────────── */
const RESTRICTIONS = ['Végétarien', 'Vegan', 'Sans gluten', 'Sans lactose', 'Halal', 'Kosher']
const PLATFORMS = ['Netflix', 'Amazon Prime', 'Disney+', 'Apple TV+', 'Canal+']
const RESULT_TABS = ['Planning', 'Menu', 'Courses', 'Jeux', 'Films'] as const

const TYPE_OPTIONS_DUO = ['En couple', 'Entre amis', 'En famille — avec enfants', 'En famille — adultes uniquement']
const TYPE_OPTIONS_GROUP = ['Entre amis', 'En famille — avec enfants', 'En famille — adultes uniquement']

const MOMENT_OPTIONS = ['☀️ En journée', '🌙 En soirée / nuit']

const LOCATION_OPTIONS = ['À la maison', 'En extérieur (jardin, terrasse, parc)', 'En vacances (location, camping, hôtel)', 'Sortie nocturne']
const LOCATION_DETAILS = ['Restaurant', 'Boîte de nuit', 'Pub / Bar', 'Bowling', 'Karaoké', 'Autre sortie']

const FILMS_GENRES = ['Comédie', 'Action & Aventure', 'Thriller & Policier', 'Drame', 'Romance', 'Horreur & Épouvante', 'Science-fiction & Fantastique', 'Animation', 'Documentaire']
const JEUX_GENRES = ['Ambiance & rigolade', 'Stratégie & réflexion', 'Cartes', 'Coopératif', 'Enquête / Murder party', 'Bluff & déduction']
const ALCOOL_OPTIONS = ['Avec alcool', 'Sans alcool', 'Mix des deux']
const MUSIQUE_OPTIONS = ['Chill / Lounge', 'Dance / Électro', 'Live / Rock', 'Peu importe']
const CUISINE_OPTIONS = ['Peu importe', 'Française', 'Italienne', 'Asiatique', 'Mexicaine / Tex-Mex', 'Méditerranéenne']

const STYLE_OPTIONS = ['Chill & détendu 🛋️', 'Dynamique & festif 🎉', 'Mix des deux 🎭']

/* Nombre max de "Déjà vu ?" (remplacements de film) autorisés par soirée générée — limite le coût OpenAI */
const MAX_FILM_REROLLS = 3

/* Nombre max de "Pas envie ?" (remplacements de plat) autorisés par soirée générée — limite le coût OpenAI */
const MAX_DISH_REROLLS = 3

/* ─── Styles communs ─────────────────────────────────────── */
const S = {
  page: {
    minHeight: '100vh',
    background: '#0a0a14',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  center: {
    minHeight: '100vh',
    background: '#0a0a14',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: '2rem 1.5rem',
    textAlign: 'center' as const,
  },
  card: (active: boolean) => ({
    width: '100%',
    padding: '1rem 1.25rem',
    borderRadius: '12px',
    background: active ? 'rgba(167,139,250,0.12)' : '#13131f',
    border: `1.5px solid ${active ? '#A78BFA' : '#1f1f2e'}`,
    cursor: 'pointer',
    textAlign: 'left' as const,
    color: active ? '#A78BFA' : '#d1d5db',
    fontFamily: "'Quicksand', sans-serif",
    fontWeight: active ? 700 : 500,
    fontSize: '0.95rem',
    transition: 'all 0.15s ease',
    marginBottom: '0.75rem',
  }),
  btn: (variant: 'primary' | 'ghost' = 'primary') => ({
    display: 'inline-block',
    padding: variant === 'primary' ? '14px 36px' : '10px 20px',
    borderRadius: '50px',
    fontFamily: "'Quicksand', sans-serif",
    fontWeight: 700,
    fontSize: variant === 'primary' ? '1rem' : '0.875rem',
    cursor: 'pointer',
    border: 'none',
    background: variant === 'primary'
      ? 'linear-gradient(135deg, #A78BFA, #7C3AED)'
      : 'transparent',
    color: variant === 'primary' ? 'white' : '#6b7280',
    textDecoration: 'none',
  }),
  pill: (active: boolean) => ({
    padding: '8px 14px',
    borderRadius: '50px',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: `1.5px solid ${active ? '#A78BFA' : '#1f1f2e'}`,
    background: active ? 'rgba(167,139,250,0.15)' : '#13131f',
    color: active ? '#A78BFA' : '#6b7280',
    fontFamily: "'Quicksand', sans-serif",
    transition: 'all 0.15s',
  }),
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    border: '1.5px solid #1f1f2e',
    background: '#13131f',
    color: '#A78BFA',
    fontSize: '1.4rem',
    cursor: 'pointer',
    fontFamily: "'Quicksand', sans-serif",
  },
  fieldLabel: {
    color: '#9ca3af',
    fontSize: '0.875rem',
    marginBottom: '0.75rem',
  },
}

/* ─── Composant principal ────────────────────────────────── */
export default function Questionnaire() {
  const [stepKey, setStepKey] = useState<StepKey>('people')
  const [answers, setAnswers] = useState<Answers>({
    peopleCount: 0,
    people: '',
    type: '',
    moment: '',
    location: '',
    locationDetail: '',
    filmsSeries: [],
    jeuxSociete: [],
    alcool: '',
    musique: '',
    cuisine: '',
    style: '',
    budget: 20,
    restrictions: [],
    platforms: [],
  })
  const [phase, setPhase] = useState<'quiz' | 'loading' | 'results' | 'flame'>('quiz')
  const [results, setResults] = useState<Results | null>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<typeof RESULT_TABS[number]>('Planning')

  const [showGroupStepper, setShowGroupStepper] = useState(false)
  const [groupCount, setGroupCount] = useState(3)
  const [showLocationDetail, setShowLocationDetail] = useState(false)

  /* "Déjà vu ?" — remplace un film suggéré, avec une limite pour éviter les surcoûts OpenAI */
  const [filmRerollsLeft, setFilmRerollsLeft] = useState(MAX_FILM_REROLLS)
  const [rerollingIndex, setRerollingIndex] = useState<number | null>(null)

  /* "Pas envie ?" — remplace un plat, et "Recette complète" — charge la recette détaillée à la demande */
  const [dishRerollsLeft, setDishRerollsLeft] = useState(MAX_DISH_REROLLS)
  const [rerollingDish, setRerollingDish] = useState<CourseKey | null>(null)
  const [expandedRecipe, setExpandedRecipe] = useState<Record<string, boolean>>({})
  const [loadingRecipeDetail, setLoadingRecipeDetail] = useState<CourseKey | null>(null)

  const isGoingOut = answers.location === 'Sortie nocturne'
  // "Vos goûts" (et le bloc Plateformes) concernent toute soirée qui ne soit pas une sortie :
  // à la maison, en extérieur (jardin/terrasse/parc) ou en vacances
  const isAtHome = answers.location !== '' && !isGoingOut
  const isDaytime = answers.moment === MOMENT_OPTIONS[0]

  const availableLocationDetails = isDaytime
    ? LOCATION_DETAILS.filter(d => d !== 'Boîte de nuit')
    : LOCATION_DETAILS

  /* Séquence des étapes en fonction des réponses (pour l'affichage de progression) */
  const sequence: StepKey[] = [
    'people',
    ...(answers.peopleCount === 1 ? [] : ['type' as StepKey]),
    'moment',
    'location',
    ...(isAtHome ? ['gouts' as StepKey] : []),
    'style',
    'budget',
  ]
  const currentIndex = Math.max(1, sequence.indexOf(stepKey) + 1)
  const progress = (currentIndex / sequence.length) * 100

  /* Champ simple (texte) */
  const setField = (field: 'type' | 'moment' | 'style' | 'alcool' | 'musique' | 'cuisine', value: string) => {
    setAnswers(prev => ({ ...prev, [field]: value }))
  }

  /* Sélection simple qui avance à l'étape suivante */
  const selectAndAdvance = (field: 'type' | 'moment' | 'style', value: string, next: StepKey) => {
    setField(field, value)
    setTimeout(() => setStepKey(next), 180)
  }

  /* Nombre exact de personnes */
  const choosePeople = (n: number) => {
    const label = n === 1 ? 'Solo' : n === 2 ? '2 personnes' : `${n} personnes`
    setAnswers(prev => ({
      ...prev,
      peopleCount: n,
      people: label,
      // Solo : pas de question "type de soirée" (couple/amis/famille n'a pas de sens seul)
      // "En couple" n'a plus de sens dès qu'on dépasse 2 personnes
      type: n === 1 ? 'Solo' : n > 2 && prev.type === 'En couple' ? '' : prev.type,
    }))
    setShowGroupStepper(false)
    // Le mode solo saute directement la page "type de soirée"
    setTimeout(() => setStepKey(n === 1 ? 'moment' : 'type'), 180)
  }

  /* Lieu — avec sous-choix pour "Sortie nocturne" */
  const selectLocation = (value: string) => {
    if (value === 'Sortie nocturne') {
      setShowLocationDetail(true)
      return
    }
    setAnswers(prev => ({ ...prev, location: value, locationDetail: '' }))
    // Tout lieu hors "Sortie nocturne" (maison, extérieur, vacances) passe par l'étape "Vos goûts"
    setTimeout(() => setStepKey('gouts'), 180)
  }

  const selectLocationDetail = (detail: string) => {
    setAnswers(prev => ({ ...prev, location: 'Sortie nocturne', locationDetail: detail }))
    setShowLocationDetail(false)
    setTimeout(() => setStepKey('style'), 180)
  }

  /* Toggle multi-select (restrictions / plateformes / films / jeux) */
  const toggle = (field: 'restrictions' | 'platforms' | 'filmsSeries' | 'jeuxSociete', value: string) => {
    setAnswers(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value],
    }))
  }

  /* Appel API */
  const generate = async () => {
    setError('')
    setPhase('loading')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur serveur')
      setResults(data)
      setFilmRerollsLeft(MAX_FILM_REROLLS)
      setDishRerollsLeft(MAX_DISH_REROLLS)
      setExpandedRecipe({})
      setPhase('results')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
      setPhase('quiz')
    }
  }

  /* "Déjà vu ?" — remplace un seul film par un autre, limité pour éviter les surcoûts OpenAI */
  const rerollFilm = async (index: number) => {
    if (!results || filmRerollsLeft <= 0 || rerollingIndex !== null) return
    setRerollingIndex(index)
    try {
      const excludeTitles = results.films.map(f => f.titre)
      const res = await fetch('/api/regenerate-film', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, excludeTitles }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur serveur')
      setResults(prev => prev ? { ...prev, films: prev.films.map((f, i) => (i === index ? data : f)) } : prev)
      setFilmRerollsLeft(c => c - 1)
    } catch (e: unknown) {
      console.error(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setRerollingIndex(null)
    }
  }

  /* "Pas envie ?" — remplace un seul plat par un autre, limité pour éviter les surcoûts OpenAI */
  const rerollDish = async (course: CourseKey) => {
    if (!results || dishRerollsLeft <= 0 || rerollingDish !== null) return
    setRerollingDish(course)
    try {
      const excludeNames = [results.menu.entree.nom, results.menu.plat.nom, results.menu.dessert.nom]
      const res = await fetch('/api/regenerate-dish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, course, excludeNames }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur serveur')
      setResults(prev => prev ? { ...prev, menu: { ...prev.menu, [course]: data } } : prev)
      setExpandedRecipe(prev => ({ ...prev, [course]: false }))
      setDishRerollsLeft(c => c - 1)
    } catch (e: unknown) {
      console.error(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setRerollingDish(null)
    }
  }

  /* "Recette complète" — charge la version détaillée à la demande (jamais générée d'office, pour limiter le coût) */
  const toggleFullRecipe = async (course: CourseKey) => {
    if (!results) return
    if (results.menu[course].details) {
      setExpandedRecipe(prev => ({ ...prev, [course]: !prev[course] }))
      return
    }
    setLoadingRecipeDetail(course)
    try {
      const res = await fetch('/api/recipe-detail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: results.menu[course].nom, answers }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur serveur')
      setResults(prev => prev ? { ...prev, menu: { ...prev.menu, [course]: { ...prev.menu[course], details: data } } } : prev)
      setExpandedRecipe(prev => ({ ...prev, [course]: true }))
    } catch (e: unknown) {
      console.error(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoadingRecipeDetail(null)
    }
  }

  /* Reset */
  const reset = () => {
    setStepKey('people')
    setAnswers({
      peopleCount: 0,
      people: '',
      type: '',
      moment: '',
      location: '',
      locationDetail: '',
      filmsSeries: [],
      jeuxSociete: [],
      alcool: '',
      musique: '',
      cuisine: '',
      style: '',
      budget: 20,
      restrictions: [],
      platforms: [],
    })
    setShowGroupStepper(false)
    setGroupCount(3)
    setShowLocationDetail(false)
    setResults(null)
    setFilmRerollsLeft(MAX_FILM_REROLLS)
    setRerollingIndex(null)
    setDishRerollsLeft(MAX_DISH_REROLLS)
    setRerollingDish(null)
    setExpandedRecipe({})
    setLoadingRecipeDetail(null)
    setPhase('quiz')
    setError('')
  }

  /* Retour (gère les sous-étapes et les sauts conditionnels) */
  const goBack = () => {
    if (stepKey === 'people' && showGroupStepper) { setShowGroupStepper(false); return }
    if (stepKey === 'location' && showLocationDetail) { setShowLocationDetail(false); return }
    if (stepKey === 'type') { setStepKey('people'); return }
    if (stepKey === 'moment') { setStepKey(answers.peopleCount === 1 ? 'people' : 'type'); return }
    if (stepKey === 'location') { setStepKey('moment'); return }
    if (stepKey === 'gouts') { setStepKey('location'); return }
    if (stepKey === 'style') { setStepKey(isAtHome ? 'gouts' : 'location'); return }
    if (stepKey === 'budget') { setStepKey('style'); return }
  }

  /* ── Redirect Flame ── */
  if (phase === 'flame') {
    return (
      <div style={S.center}>
        <span style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔥</span>
        <h2 style={{ color: '#FF6B35', fontFamily: "'Quicksand'", fontWeight: 700, fontSize: '1.6rem', marginBottom: '0.75rem' }}>
          Tu veux une soirée intime ?
        </h2>
        <p style={{ color: '#9ca3af', maxWidth: '280px', marginBottom: '2rem', lineHeight: 1.5 }}>
          Flame est fait pour ça — ton assistant soirée couple.
        </p>
        <a
          href="https://flamecouple.fr"
          style={{ ...S.btn(), background: 'linear-gradient(135deg, #FF6B35, #D94F1A)', color: 'white', marginBottom: '1rem' }}
        >
          Découvrir Flame 🔥
        </a>
        <button onClick={() => setPhase('quiz')} style={S.btn('ghost')}>
          ← Retour
        </button>
      </div>
    )
  }

  /* ── Chargement ── */
  if (phase === 'loading') {
    return (
      <div style={S.center}>
        <div style={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          border: '3px solid #1f1f2e',
          borderTopColor: '#A78BFA',
          animation: 'spin 0.9s linear infinite',
          marginBottom: '1.5rem',
        }} />
        <p style={{ color: '#A78BFA', fontFamily: "'Quicksand'", fontWeight: 700, fontSize: '1.1rem' }}>
          Embermood prépare votre soirée…
        </p>
        <p style={{ color: '#4b5563', marginTop: '0.5rem', fontSize: '0.85rem' }}>
          L&apos;IA compose votre planning personnalisé
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  /* ── Résultats ── */
  if (phase === 'results' && results) {
    return (
      <div style={{ ...S.page, padding: '0 0 4rem' }}>
        <style>{`
          @media print {
            .no-print { display: none !important; }
            .print-only { display: block !important; }
            body { background: white !important; }
          }
        `}</style>

        {/* Header résultats */}
        <div className="no-print" style={{ padding: '1.5rem 1.5rem 1rem', borderBottom: '1px solid #1f1f2e' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', gap: '0.5rem', flexWrap: 'wrap' as const }}>
            <h1 style={{ color: '#A78BFA', fontFamily: "'Quicksand'", fontWeight: 700, fontSize: '1.3rem' }}>
              🌙 Votre soirée est prête !
            </h1>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => window.print()} style={{ ...S.btn('ghost'), fontSize: '0.8rem', padding: '6px 14px' }}>
                🖨️ PDF
              </button>
              <button onClick={reset} style={{ ...S.btn('ghost'), fontSize: '0.8rem', padding: '6px 14px' }}>
                Recommencer
              </button>
            </div>
          </div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '4px' }}>
            {RESULT_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '50px',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: "'Quicksand'",
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  whiteSpace: 'nowrap' as const,
                  background: activeTab === tab ? '#A78BFA' : '#13131f',
                  color: activeTab === tab ? 'white' : '#6b7280',
                  transition: 'all 0.15s',
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="no-print" style={{ padding: '1.5rem', maxWidth: '640px', margin: '0 auto', width: '100%' }}>
          {/* Tab: Planning */}
          {activeTab === 'Planning' && (
            <div>
              {results.planning.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(167,139,250,0.15)', border: '1.5px solid #A78BFA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A78BFA', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    {i < results.planning.length - 1 && (
                      <div style={{ width: 1, flex: 1, background: '#1f1f2e', margin: '4px 0' }} />
                    )}
                  </div>
                  <div style={{ paddingBottom: '0.75rem' }}>
                    <p style={{ color: '#A78BFA', fontWeight: 700, marginBottom: '0.25rem', fontFamily: "'Quicksand'" }}>{item.moment}</p>
                    <p style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: 1.5 }}>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab: Menu */}
          {activeTab === 'Menu' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ color: '#4b5563', fontSize: '0.78rem' }}>
                {dishRerollsLeft > 0
                  ? `"Pas envie ?" disponible ${dishRerollsLeft} fois`
                  : 'Limite de remplacements atteinte'}
              </p>
              {(['entree', 'plat', 'dessert'] as const).map(course => {
                const dish = results.menu[course]
                const isExpanded = !!expandedRecipe[course]
                return (
                  <div key={course} style={{ background: '#13131f', borderRadius: '12px', padding: '1.25rem', border: '1px solid #1f1f2e' }}>
                    <p style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.4rem' }}>
                      {course === 'entree' ? 'Entrée' : course === 'plat' ? 'Plat' : 'Dessert'}
                    </p>
                    <p style={{ color: '#A78BFA', fontWeight: 700, fontFamily: "'Quicksand'", fontSize: '1.05rem', marginBottom: '0.5rem' }}>
                      {dish.nom}
                    </p>
                    <p style={{ color: '#9ca3af', fontSize: '0.85rem', lineHeight: 1.6, whiteSpace: 'pre-line' as const, marginBottom: '0.75rem' }}>
                      {dish.recette || '⚠️ Recette non générée par l\'IA — réessaie.'}
                    </p>

                    {isExpanded && dish.details && (
                      <div style={{ background: '#0a0a14', borderRadius: '10px', padding: '1rem', marginBottom: '0.75rem', border: '1px solid #1f1f2e' }}>
                        <p style={{ color: '#FFD700', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.5rem' }}>Ingrédients</p>
                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 0.75rem' }}>
                          {dish.details.ingredients.map((ing, j) => (
                            <li key={j} style={{ color: '#9ca3af', fontSize: '0.85rem', padding: '2px 0' }}>· {ing}</li>
                          ))}
                        </ul>
                        <p style={{ color: '#FFD700', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.5rem' }}>Étapes</p>
                        <ol style={{ paddingLeft: '1.1rem', margin: '0 0 0.75rem' }}>
                          {dish.details.etapes.map((etape, j) => (
                            <li key={j} style={{ color: '#9ca3af', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '4px' }}>{etape}</li>
                          ))}
                        </ol>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>⏱ Prépa : {dish.details.tempsPrep}</span>
                          <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>🔥 Cuisson : {dish.details.tempsCuisson}</span>
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' as const }}>
                      <button
                        onClick={() => toggleFullRecipe(course)}
                        style={{ ...S.btn('ghost'), fontSize: '0.78rem', padding: '5px 12px' }}
                      >
                        {loadingRecipeDetail === course ? '…' : isExpanded ? '📖 Masquer la recette complète' : '📖 Recette complète'}
                      </button>
                      <button
                        onClick={() => rerollDish(course)}
                        disabled={dishRerollsLeft <= 0 || rerollingDish !== null}
                        style={{
                          ...S.btn('ghost'),
                          fontSize: '0.78rem',
                          padding: '5px 12px',
                          opacity: dishRerollsLeft <= 0 ? 0.4 : 1,
                          cursor: dishRerollsLeft <= 0 ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {rerollingDish === course ? '…' : '🔁 Pas envie ?'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Tab: Courses */}
          {activeTab === 'Courses' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {results.courses.map((rayon, i) => (
                <div key={i} style={{ background: '#13131f', borderRadius: '12px', padding: '1.25rem', border: '1px solid #1f1f2e' }}>
                  <p style={{ color: '#FFD700', fontWeight: 700, fontFamily: "'Quicksand'", marginBottom: '0.75rem' }}>
                    {rayon.rayon}
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {rayon.items.map((item, j) => (
                      <li key={j} style={{ color: '#9ca3af', fontSize: '0.9rem', padding: '4px 0', borderBottom: j < rayon.items.length - 1 ? '1px solid #1f1f2e' : 'none' }}>
                        · {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Tab: Jeux */}
          {activeTab === 'Jeux' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {results.jeux.map((jeu, i) => (
                <div key={i} style={{ background: '#13131f', borderRadius: '12px', padding: '1.25rem', border: '1px solid #1f1f2e' }}>
                  <p style={{ color: '#A78BFA', fontWeight: 700, fontFamily: "'Quicksand'", fontSize: '1.05rem', marginBottom: '0.4rem' }}>
                    🎲 {jeu.nom}
                  </p>
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem', lineHeight: 1.5 }}>
                    {jeu.description}
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>👥 {jeu.joueurs}</span>
                    <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>⏱ {jeu.duree}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab: Films */}
          {activeTab === 'Films' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ color: '#4b5563', fontSize: '0.78rem' }}>
                {filmRerollsLeft > 0
                  ? `"Déjà vu ?" disponible ${filmRerollsLeft} fois`
                  : 'Limite de remplacements atteinte'}
              </p>
              {results.films.map((film, i) => (
                <div key={i} style={{ background: '#13131f', borderRadius: '12px', padding: '1.25rem', border: '1px solid #1f1f2e' }}>
                  <p style={{ color: '#A78BFA', fontWeight: 700, fontFamily: "'Quicksand'", fontSize: '1.05rem', marginBottom: '0.25rem' }}>
                    🎬 {film.titre}
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#FFD700', fontSize: '0.78rem' }}>{film.genre}</span>
                    <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>⏱ {film.duree}</span>
                  </div>
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                    {film.synopsis}
                  </p>
                  <button
                    onClick={() => rerollFilm(i)}
                    disabled={filmRerollsLeft <= 0 || rerollingIndex !== null}
                    style={{
                      ...S.btn('ghost'),
                      fontSize: '0.78rem',
                      padding: '5px 12px',
                      opacity: filmRerollsLeft <= 0 ? 0.4 : 1,
                      cursor: filmRerollsLeft <= 0 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {rerollingIndex === i ? '…' : '👀 Déjà vu ?'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bloc dédié à l'impression / export PDF — toutes les sections, masqué à l'écran */}
        <div className="print-only" style={{ display: 'none', padding: '2rem', color: '#111', background: 'white' }}>
          <h1 style={{ fontFamily: "'Quicksand'", marginBottom: '1.5rem' }}>🌙 Votre soirée Embermood</h1>

          <h2 style={{ marginTop: '1.5rem' }}>Planning</h2>
          {results.planning.map((item, i) => (
            <p key={i}><strong>{item.moment}</strong> — {item.description}</p>
          ))}

          <h2 style={{ marginTop: '1.5rem' }}>Menu</h2>
          {(['entree', 'plat', 'dessert'] as const).map(course => (
            <p key={course}><strong>{results.menu[course].nom}</strong> — {results.menu[course].recette}</p>
          ))}

          <h2 style={{ marginTop: '1.5rem' }}>Liste de courses</h2>
          {results.courses.map((rayon, i) => (
            <p key={i}><strong>{rayon.rayon}</strong> : {rayon.items.join(', ')}</p>
          ))}

          <h2 style={{ marginTop: '1.5rem' }}>Jeux</h2>
          {results.jeux.map((jeu, i) => (
            <p key={i}><strong>{jeu.nom}</strong> ({jeu.joueurs}, {jeu.duree}) — {jeu.description}</p>
          ))}

          <h2 style={{ marginTop: '1.5rem' }}>Films</h2>
          {results.films.map((film, i) => (
            <p key={i}><strong>{film.titre}</strong> ({film.genre}, {film.duree}) — {film.synopsis}</p>
          ))}
        </div>
      </div>
    )
  }

  /* ── Quiz ── */
  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem' }}>
        {(stepKey !== 'people' || showGroupStepper) ? (
          <button onClick={goBack} style={S.btn('ghost')}>
            ← Retour
          </button>
        ) : (
          <Link href="/" style={{ ...S.btn('ghost'), textDecoration: 'none' }}>
            ← Accueil
          </Link>
        )}
        <span style={{ color: '#4b5563', fontSize: '0.875rem', fontWeight: 600 }}>
          {currentIndex} / {sequence.length}
        </span>
      </div>

      {/* Barre de progression */}
      <div style={{ height: 3, background: '#1f1f2e', margin: '0 1.5rem', borderRadius: 2 }}>
        <div
          style={{
            height: '100%',
            background: 'linear-gradient(90deg, #A78BFA, #FFD700)',
            width: `${progress}%`,
            borderRadius: 2,
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, padding: '2rem 1.5rem', maxWidth: 480, margin: '0 auto', width: '100%' }}>

        {/* Nombre de personnes */}
        {stepKey === 'people' && (
          <>
            <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👥</p>
            <h2 style={{ color: 'white', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: '1.4rem', marginBottom: '1.75rem' }}>
              Combien êtes-vous ?
            </h2>

            {!showGroupStepper ? (
              <div>
                <button onClick={() => choosePeople(1)} style={S.card(answers.peopleCount === 1)}>
                  Solo
                </button>
                <button onClick={() => choosePeople(2)} style={S.card(answers.peopleCount === 2)}>
                  2 personnes
                </button>
                <button
                  onClick={() => { setGroupCount(answers.peopleCount > 2 ? answers.peopleCount : 3); setShowGroupStepper(true) }}
                  style={S.card(answers.peopleCount > 2)}
                >
                  Un groupe {answers.peopleCount > 2 ? `— ${answers.peopleCount} personnes` : ''}
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center' as const }}>
                <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                  Combien exactement ?
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <button onClick={() => setGroupCount(c => Math.max(3, c - 1))} style={S.stepBtn}>−</button>
                  <span style={{ color: '#FFD700', fontFamily: "'Quicksand'", fontWeight: 700, fontSize: '2rem', minWidth: '3ch', display: 'inline-block', textAlign: 'center' as const }}>
                    {groupCount}
                  </span>
                  <button onClick={() => setGroupCount(c => Math.min(50, c + 1))} style={S.stepBtn}>+</button>
                </div>
                <button onClick={() => choosePeople(groupCount)} style={{ ...S.btn(), width: '100%' }}>
                  Continuer
                </button>
              </div>
            )}
          </>
        )}

        {/* Type de soirée (sauté en solo) */}
        {stepKey === 'type' && (
          <>
            <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🌙</p>
            <h2 style={{ color: 'white', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: '1.4rem', marginBottom: '1.75rem' }}>
              Quel type de soirée ?
            </h2>
            <div>
              {(answers.peopleCount > 2 ? TYPE_OPTIONS_GROUP : TYPE_OPTIONS_DUO).map(option => (
                <button key={option} onClick={() => selectAndAdvance('type', option, 'moment')} style={S.card(answers.type === option)}>
                  {option}
                </button>
              ))}
              <button
                onClick={() => setPhase('flame')}
                style={{ ...S.card(false), borderColor: '#FF6B3540', color: '#FF6B35' }}
              >
                Soirée intime 🔥
              </button>
            </div>
          </>
        )}

        {/* Jour ou nuit */}
        {stepKey === 'moment' && (
          <>
            <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🕐</p>
            <h2 style={{ color: 'white', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: '1.4rem', marginBottom: '1.75rem' }}>
              Jour ou nuit ?
            </h2>
            <div>
              {MOMENT_OPTIONS.map(option => (
                <button key={option} onClick={() => selectAndAdvance('moment', option, 'location')} style={S.card(answers.moment === option)}>
                  {option}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Lieu */}
        {stepKey === 'location' && (
          <>
            <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📍</p>
            <h2 style={{ color: 'white', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: '1.4rem', marginBottom: '1.75rem' }}>
              {showLocationDetail ? 'Quel type de sortie ?' : 'Où se déroule la soirée ?'}
            </h2>

            {!showLocationDetail ? (
              <div>
                {LOCATION_OPTIONS.map(option => (
                  <button key={option} onClick={() => selectLocation(option)} style={S.card(answers.location === option)}>
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              <div>
                {availableLocationDetails.map(detail => (
                  <button key={detail} onClick={() => selectLocationDetail(detail)} style={S.card(answers.locationDetail === detail)}>
                    {detail}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Goûts — uniquement si la soirée est à la maison */}
        {stepKey === 'gouts' && (
          <>
            <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎨</p>
            <h2 style={{ color: 'white', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: '1.4rem', marginBottom: '1.75rem' }}>
              Vos goûts pour la soirée
            </h2>

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={S.fieldLabel}>Styles de films / séries <span style={{ color: '#4b5563' }}>(optionnel)</span></p>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '0.5rem' }}>
                {FILMS_GENRES.map(g => (
                  <button key={g} onClick={() => toggle('filmsSeries', g)} style={S.pill(answers.filmsSeries.includes(g))}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={S.fieldLabel}>Genres de jeux de société <span style={{ color: '#4b5563' }}>(optionnel)</span></p>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '0.5rem' }}>
                {JEUX_GENRES.map(g => (
                  <button key={g} onClick={() => toggle('jeuxSociete', g)} style={S.pill(answers.jeuxSociete.includes(g))}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={S.fieldLabel}>Alcool ?</p>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '0.5rem' }}>
                {ALCOOL_OPTIONS.map(o => (
                  <button key={o} onClick={() => setField('alcool', o)} style={S.pill(answers.alcool === o)}>
                    {o}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={S.fieldLabel}>Ambiance musicale <span style={{ color: '#4b5563' }}>(optionnel)</span></p>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '0.5rem' }}>
                {MUSIQUE_OPTIONS.map(o => (
                  <button key={o} onClick={() => setField('musique', o)} style={S.pill(answers.musique === o)}>
                    {o}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <p style={S.fieldLabel}>Cuisine préférée <span style={{ color: '#4b5563' }}>(optionnel)</span></p>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '0.5rem' }}>
                {CUISINE_OPTIONS.map(o => (
                  <button key={o} onClick={() => setField('cuisine', o)} style={S.pill(answers.cuisine === o)}>
                    {o}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => setStepKey('style')} style={{ ...S.btn(), width: '100%' }}>
              Continuer
            </button>
          </>
        )}

        {/* Style */}
        {stepKey === 'style' && (
          <>
            <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✨</p>
            <h2 style={{ color: 'white', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: '1.4rem', marginBottom: '1.75rem' }}>
              Quel style de soirée ?
            </h2>
            <div>
              {STYLE_OPTIONS.map(option => (
                <button key={option} onClick={() => selectAndAdvance('style', option, 'budget')} style={S.card(answers.style === option)}>
                  {option}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Budget & restrictions */}
        {stepKey === 'budget' && (
          <>
            <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💰</p>
            <h2 style={{
              color: 'white',
              fontFamily: "'Quicksand', sans-serif",
              fontWeight: 700,
              fontSize: '1.4rem',
              marginBottom: '1.75rem',
            }}>
              Budget & préférences
            </h2>

            {/* Budget slider */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Budget par personne</span>
                <span style={{ color: '#FFD700', fontWeight: 700, fontFamily: "'Quicksand'" }}>
                  {answers.budget >= 100 ? '100€+' : `${answers.budget}€`}
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={100}
                step={5}
                value={answers.budget}
                onChange={e => setAnswers(p => ({ ...p, budget: +e.target.value }))}
                style={{ width: '100%', accentColor: '#A78BFA', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ color: '#4b5563', fontSize: '0.75rem' }}>5€</span>
                <span style={{ color: '#4b5563', fontSize: '0.75rem' }}>100€+</span>
              </div>
            </div>

            {/* Restrictions alimentaires */}
            <div style={{ marginBottom: '1.75rem' }}>
              <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                Restrictions alimentaires <span style={{ color: '#4b5563' }}>(optionnel)</span>
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '0.5rem' }}>
                {RESTRICTIONS.map(r => (
                  <button key={r} onClick={() => toggle('restrictions', r)} style={S.pill(answers.restrictions.includes(r))}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Plateformes — uniquement pertinent si on reste à la maison / en extérieur / en vacances */}
            {!isGoingOut && (
              <div style={{ marginBottom: '2rem' }}>
                <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                  Plateformes disponibles <span style={{ color: '#4b5563' }}>(optionnel)</span>
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '0.5rem' }}>
                  {PLATFORMS.map(p => (
                    <button key={p} onClick={() => toggle('platforms', p)} style={S.pill(answers.platforms.includes(p))}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Erreur */}
            {error && (
              <div style={{ background: '#2d0e0e', border: '1px solid #7f1d1d', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', color: '#fca5a5', fontSize: '0.875rem' }}>
                ⚠️ {error}
              </div>
            )}

            {/* Bouton générer */}
            <button
              onClick={generate}
              style={{
                ...S.btn(),
                width: '100%',
                padding: '16px',
                fontSize: '1.05rem',
                boxShadow: '0 4px 24px rgba(167,139,250,0.3)',
              }}
            >
              🌙 Générer ma soirée
            </button>
          </>
        )}
      </div>
    </div>
  )
}
