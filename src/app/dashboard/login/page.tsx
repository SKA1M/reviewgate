import LoginForm from './LoginForm'

export default function LoginPage() {
  return (
    <main style={{ maxWidth: 380, margin: '6rem auto', padding: '0 1.25rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '1.3rem', marginBottom: '1.5rem' }}>Owner sign in</h1>
      <LoginForm />
    </main>
  )
}
