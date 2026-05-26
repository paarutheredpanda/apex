'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth, useUser } from '@clerk/nextjs';
import { useParams } from 'next/navigation';
import {
  ApexShell,
  ErrorPanel,
  LoadingPanel,
  ModuleCard,
  SectionLabel,
} from '../../components/apex-dashboard';
import type { Project } from '../../types/project';
import { WatchlistPanel } from './watchlist-panel';

function formatDate(iso: string): string {
  return new Date(iso)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .toUpperCase();
}

function readProjectId(param: string | string[] | undefined): string | null {
  if (Array.isArray(param)) {
    return param[0] ?? null;
  }
  return param ?? null;
}

export default function ProjectDetailPage() {
  const params = useParams<{ id?: string | string[] }>();
  const projectId = readProjectId(params.id);
  const { getToken } = useAuth();
  const { user } = useUser();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const userLabel = user?.primaryEmailAddress?.emailAddress ?? user?.username ?? null;

  useEffect(() => {
    let alive = true;

    async function loadProject() {
      if (!projectId) {
        setError('Missing project id.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const token = await getToken();
        const res = await fetch(`${apiUrl}/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        let data: unknown = null;
        try {
          data = await res.json();
        } catch {
          data = null;
        }

        if (!alive) return;

        if (!res.ok) {
          const message =
            data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
              ? data.error
              : `Failed to load project (${res.status})`;
          setProject(null);
          setError(message);
          return;
        }

        if (data && typeof data === 'object' && 'id' in data) {
          setProject(data as Project);
        } else {
          setProject(null);
          setError('Unexpected response from project API.');
        }
      } catch {
        if (alive) {
          setProject(null);
          setError('Cannot reach backend at ' + apiUrl);
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    loadProject();

    return () => {
      alive = false;
    };
  }, [apiUrl, getToken, projectId]);

  const modules = useMemo(
    () => [
      { title: 'Stock Search', label: 'DISCOVERY', accent: 'var(--amber)', body: 'Ticker lookup, symbol snapshots, and market context will attach here.' },
      { title: 'AI Analysis', label: 'MODEL', accent: 'var(--blue)', body: 'Generated thesis, risk notes, and scenario summaries will render in this panel.' },
      { title: 'Signals', label: 'ALERTS', accent: 'var(--yellow)', body: 'Momentum, valuation, and custom signal events will stream into this lane.' },
      { title: 'News', label: 'INTEL', accent: '#7dd3fc', body: 'Relevant market headlines and source summaries will be grouped by symbol.' },
      { title: 'Portfolio', label: 'CAPITAL', accent: '#c084fc', body: 'Positions, allocations, and performance attribution will connect here.' },
    ],
    [],
  );

  return (
    <ApexShell
      title={project?.name ?? 'Project Detail'}
      eyebrow="PROJECT COMMAND"
      status={project?.status}
      userLabel={userLabel}
      apiUrl={apiUrl}
      rightRail={
        <Link
          href="/"
          style={{
            color: 'var(--muted)',
            border: '1px solid var(--border)',
            padding: '8px 12px',
            fontSize: 10,
            letterSpacing: '0.12em',
            textDecoration: 'none',
          }}
        >
          ALL PROJECTS
        </Link>
      }
    >
      <SectionLabel text="PROJECT OVERVIEW" />

      {loading && <LoadingPanel text="LOADING PROJECT..." />}
      {error && <ErrorPanel message={error} />}

      {project && !loading && !error && (
        <>
          <section
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: 14,
              marginBottom: 34,
            }}
          >
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <p style={{ color: project.description ? 'var(--text)' : 'var(--muted)', margin: 0, fontSize: 14, maxWidth: 680 }}>
                {project.description || 'No project description has been added yet.'}
              </p>
            </div>
            <Metric label="CREATED" value={formatDate(project.createdAt)} />
            <Metric label="PROJECT ID" value={project.id.slice(0, 8).toUpperCase()} />
          </section>

          <SectionLabel text="MARKET WORKSPACE" />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            <ModuleCard title="Watchlist" label="TRACKING" accent="var(--green)">
              <WatchlistPanel apiUrl={apiUrl} getToken={getToken} projectId={project.id} />
            </ModuleCard>

            {modules.map((module) => (
              <ModuleCard key={module.title} title={module.title} label={module.label} accent={module.accent}>
                <p style={{ color: 'var(--muted)', margin: 0, fontSize: 13 }}>
                  {module.body}
                </p>
                <div style={{ marginTop: 24, height: 46, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'end', gap: 6 }}>
                  {[28, 44, 22, 38, 52, 30, 48].map((height, index) => (
                    <span
                      key={`${module.title}-${height}-${index}`}
                      style={{
                        width: 6,
                        height,
                        background: index % 2 === 0 ? 'var(--border-hi)' : module.accent,
                        opacity: index % 2 === 0 ? 0.65 : 0.45,
                      }}
                    />
                  ))}
                </div>
              </ModuleCard>
            ))}
          </div>
        </>
      )}
    </ApexShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
      <div style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.14em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ color: 'var(--text)', fontFamily: 'var(--font-syne), sans-serif', fontSize: 18, fontWeight: 700, overflowWrap: 'anywhere' }}>
        {value}
      </div>
    </div>
  );
}
