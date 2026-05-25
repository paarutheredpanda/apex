'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser, UserButton } from '@clerk/nextjs';

type ProjectStatus = 'active' | 'paused' | 'completed';

interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  createdAt: string;
}

const STATUS: Record<ProjectStatus, { label: string; color: string }> = {
  active:    { label: 'ACTIVE',    color: '#3fb96e' },
  paused:    { label: 'PAUSED',    color: '#d4a017' },
  completed: { label: 'DONE',      color: '#6b8fd6' },
};

function formatDate(iso: string): string {
  return new Date(iso)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .toUpperCase();
}

function StatusDot({ status }: { status: ProjectStatus }) {
  const { color } = STATUS[status];
  return (
    <span
      style={{
        display: 'inline-block',
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 7px ${color}`,
        flexShrink: 0,
        animation: status === 'active' ? 'pulseDot 2.2s ease-in-out infinite' : 'none',
      }}
    />
  );
}

function ProjectRow({ project, index }: { project: Project; index: number }) {
  const { label, color } = STATUS[project.status];
  return (
    <div
      style={{
        borderTop: '1px solid var(--border)',
        padding: '22px 0',
        display: 'grid',
        gridTemplateColumns: '44px 1fr auto',
        gap: '0 20px',
        alignItems: 'start',
        animation: `fadeUp 0.35s ease ${index * 60}ms both`,
      }}
    >
      <span style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 500, paddingTop: 4, letterSpacing: '0.05em' }}>
        {String(index + 1).padStart(3, '0')}
      </span>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <StatusDot status={project.status} />
          <h3
            style={{
              fontFamily: 'var(--font-syne), sans-serif',
              fontSize: 17,
              fontWeight: 700,
              color: 'var(--text)',
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            {project.name}
          </h3>
        </div>
        {project.description && (
          <p style={{ color: 'var(--muted)', margin: '0 0 8px', fontSize: 13 }}>
            {project.description}
          </p>
        )}
        <span style={{ color: 'var(--muted)', fontSize: 11, letterSpacing: '0.1em' }}>
          {formatDate(project.createdAt)}
        </span>
      </div>

      <span
        style={{
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.12em',
          color,
          border: `1px solid ${color}33`,
          background: `${color}0d`,
          padding: '3px 8px',
          whiteSpace: 'nowrap',
          marginTop: 3,
        }}
      >
        {label}
      </span>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  fontFamily: 'inherit',
  fontSize: 14,
  outline: 'none',
  width: '100%',
  transition: 'border-color 0.15s',
};

export default function Home() {
  const { getToken } = useAuth();
  const { user } = useUser();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    async function loadProjects() {
      try {
        const token = await getToken();
        const res = await fetch(`${apiUrl}/projects`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json() as Project[];
        setProjects(data);
      } catch {
        setFetchError('Cannot reach backend at ' + apiUrl);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, [apiUrl, getToken]);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setFormError(null);

    try {
      const token = await getToken();
      const res = await fetch(`${apiUrl}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim(), description: description.trim(), status }),
      });

      if (!res.ok) {
        const data = await res.json() as { error: string };
        setFormError(data.error ?? 'Failed to create project');
        return;
      }

      const project = await res.json() as Project;
      setProjects((prev) => [project, ...prev]);
      setName('');
      setDescription('');
      setStatus('active');
    } catch {
      setFormError('Network error — is the backend running?');
    } finally {
      setSubmitting(false);
    }
  }

  const isConnected = !loading && !fetchError;
  const userLabel = user?.primaryEmailAddress?.emailAddress ?? user?.username ?? null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink)', display: 'flex', flexDirection: 'column' }}>
      {/* ── Header ── */}
      <header
        style={{
          borderBottom: '1px solid var(--border)',
          padding: '18px 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <span
            style={{
              fontFamily: 'var(--font-syne), sans-serif',
              fontSize: 20,
              fontWeight: 800,
              color: 'var(--amber)',
              letterSpacing: '0.15em',
            }}
          >
            APEX
          </span>
          <span style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.18em' }}>
            PROJECT MANAGEMENT
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                display: 'inline-block',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: isConnected ? 'var(--green)' : fetchError ? '#f87171' : 'var(--muted)',
                boxShadow: isConnected ? '0 0 6px var(--green)' : 'none',
                animation: isConnected ? 'pulseDot 2.2s ease-in-out infinite' : 'none',
              }}
            />
            <span style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.12em' }}>
              {loading ? 'CONNECTING' : isConnected ? 'CONNECTED' : 'OFFLINE'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span
              style={{
                fontFamily: 'var(--font-syne), sans-serif',
                fontSize: 18,
                fontWeight: 700,
                color: projects.length > 0 ? 'var(--text)' : 'var(--muted)',
              }}
            >
              {loading ? '—' : projects.length}
            </span>
            <span style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.12em' }}>
              PROJECTS
            </span>
          </div>

          {/* User section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderLeft: '1px solid var(--border)', paddingLeft: 20 }}>
            {userLabel && (
              <span style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.1em' }}>
                {userLabel.toUpperCase()}
              </span>
            )}
            <UserButton
              appearance={{
                elements: {
                  avatarBox: { width: 28, height: 28 },
                },
              }}
            />
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{ maxWidth: 820, width: '100%', margin: '0 auto', padding: '52px 48px', flex: 1 }}>

        <SectionLabel text="PROJECTS" />

        <div style={{ marginBottom: 64 }}>
          {loading && (
            <div style={{ padding: '32px 0', color: 'var(--muted)', fontSize: 12, letterSpacing: '0.1em', borderTop: '1px solid var(--border)' }}>
              LOADING...
            </div>
          )}

          {fetchError && (
            <div style={{ marginTop: 0, padding: '14px 16px', border: '1px solid #7f1d1d', background: '#160808', color: '#f87171', fontSize: 12 }}>
              {fetchError}
            </div>
          )}

          {!loading && !fetchError && projects.length === 0 && (
            <div
              style={{
                borderTop: '1px solid var(--border)',
                padding: '48px 0',
                color: 'var(--muted)',
                fontSize: 12,
                letterSpacing: '0.1em',
                textAlign: 'center',
              }}
            >
              NO PROJECTS YET — CREATE THE FIRST ONE BELOW
            </div>
          )}

          {projects.map((project, i) => (
            <ProjectRow key={project.id} project={project} index={i} />
          ))}

          {projects.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border)' }} />
          )}
        </div>

        <SectionLabel text="NEW PROJECT" />

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 14 }}>
            <Field label="NAME *">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Project name"
                required
                style={inputStyle}
              />
            </Field>

            <Field label="STATUS">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                style={inputStyle}
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </Field>
          </div>

          <Field label="DESCRIPTION">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description (optional)"
              style={inputStyle}
            />
          </Field>

          {formError && (
            <div style={{ padding: '10px 12px', border: '1px solid #7f1d1d', background: '#160808', color: '#f87171', fontSize: 12 }}>
              {formError}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              style={{
                padding: '11px 28px',
                background: submitting || !name.trim() ? 'var(--surface-2)' : 'var(--amber)',
                color: submitting || !name.trim() ? 'var(--muted)' : 'var(--ink)',
                border: 'none',
                fontSize: 11,
                fontWeight: 500,
                fontFamily: 'inherit',
                letterSpacing: '0.12em',
                cursor: submitting || !name.trim() ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {submitting ? 'CREATING...' : 'CREATE PROJECT →'}
            </button>
          </div>
        </form>
      </main>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: '1px solid var(--border)',
          padding: '14px 48px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.1em' }}>
          APEX / PRISMA + POSTGRESQL / v0.2
        </span>
        <span style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.1em' }}>
          {apiUrl}
        </span>
      </footer>
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.22em',
          color: 'var(--muted)',
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--muted)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}
