import { useEffect, useState } from 'react';
import { apiFetch } from '../assets/images/api';

function Library() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiFetch('/api/my/resources');
        if (!mounted) return;
        if (res.ok) {
          const json = await res.json();
          setResources(json.resources || []);
        } else {
          setResources([]);
        }
      } catch {
        setResources([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const handleRemove = async (id: number) => {
    try {
      const res = await apiFetch(`/api/my/resources/${id}`, { method: 'DELETE' });
      if (res.status === 204) {
        setResources((prev) => prev.filter((r) => r.id !== id));
      }
    } catch {
      // noop
    }
  };

  return (
    <section className="workspace-page">
      <div className="container workspace-stack">
        <div className="section-block">
          <h2>Your library</h2>
          <p className="page-description">Quick access to resources you've saved or opened.</p>
        </div>

        {loading ? (
          <p>Loading your library…</p>
        ) : resources.length === 0 ? (
          <div className="empty-state">
            <p className="empty-text">No saved resources yet</p>
            <p className="empty-help">Open a course or resource and save items to your library to see them here.</p>
          </div>
        ) : (
          <div className="detail-card-grid">
            {resources.map((r) => (
              <article key={r.id} className="detail-summary-card">
                <strong>{r.title}</strong>
                <p>{r.type || r.resource_type}</p>
                <div style={{ marginTop: 8 }}>
                  <a href={r.url} target="_blank" rel="noreferrer">Open</a>
                  <button style={{ marginLeft: 12 }} className="button button-secondary" onClick={() => handleRemove(r.id)}>Remove</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Library;
