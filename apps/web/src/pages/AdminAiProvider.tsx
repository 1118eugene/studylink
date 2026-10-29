import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { apiFetch } from '../lib/apiClient';
import { getStoredUser } from '../lib/session';

type ProviderLink = {
  courseCode: string;
  label: string;
  url: string;
  type: string;
  source: string;
  addedAt?: string;
  addedBy?: string;
};

type ProviderFlag = {
  courseCode: string;
  url: string;
  reason: string;
  flaggedAt?: string;
  flaggedBy?: string;
};

type ProviderStatus = {
  mode: string;
  connected: boolean;
  responseSource: string;
  externalRequestsTracked: boolean;
  curatedLinks: number;
  flaggedLinks: number;
  recentLinks: ProviderLink[];
  recentFlags: ProviderFlag[];
};

type HealthStatus = {
  status: string;
  database: string;
};

async function loadJson<T>(path: string): Promise<T> {
  const response = await apiFetch(path);
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message || `Unable to load ${path}.`);
  return payload as T;
}

export default function AdminAiProvider() {
  const isAdmin = getStoredUser()?.role === 'admin';
  const [provider, setProvider] = useState<ProviderStatus | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadStatus() {
      try {
        const [providerResult, healthResult] = await Promise.all([
          loadJson<{ provider: ProviderStatus }>('/api/admin/ai-provider'),
          loadJson<HealthStatus>('/api/health'),
        ]);
        if (active) {
          setProvider(providerResult.provider);
          setHealth(healthResult);
          setError('');
        }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'AI integration status could not be loaded.');
      } finally {
        if (active) setLoading(false);
      }
    }

    if (isAdmin) void loadStatus();
    else setLoading(false);
    return () => { active = false; };
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <section className="workspace-page">
        <div className="container workspace-loading-card">
          <h1>Administrator access required</h1>
          <p>AI integration details are restricted to administrator accounts.</p>
          <Link to="/dashboard" className="button button-secondary">Back to dashboard</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="workspace-page">
      <div className="container workspace-stack">
        <PageHeader
          eyebrow="External actor · AI Provider"
          title="AI service and provider status"
          description="Monitor the current AI support mode, privacy boundary, saved curated links, and curation flags. This screen reports what the prototype actually runs; it does not simulate provider uptime or request counts."
          stats={[
            { label: 'Provider connection', value: provider?.connected ? 'Connected' : 'Not connected' },
            { label: 'Saved curated links', value: provider?.curatedLinks ?? '—' },
            { label: 'Flagged links', value: provider?.flaggedLinks ?? '—' },
          ]}
          actions={<Link to="/ask-ai" className="button button-primary">Open student AI experience</Link>}
        />

        {error ? <p className="form-error" role="alert">{error}</p> : null}
        {loading ? <div className="workspace-loading-card" role="status">Loading integration status…</div> : null}

        {provider && health && !loading ? (
          <>
            <section className="detail-panel">
              <div className="section-header">
                <div>
                  <p className="workspace-eyebrow">Current implementation</p>
                  <h2>{provider.connected ? 'Provider connection active' : 'External AI provider is not connected'}</h2>
                </div>
                <span className={`dashboard-status-pill ${provider.connected ? 'dashboard-status-ok' : 'dashboard-status-limited'}`}>
                  {provider.connected ? 'Connected' : 'Prototype mode'}
                </span>
              </div>
              <p>{provider.responseSource}. StudyLink AI currently uses course guidance and curated resources in the app; it does not call an external model or provider.</p>
              <div className="dashboard-detail-grid">
                <StatusRow label="Provider gateway" value={provider.connected ? 'Configured' : 'No external gateway configured'} />
                <StatusRow label="Response mode" value={provider.mode} />
                <StatusRow label="Student prompt privacy" value="No student prompt is sent to an external provider" />
                <StatusRow label="External AI request analytics" value={provider.externalRequestsTracked ? 'Available' : 'Not applicable; no provider connection'} />
                <StatusRow label="Application API" value={health.status} />
                <StatusRow label="Database adapter" value={health.database} />
              </div>
              <div className="dashboard-notice">
                <strong>Deployment and report gap</strong>
                <p>The report describes an optional provider behind a privacy gateway. The prototype gateway and provider integration are not implemented yet; do not treat curated links or local guidance as a live AI-provider response.</p>
              </div>
            </section>

            <section className="dashboard-layout">
              <div className="detail-panel">
                <div className="section-header">
                  <h2>Latest curated resources</h2>
                  <span className="panel-pill">{provider.curatedLinks} total</span>
                </div>
                {provider.recentLinks.length === 0 ? <p className="dashboard-empty-copy">No curated links have been saved yet.</p> : (
                  <div className="dashboard-record-list">
                    {provider.recentLinks.map((resource, index) => (
                      <div key={`${resource.courseCode}-${resource.url}-${index}`} className="dashboard-record-row dashboard-record-static">
                        <span>
                          <strong>{resource.label || resource.url}</strong>
                          <small>{resource.courseCode} · {resource.type || 'Resource'} · {resource.source || 'Source not recorded'}</small>
                        </span>
                        <span className="dashboard-record-meta">
                          {resource.addedAt ? new Date(resource.addedAt).toLocaleString() : 'Date not recorded'}
                          <br />{resource.addedBy || 'Contributor not recorded'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="detail-panel">
                <div className="section-header">
                  <h2>Resource curation flags</h2>
                  <span className="panel-pill">{provider.flaggedLinks} total</span>
                </div>
                {provider.recentFlags.length === 0 ? <p className="dashboard-empty-copy">No curated resources have been flagged for review.</p> : (
                  <div className="dashboard-record-list">
                    {provider.recentFlags.map((flag, index) => (
                      <div key={`${flag.courseCode}-${flag.url}-${index}`} className="dashboard-record-row dashboard-record-static">
                        <span>
                          <strong>{flag.reason || 'No reason provided'}</strong>
                          <small>{flag.courseCode} · {flag.url}</small>
                        </span>
                        <span className="dashboard-record-meta">
                          {flag.flaggedAt ? new Date(flag.flaggedAt).toLocaleString() : 'Date not recorded'}
                          <br />{flag.flaggedBy || 'Reporter not recorded'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="detail-action-row">
                  <Link to="/admin/reports" className="button button-secondary button-sm">Open content moderation queue</Link>
                </div>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </section>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="dashboard-detail-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
