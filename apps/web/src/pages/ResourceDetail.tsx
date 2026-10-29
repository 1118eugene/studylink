import { useEffect, useState } from 'react';
import { addNotification } from '../lib/notifications';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiFetch, openResourceUrl } from '../lib/apiClient';
import { getAllCatalogResources } from '../lib/studylinkContent';
import ReportContent from '../components/ReportContent';
import { Card } from '../components/Card';

interface ResourceItem {
  id: string;
  title: string;
  type: string;
  url: string;
  fallbackUrl?: string;
  description: string;
  usageNotes: string;
  audience: string;
  sourceNote?: string;
  downloads?: number;
  courseCode?: string;
  courseTitle?: string;
  school?: string;
  program?: string;
  category?: string;
  isCatalog?: boolean;
  isApiResource?: boolean;
}

function getResourceCategory(resource: { type?: string }) {
  const type = String(resource.type || '').toLowerCase();
  if (type.includes('pdf')) return 'PDFs';
  if (type.includes('podcast')) return 'Podcasts';
  if (type.includes('video')) return 'Videos';
  if (type.includes('past')) return 'Past papers';
  if (type.includes('mcq')) return 'MCQs';
  if (type.includes('note')) return 'Notes';
  return 'Guides';
}

function ResourceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resource, setResource] = useState<ResourceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accessError, setAccessError] = useState('');

  useEffect(() => {
    let mounted = true;

    if (!id) {
      setError('Resource not found.');
      setLoading(false);
      return;
    }

    const localResource = getAllCatalogResources().find((item) => String(item.id) === id);
    if (localResource) {
      setResource(localResource);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const response = await apiFetch(`/api/resources/${encodeURIComponent(id)}`);
        if (!response.ok) {
          throw new Error('Resource not found.');
        }

        const data = await response.json();
        if (!mounted) return;

        const resourcePayload: ResourceItem = {
          id: String(data.resource.id),
          title: data.resource.title,
          type: data.resource.type || 'Resource',
          url: data.resource.url || '',
          description: data.resource.description || '',
          usageNotes: data.resource.usageNotes || 'Open and review this learning material.',
          audience: data.resource.audience || 'All students',
          sourceNote: data.resource.sourceNote || '',
          downloads: data.resource.download_count || 0,
          courseCode: data.resource.courseCode || data.resource.course || '',
          courseTitle: data.resource.course || '',
          school: data.resource.school || 'General',
          program: data.resource.program || 'General Studies',
          category: getResourceCategory({ type: data.resource.type }),
          isCatalog: false,
          isApiResource: true,
        };

        setResource(resourcePayload);
      } catch (loadError) {
        if (!mounted) return;
        setError(loadError instanceof Error ? loadError.message : 'Unable to load resource.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  const openResource = async () => {
    if (!resource) return;
    setAccessError('');

    if (resource.isApiResource) {
      try {
        await apiFetch(`/api/resources/${encodeURIComponent(resource.id)}/enroll`, { method: 'POST' });
      } catch {
        // ignore access tracking failures
      }
    }

    const openUrl = resource.url || resource.fallbackUrl;
    if (openUrl) {
      try {
        await openResourceUrl(openUrl);
      } catch (openError) {
        setAccessError(openError instanceof Error ? openError.message : 'Unable to open this resource.');
      }
    }
  };

  const isPreviewable = resource?.url?.startsWith('data:');

  if (loading) {
    return (
      <section className="workspace-page">
        <div className="container workspace-loading-card">
          <p>Loading resource...</p>
        </div>
      </section>
    );
  }

  if (error || !resource) {
    return (
      <section className="workspace-page">
        <div className="container workspace-loading-card">
          <p>{error || 'Resource could not be loaded.'}</p>
          <button type="button" className="button button-primary" onClick={() => navigate(-1)}>
            Back to resources
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="workspace-page">
      <div className="container workspace-stack">
        <Card as="section" variant="feature" className="detail-hero-card">
          <div className="detail-hero-copy">
            <p className="workspace-eyebrow">{resource.category || resource.type}</p>
            <h1>{resource.title}</h1>
            <p className="workspace-lead">{resource.description}</p>
            <div className="detail-chip-row">
              {resource.courseCode ? <span className="detail-chip">{resource.courseCode}</span> : null}
              {resource.courseTitle ? <span className="detail-chip">{resource.courseTitle}</span> : null}
              <span className="detail-chip">{resource.audience}</span>
            </div>
            <div className="detail-action-row">
              {resource.url ? (
              resource.url.startsWith('data:') ? (
                <button type="button" className="button button-primary" onClick={openResource}>
                  Open in new tab
                </button>
              ) : (
                <button type="button" onClick={openResource} className="button button-primary">
                  Open resource
                </button>
              )
            ) : null}
              {accessError ? <p className="form-error" role="alert">{accessError}</p> : null}
              {resource.url && resource.url.startsWith('data:') ? (
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={async () => {
                    try {
                      const [, meta, body] = resource.url.match(/^data:([^;]+);base64,(.*)$/) || [];
                      const ext = meta && meta.includes('html') ? 'html' : (meta && meta.split('/')[1]) || 'bin';
                      const filename = `${resource.id || 'resource'}.${ext}`;
                      const resp = await apiFetch('/api/uploads', { method: 'POST', body: JSON.stringify({ filename, data: body }) });
                      if (resp.ok) {
                        const data = await resp.json();
                        await openResourceUrl(data.url);
                        addNotification({ id: `download-${Date.now()}`, title: 'Saved', message: 'Resource saved and opened.', createdAt: new Date().toISOString() });
                      } else {
                        addNotification({ id: `download-fail-${Date.now()}`, title: 'Save failed', message: 'Could not save resource.' , createdAt: new Date().toISOString() });
                      }
                    } catch (err) {
                      // eslint-disable-next-line no-console
                      console.error(err);
                      addNotification({ id: `download-ex-${Date.now()}`, title: 'Error', message: 'Failed to save resource.' , createdAt: new Date().toISOString() });
                    }
                  }}
                >
                  Download
                </button>
              ) : null}
            <Link to="/learning?view=library" className="button button-secondary">
              Back to learning hub
            </Link>
              {resource.isApiResource ? (
                <ReportContent contentType="resource" contentId={resource.id} contentTitle={resource.title} />
              ) : null}
            </div>
          </div>
        </Card>

        {isPreviewable ? (
          <section className="detail-panel">
            <h2>Preview</h2>
            <iframe
              title="resource-preview"
              src={resource.url}
              className="resource-preview-frame"
              sandbox="allow-same-origin allow-scripts allow-popups"
            />
          </section>
        ) : null}

        <section className="detail-panel">
          <h2>How to use this resource</h2>
          <p>{resource.usageNotes}</p>
          {resource.sourceNote ? <p><strong>Source and attribution:</strong> {resource.sourceNote}</p> : null}
          <div className="detail-card-grid">
            <article className="detail-summary-card">
              <strong>Type</strong>
              <p>{resource.category || resource.type}</p>
            </article>
            <article className="detail-summary-card">
              <strong>Audience</strong>
              <p>{resource.audience}</p>
            </article>
            {resource.downloads !== undefined ? (
              <article className="detail-summary-card">
                <strong>Access count</strong>
                <p>{resource.downloads}</p>
              </article>
            ) : null}
          </div>
        </section>

        {resource.isApiResource ? (
          <section className="detail-panel">
            <h2>External learning source</h2>
            <p>This resource is stored in the StudyLink backend and may launch an external link or hosted file.</p>
            <p>
              <strong>Source URL:</strong>{' '}
              <button type="button" className="button button-secondary button-sm" onClick={openResource}>Open original source</button>
            </p>
          </section>
        ) : (
          <section className="detail-panel">
            <h2>StudyLink built-in resource</h2>
            <p>This is a built-in revision resource generated inside StudyLink. Open it above to view the study note, guide, or video companion.</p>
          </section>
        )}
      </div>
    </section>
  );
}

export default ResourceDetail;
