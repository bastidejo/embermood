import Link from 'next/link'

export default function Home() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0a0a14',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.25rem',
        textAlign: 'center',
        maxWidth: 420,
        margin: '0 auto',
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: '0.75rem' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Embermood"
          width={64}
          height={64}
          style={{
            width: 64,
            height: 64,
            objectFit: 'contain',
            display: 'block',
            filter: 'drop-shadow(0 0 12px rgba(255,215,0,0.45))',
          }}
        />
      </div>

      {/* Title */}
      <h1
        style={{
          color: '#A78BFA',
          fontFamily: "'Quicksand', sans-serif",
          fontWeight: 700,
          fontSize: '1.35rem',
          letterSpacing: '4px',
          textTransform: 'uppercase',
          marginBottom: '0.5rem',
        }}
      >
        Embermood
      </h1>

      {/* Tagline */}
      <p
        style={{
          color: '#6b7280',
          fontSize: '0.88rem',
          marginBottom: '1.75rem',
          lineHeight: 1.5,
        }}
      >
        La soirée parfaite, en quelques questions
      </p>

      {/* CTA */}
      <Link
        href="/questionnaire"
        style={{
          display: 'inline-block',
          background: 'linear-gradient(135deg, #A78BFA, #7C3AED)',
          color: 'white',
          padding: '12px 32px',
          borderRadius: '50px',
          fontFamily: "'Quicksand', sans-serif",
          fontWeight: 700,
          fontSize: '0.9rem',
          textDecoration: 'none',
          letterSpacing: '0.5px',
          boxShadow: '0 4px 20px rgba(167, 139, 250, 0.35)',
        }}
      >
        ✨ Planifier ma soirée
      </Link>

      {/* Sous-texte */}
      <p style={{ color: '#374151', fontSize: '0.7rem', marginTop: '1.25rem' }}>
        Gratuit · Généré par IA · En 2 minutes
      </p>
    </main>
  )
}
