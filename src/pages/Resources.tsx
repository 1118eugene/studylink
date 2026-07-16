import { useEffect, useState } from 'react';
import { apiFetch } from '../assets/images/api';

type Resource = {
  id: number;
  title: string;
  type: string;
  url: string;
  description: string;
  usageNotes: string;
  audience: string;
  downloads: number;
};

function Resources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/resources')
      .then((response) => response.json())
      .then((data) => setResources(data.resources || []))
      .catch(() => setResources([]))
      .finally(() => setLoading(false));
  }, []);

  const handleAccess = async (resourceId: number, url: string) => {
    try {
      const response = await apiFetch(`/api/resources/${resourceId}/enroll`, { method: 'POST' });
      if (!response.ok) {
        throw new Error('Resource access failed');
      }

      setResources((current) => current.map((resource) => (
        resource.id === resourceId
          ? { ...resource, downloads: resource.downloads + 1 }
          : resource
      )));
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      alert('Could not record resource access right now.');
    }
  };

  return (
    <section className="workspace-page">
      <div className="container workspace-stack">
        <section className="workspace-hero workspace-hero-resources">
          <div>
            <p className="workspace-eyebrow">Resources</p>
            <h1>Track useful study material with saved access history and cleaner presentation.</h1>
            <p className="workspace-lead">
              Resources opened from this page are recorded, making it easier to show project-worthy usage signals
              across the platform.
            </p>
          </div>
          <div className="hero-stat-grid">
            <article className="hero-stat-card">
              <span className="hero-stat-value">{resources.length}</span>
              <span className="hero-stat-label">Shared resources</span>
            </article>
            <article className="hero-stat-card">
              <span className="hero-stat-value">{resources.reduce((sum, resource) => sum + resource.downloads, 0)}</span>
              <span className="hero-stat-label">Recorded opens</span>
            </article>
          </div>
        </section>

        {loading ? (
          <div className="workspace-loading-card">
            <p>Loading resources...</p>
          </div>
        ) : (
          <div className="resource-library-grid">
            {resources.map((resource) => (
              <article key={resource.id} className="resource-library-card">
                <div className="resource-card-topline">
                  <span className="detail-chip">{resource.type.toUpperCase()}</span>
                  <span className="mini-label">{resource.downloads} opens</span>
                </div>
                <h3>{resource.title}</h3>
                <p>{resource.description}</p>
                <div className="resource-card-meta">
                  <div>
                    <span className="mini-label">Audience</span>
                    <strong>{resource.audience || 'All students'}</strong>
                  </div>
                  <div>
                    <span className="mini-label">Usage</span>
                    <strong>{resource.usageNotes || 'Open to review.'}</strong>
                  </div>
                </div>
                <button type="button" className="button button-primary" onClick={() => handleAccess(resource.id, resource.url)}>
                  Open resource
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Resources;
