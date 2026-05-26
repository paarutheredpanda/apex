'use client';

import { UserButton } from '@clerk/nextjs';
import type { ReactNode } from 'react';
import { PROJECT_STATUS_META, type ProjectStatus } from '../types/project';

interface ApexShellProps {
  children: ReactNode;
  title: string;
  eyebrow: string;
  status?: ProjectStatus;
  userLabel?: string | null;
  apiUrl?: string;
  rightRail?: ReactNode;
}

export function ApexShell({ children, title, eyebrow, status, userLabel, apiUrl, rightRail }: ApexShellProps) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink)', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          borderBottom: '1px solid var(--border)',
          padding: '18px clamp(20px, 5vw, 48px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 6 }}>
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
              {eyebrow}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            {status && <StatusPill status={status} />}
            <h1
              style={{
                color: 'var(--text)',
                fontFamily: 'var(--font-syne), sans-serif',
                fontSize: 'clamp(22px, 4vw, 36px)',
                fontWeight: 800,
                lineHeight: 1.05,
                margin: 0,
                overflowWrap: 'anywhere',
              }}
            >
              {title}
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexShrink: 0 }}>
          {rightRail}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderLeft: '1px solid var(--border)', paddingLeft: 18 }}>
            {userLabel && (
              <span style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.1em' }}>
                {userLabel.toUpperCase()}
              </span>
            )}
            <UserButton appearance={{ elements: { avatarBox: { width: 28, height: 28 } } }} />
          </div>
        </div>
      </header>

      <main style={{ width: '100%', maxWidth: 1180, margin: '0 auto', padding: '38px clamp(20px, 5vw, 48px) 56px', flex: 1 }}>
        {children}
      </main>

      <footer
        style={{
          borderTop: '1px solid var(--border)',
          padding: '14px clamp(20px, 5vw, 48px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <span style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.1em' }}>
          APEX / PROJECT INTELLIGENCE / v0.4
        </span>
        <span style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.1em', overflowWrap: 'anywhere' }}>
          {apiUrl}
        </span>
      </footer>
    </div>
  );
}

export function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.22em', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
        {text}
      </span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  );
}

export function StatusPill({ status }: { status: ProjectStatus }) {
  const { label, color } = PROJECT_STATUS_META[status];
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.12em',
        color,
        border: `1px solid ${color}33`,
        background: `${color}0d`,
        padding: '4px 9px',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

interface ModuleCardProps {
  title: string;
  label: string;
  children: ReactNode;
  accent?: string;
}

export function ModuleCard({ title, label, children, accent = 'var(--amber)' }: ModuleCardProps) {
  return (
    <section
      style={{
        border: '1px solid var(--border)',
        background: 'linear-gradient(180deg, rgba(19, 28, 42, 0.74), rgba(13, 18, 25, 0.92))',
        minHeight: 190,
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', inset: '0 0 auto', height: 2, background: accent }} />
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, marginBottom: 22 }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-syne), sans-serif', fontSize: 18, fontWeight: 750, color: 'var(--text)' }}>
          {title}
        </h2>
        <span style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.15em', whiteSpace: 'nowrap' }}>
          {label}
        </span>
      </div>
      {children}
    </section>
  );
}

export function LoadingPanel({ text }: { text: string }) {
  return (
    <div style={{ borderTop: '1px solid var(--border)', padding: '28px 0', color: 'var(--muted)', fontSize: 12, letterSpacing: '0.1em' }}>
      {text}
    </div>
  );
}

export function ErrorPanel({ message }: { message: string }) {
  return (
    <div style={{ padding: '14px 16px', border: '1px solid #7f1d1d', background: '#160808', color: '#f87171', fontSize: 12 }}>
      {message}
    </div>
  );
}
