import React, { useState } from 'react'
import Login from './components/Login'
import Dashboard from './components/Dashboard'

export default function App() {
  const [user, setUser] = useState(null)

  return (
    <div className="app-shell">
      <div className="app-background app-background-one" />
      <div className="app-background app-background-two" />
      <div className="app-content">
        <div className="brand-strip">
          <span className="brand-badge">TaskHub</span>
          <span className="brand-copy">Simple task control, polished for assessment</span>
        </div>
        <main className="app">
          {!user ? (
            <Login onLogin={setUser} />
          ) : (
            <Dashboard user={user} onLogout={() => setUser(null)} />
          )}
        </main>
      </div>
    </div>
  )
}
