import React from 'react'
import { auth, provider, signInWithPopup } from '../firebase'

export default function Login({ onLogin }) {
  const handleLogin = async () => {
    try {
      const res = await signInWithPopup(auth, provider)
      const user = res.user
      onLogin({ uid: user.uid, displayName: user.displayName, email: user.email })
    } catch (err) {
      console.error(err)
      alert('Login failed')
    }
  }

  return (
    <section className="login-card">
      <div className="hero-copy">
        <p className="eyebrow">Assessment-ready task manager</p>
        <h1>Plan, track, and complete work with clarity.</h1>
        <p className="hero-text">
          Sign in with Google to access your personal dashboard, create tasks, and move them through Planned, In Progress, and Complete.
        </p>

        <div className="feature-pills">
          <span>Google login</span>
          <span>Private task list</span>
          <span>Status tracking</span>
        </div>
      </div>

      <div className="login-panel">
        <div className="login-panel-header">
          <div>
            <p className="panel-label">TaskHub Access</p>
            <h2>Secure sign in</h2>
          </div>
          <div className="status-dot" aria-hidden="true" />
        </div>

        <p className="panel-note">Use your Google account to continue.</p>

        <button className="google-button" onClick={handleLogin}>
          <span className="google-icon">G</span>
          Sign in with Google
        </button>

        <p className="login-footnote">No task data is shared across users.</p>
      </div>
    </section>
  )
}
