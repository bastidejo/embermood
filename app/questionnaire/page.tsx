'use client'

import { useState } from 'react'
import Link from 'next/link'

/* ─── Types ─────────────────────────────────────────────── */
type Answers = {
  people: string
  type: string
  location: string
  style: string
  budget: number
  restrictions: string[]
  platforms: string[]
}

type PlanningItem = { moment: string; description: string }
type MenuItem = { nom: string; recette: string }
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

const STEPS: {
  emoji: string
  question: string
  field: keyof Pick<Answers, 'people' | 'type' | 'location' | 'style'>
  options: string[]
}[] = [
  {
    emoji: '👥',
    question: 'Combien êtes-vous ?',
    field: 'people',
    options: ['Solo (je prépare seul)', '2 personnes', '3 à 5 personnes', '6 personnes et plus'],
  },
  {
    emoji: '🌙',
    question: 'Quel type de soirée ?',
    field: 'type',
    options: ['En couple', 'Entre amis', 'En famille — avec enfants', 'En famille — adultes uniquement'],
  },
  {
    emoji: '📍',
    question: 'Où se déroule la soirée ?',
    field: 'location',
    options: ['À la maison', 'En extérieur (jardin, terrasse, parc)', 'En vacances (location, camping, hôtel)', 'Au restaurant'],
  },
  {
    emoji: '✨',
    question: 'Quel style de soirée ?',
    field: 'style',
    options: ['Chill & détendu 🛋️', 'Dynamique & festif 🎉', 'Mix des deux 🎭'],
  },
]

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
}

/* ─── Composant principal ────────────────────────────────── */
export default function Questionnaire() {
  const [step, setStep] = useState(1)
  const [answers, setAnswers] = useState<Answers>({
    people: '',
    type: '',
    location: '',
    style: '',
    budget: 20,
    restrictions: [],
    platforms: [],
  })
  const [phase, setPhase] = useState<'quiz' | 'loading' | 'results' | 'flame'>('quiz')
  const [results, setResults] = useState<Results | null>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<typeof RESULT_TABS[number]>('Planning')

  /* Sélection simple (étapes 1-4) */
  const selectOption = (field: keyof Pick<Answers, 'people' | 'type' | 'location' | 'style'>, value: string) => {
    setAnswers(prev => ({ ...prev, [field]: value }))
    if (step < 5) setTimeout(() => setStep(s => s + 1), 180)
  }

  /* Toggle multi-select (restrictions / plateformes) */
  const toggle = (field: 'restrictions' | 'platforms', value: string) => {
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
      setPhase('results')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
      setPhase('quiz')
    }
  }

  /* Reset */
  const reset = () => {
    setStep(1)
    setAnswers({ people: '', type: '', location: '', style: '', budget: 20, restrictions: [], platforms: [] })
    setResults(null)
    setPhase('quiz')
    setError('')
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
        {/* Header résultats */}
        <div style={{ padding: '1.5rem 1.5rem 1rem', borderBottom: '1px solid #1f1f2e' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h1 style={{ color: '#A78BFA', fontFamily: "'Quicksand'", fontWeight: 700, fontSize: '1.3rem' }}>
              🌙 Votre soirée est prête !
            </h1>
            <button onClick={reset} style={{ ...S.btn('ghost'), fontSize: '0.8rem', padding: '6px 14px' }}>
              Recommencer
            </button>
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

        <div style={{ padding: '1.5rem', maxWidth: '640px', margin: '0 auto', width: '100%' }}>
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
              {(['entree', 'plat', 'dessert'] as const).map(course => (
                <div key={course} style={{ background: '#13131f', borderRadius: '12px', padding: '1.25rem', border: '1px solid #1f1f2e' }}>
                  <p style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.4rem' }}>
                    {course === 'entree' ? 'Entrée' : course === 'plat' ? 'Plat' : 'Dessert'}
                  </p>
                  <p style={{ color: '#A78BFA', fontWeight: 700, fontFamily: "'Quicksand'", fontSize: '1.05rem', marginBottom: '0.5rem' }}>
                    {results.menu[course].nom}
                  </p>
                  <p style={{ color: '#9ca3af', fontSize: '0.85rem', lineHeight: 1.6 }}>
                    {results.menu[course].recette}
                  </p>
                </div>
              ))}
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
              {results.films.map((film, i) => (
                <div key={i} style={{ background: '#13131f', borderRadius: '12px', padding: '1.25rem', border: '1px solid #1f1f2e' }}>
                  <p style={{ color: '#A78BFA', fontWeight: 700, fontFamily: "'Quicksand'", fontSize: '1.05rem', marginBottom: '0.25rem' }}>
                    🎬 {film.titre}
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#FFD700', fontSize: '0.78rem' }}>{film.genre}</span>
                    <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>⏱ {film.duree}</span>
                  </div>
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem', lineHeight: 1.5 }}>
                    {film.synopsis}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  /* ── Quiz ── */
  const currentStep = STEPS[step - 1]
  const progress = (step / 5) * 100

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem' }}>
        {step > 1 ? (
          <button onClick={() => setStep(s => s - 1)} style={S.btn('ghost')}>
            ← Retour
          </button>
        ) : (
          <Link href="/" style={{ ...S.btn('ghost'), textDecoration: 'none' }}>
            ← Accueil
          </Link>
        )}
        <span style={{ color: '#4b5563', fontSize: '0.875rem', fontWeight: 600 }}>
          {step} / 5
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

        {/* Étapes 1-4 */}
        {step <= 4 && currentStep && (
          <>
            <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{currentStep.emoji}</p>
            <h2 style={{
              color: 'white',
              fontFamily: "'Quicksand', sans-serif",
              fontWeight: 700,
              fontSize: '1.4rem',
              marginBottom: '1.75rem',
            }}>
              {currentStep.question}
            </h2>

            {/* Options */}
            <div>
              {currentStep.options.map(option => (
                <button
                  key={option}
                  onClick={() => selectOption(currentStep.field, option)}
                  style={S.card(answers[currentStep.field] === option)}
                >
                  {option}
                </button>
              ))}

              {/* Option Flame uniquement à l'étape 2 */}
              {step === 2 && (
                <button
                  onClick={() => setPhase('flame')}
                  style={{
                    ...S.card(false),
                    borderColor: '#FF6B3540',
                    color: '#FF6B35',
                  }}
                >
                  Soirée intime 🔥
                </button>
              )}
            </div>

            {!answers[currentStep.field] && (
              <p style={{ color: '#374151', fontSize: '0.8rem', marginTop: '1rem', textAlign: 'center' }}>
                Sélectionnez une option pour continuer
              </p>
            )}
          </>
        )}

        {/* Étape 5 — Budget & restrictions */}
        {step === 5 && (
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

            {/* Plateformes */}
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
