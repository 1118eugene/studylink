import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/apiClient';
import { getStoredUser } from '../lib/session';
import { Card } from '../components/Card';
import PageHeader from '../components/PageHeader';

type ContentReport = {
  id: number;
  content_type: 'group' | 'resource';
  content_id: string;
  content_title: string | null;
  reason: string;
  details: string;
  status: 'pending' | 'dismissed' | 'removed';
  decision: string | null;
  reporter_name: string;
  reporter_email: string;
  created_at: string;
};

export default function ReportQueue() {
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyReportId, setBusyReportId] = useState<number | null>(null);
  const [showReviewed, setShowReviewed] = useState(false);
  const user = getStoredUser();

  const loadReports = useCallback(async () => {
    setError('');
    try {
      const response = await apiFetch('/api/admin/reports');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'The report queue could not be loaded.');
      }
      setReports(data.reports || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'The report queue could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadReports(); }, [loadReports]);

  const reviewReport = async (report: ContentReport, action: 'dismiss' | 'remove') => {
    if (action === 'remove' && !window.confirm(`Remove "${report.content_title || 'this item'}" and close this report?`)) {
      return;
    }
    setBusyReportId(report.id);
    setError('');
    try {
      const response = await apiFetch(`/api/admin/reports/${report.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'The report could not be reviewed.');
      }
      await loadReports();
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'The report could not be reviewed.');
    } finally {
      setBusyReportId(null);
    }
  };

  if (user?.role !== 'admin' && user?.role !== 'moderator') {
    return (
      <section className="workspace-page">
        <div className="container workspace-loading-card">
          <h1>Moderator access required</h1>
          <p>This page is only available to moderators and administrators.</p>
          <Link to="/dashboard" className="button button-secondary">Back to dashboard</Link>
        </div>
      </section>
    );
  }

  const visibleReports = reports.filter((report) => showReviewed || report.status === 'pending');

  return (
    <section className="workspace-page">
      <div className="container workspace-stack">
        <PageHeader
          className="page-header--reports"
          eyebrow="Trust & safety"
          title="Report review queue"
          description="Review student reports, document decisions, and keep shared study content useful and safe."
          stats={[
            { value: reports.filter((report) => report.status === 'pending').length, label: 'Reports awaiting review' },
          ]}
        />

        <section className="detail-panel">
          <div className="section-header">
            <h2>Student reports</h2>
            <label className="checkbox-control">
              <input type="checkbox" checked={showReviewed} onChange={(event) => setShowReviewed(event.target.checked)} />
              Include reviewed reports
            </label>
          </div>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          {loading ? <p>Loading reports…</p> : null}
          {!loading && visibleReports.length === 0 ? <p>No {showReviewed ? '' : 'pending '}reports to show.</p> : null}
          <div className="report-list">
            {visibleReports.map((report) => (
              <Card variant="outlined" className="report-card" key={report.id}>
                <div className="section-header">
                  <div>
                    <p className="workspace-eyebrow">{report.content_type} · Report #{report.id}</p>
                    <h3>{report.content_title || 'Content no longer available'}</h3>
                  </div>
                  <span className={`report-status report-status-${report.status}`}>{report.status}</span>
                </div>
                <p><strong>Reason:</strong> {report.reason}</p>
                {report.details ? <p>{report.details}</p> : null}
                <p className="report-meta">
                  Reported by {report.reporter_name} ({report.reporter_email}) · {new Date(report.created_at).toLocaleString()}
                </p>
                {report.status === 'pending' ? (
                  <div className="detail-action-row">
                    <button
                      type="button"
                      className="button button-secondary"
                      disabled={busyReportId === report.id}
                      onClick={() => void reviewReport(report, 'dismiss')}
                    >
                      Dismiss report
                    </button>
                    <button
                      type="button"
                      className="button button-primary"
                      disabled={busyReportId === report.id}
                      onClick={() => void reviewReport(report, 'remove')}
                    >
                      Remove {report.content_type}
                    </button>
                  </div>
                ) : (
                  <p className="report-meta">Decision: {report.decision}</p>
                )}
              </Card>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
