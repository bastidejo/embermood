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
            