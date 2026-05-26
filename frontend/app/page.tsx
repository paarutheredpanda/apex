'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

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

const smallInputStyle: React.CSSProperties = {
  padding: '7px 10px',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  fontFamily: 'inherit',
  fontSize: 13,
  outline: 'none',
  width: '100%',
};

const ghostBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--muted)',
  fontSize: 10,
  fontFamily: 'inherit',
  letterSpacing: '0.1em',
  cursor: 'pointer',
  padding: 0,
};

interface ProjectRowProps {
  project: Project;
  index: number;
  onOpen: (id: string) => void;
  onUpdate: (updated: Project) => void;
  onDelete: (id: string) => void;
  getToken: () => Promise<string | null>;
  apiUrl: string | undefined;
}

function ProjectRow({ project, index, onOpen, onUpdate, onDelete, getToken, apiUrl }: ProjectRowProps) {
  const [mode, setMode] = useState<'view' | 'edit' | 'confirm-delete'>('view');
  const [editName, setEditName] = useState(project.name);
  const [editDesc, setEditDesc] = useState(project.description);
  const [editStatus, setEditStatus] = useState<ProjectStatus>(project.status);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);

  function startEdit() {
    setEditName(project.name);
    setEditDesc(project.description);
    setEditStatus(project.status);
    setRowError(null);
    setMode('edit');
  }

  async function saveEdit() {
    if (!editName.trim()) { setRowError('Name required'); return; }
    setSaving(true);
    setRowError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${apiUrl}/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editName.trim(), description: editDesc.trim(), status: editStatus }),
      });
      if (!res.ok) {
        const data = await res.json() as { error: string };
        setRowError(data.error ?? 'Failed to update');
        return;
      }
      const updated = await res.json() as Project;
      onUpdate(updated);
      setMode('view');
    } catch {
      setRowError('Network error');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      const token = await getToken();
      const res = await fetch(`${apiUrl}/projects/${project.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok && res.status !== 404) {
        let msg = 'Failed to delete';
        try { const d = await res.json() as { error: string }; msg = d.error ?? msg; } catch { /* ignore */ }
        setRowError(msg);
        setMode('view');
        return;
      }
      onDelete(project.id);
    } catch {
      setRowError('Network error');
      setMode('view');
    } finally {
      setDeleting(false);
    }
  }

  if (mode === 'edit') {
    return (
      <div
        style={{
          borderTop: '1px solid var(--border)',
          padding: '20px 0',
          animation: 'fadeUp 0.2s ease both',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: '0 20px' }}>
          <span style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 500, paddingTop: 9, letterSpacing: '0.05em' }}>
            {String(index + 1).padStart(3, '0')}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 10 }}>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Project name"
                autoFocus
                style={{ ...smallInputStyle, fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: 15 }}
              />
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as ProjectStatus)}
                style={smallInputStyle}
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <input
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Description (optional)"
              style={smallInputStyle}
            />
            {rowError && (
              <div style={{ padding: '7px 10px', border: '1px solid #7f1d1d', background: '#160808', color: '#f87171', fontSize: 11 }}>
                {rowError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={saveEdit}
                disabled={saving}
                style={{
                  padding: '7px 18px',
                  background: saving ? 'var(--surface-2)' : 'var(--amber)',
                  color: saving ? 'var(--muted)' : 'var(--ink)',
                  border: 'none',
                  fontSize: 10,
                  fontWeight: 500,
                  fontFamily: 'inherit',
                  letterSpacing: '0.12em',
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'SAVING...' : 'SAVE →'}
              </button>
              <button
                onClick={() => { setMode('view'); setRowError(null); }}
                disabled={saving}
                style={{
                  padding: '7px 14px',
                  background: 'transparent',
                  color: 'var(--muted)',
                  border: '1px solid var(--border)',
                  fontSize: 10,
                  fontFamily: 'inherit',
                  letterSpacing: '0.12em',
                  cursor: 'pointer',
                }}
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { label, color } = STATUS[project.status];

  return (
    <div
      onClick={() => onOpen(project.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(project.id);
        }
      }}
      role="button"
      tabIndex={0}
      style={{
        borderTop: '1px solid var(--border)',
        padding: '22px 0',
        display: 'grid',
        gridTemplateColumns: '44px 1fr auto',
        gap: '0 20px',
        alignItems: 'start',
        animation: `fadeUp 0.35s ease ${index * 60}ms both`,
        cursor: 'pointer',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: 'var(--muted)', fontSize: 11, letterSpacing: '0.1em' }}>
            {formatDate(project.createdAt)}
          </span>
          {rowError && (
            <span style={{ color: '#f87171', fontSize: 11 }}>{rowError}</span>
          )}
        </div>
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, marginTop: 3 }}
      >
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
          }}
        >
          {label}
        </span>

        {mode === 'confirm-delete' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#f87171', fontSize: 10, letterSpacing: '0.1em' }}>DELETE?</span>
            <button
              onClick={confirmDelete}
              disabled={deleting}
              style={{ ...ghostBtnStyle, color: '#f87171' }}
            >
              {deleting ? '...' : 'YES'}
            </button>
            <span style={{ color: 'var(--border)', fontSize: 10 }}>/</span>
            <button
              onClick={() => setMode('view')}
              disabled={deleting}
              style={ghostBtnStyle}
            >
              NO
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={startEdit} style={ghostBtnStyle}>
              EDIT
            </button>
            <button
              onClick={() => { setRowError(null); setMode('confirm-delete'); }}
              style={ghostBtnStyle}
            >
              DEL
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();

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

        let data: unknown = null;
        try {
          data = await res.json();
        } catch {
          data = null;
        }

        if (!res.ok) {
          const message =
            data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
              ? data.error
              : `Failed to load projects (${res.status})`;
          setProjects([]);
          setFetchError(message);
          return;
        }

        if (Array.isArray(data)) {
          setProjects(data as Project[]);
        } else {
          setProjects([]);
          setFetchError('Unexpected response from projects API.');
        }
      } catch {
        setProjects([]);
        setFetchError('Cannot reach backend at ' + apiUrl);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, [apiUrl, getToken]);

  function handleUpdate(updated: Project) {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  function handleDelete(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

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
            <div style={{ padding: '14px 16px', border: '1px solid #7f1d1d', background: '#160808', color: '#f87171', fontSize: 12 }}>
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
            <ProjectRow
              key={project.id}
              project={project}
              index={i}
              onOpen={(id) => router.push(`/projects/${id}`)}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              getToken={getToken}
              apiUrl={apiUrl}
            />
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
          APEX / PRISMA + POSTGRESQL / v0.3
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
