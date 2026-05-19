import React from 'react'

function StatRow({ label, value }) {
  return (
    <div className="insight-row">
      <span className="insight-label">{label}</span>
      <strong className="insight-value">{value}</strong>
    </div>
  )
}

export default function Insights({ tasks, counts, lastSynced }) {
  const completionRate = counts.total ? Math.round((counts.Complete / counts.total) * 100) : 0

  // top 5 recent tasks
  const recent = [...tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)

  return (
    <section className="insights">
      <header className="insights-header">
        <div>
          <p className="eyebrow">Workspace insights</p>
          <h2>Task insights</h2>
          {lastSynced && <p className="muted">Synced {lastSynced.toLocaleTimeString()}</p>}
        </div>
      </header>

      <div className="insights-grid">
        <article className="insight-card">
          <StatRow label="Total tasks" value={counts.total} />
          <StatRow label="Planned" value={counts.Planned} />
          <StatRow label="In Progress" value={counts['In Progress']} />
          <StatRow label="Complete" value={counts.Complete} />
        </article>

        <article className="insight-card">
          <p className="panel-label">Completion rate</p>
          <div className="completion-meter">
            <div className="meter-fill" style={{ width: `${completionRate}%` }} />
          </div>
          <p className="muted">{completionRate}% of tasks completed</p>
        </article>

        <article className="insight-card full">
          <p className="panel-label">Recent tasks</p>
          {recent.length === 0 ? (
            <div className="empty-state">No tasks yet</div>
          ) : (
            <ul className="recent-list">
              {recent.map(t => (
                <li key={t._id} className="recent-item">
                  <strong>{t.title}</strong>
                  <span className="muted">{t.status} • {new Date(t.createdAt).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </section>
  )
}
