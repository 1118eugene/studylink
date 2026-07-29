import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../lib/apiClient';

function getResourceCategory(resource: any) {
  const type = (resource.type || resource.resource_type || '').toString().toLowerCase();
  if (type.includes('pdf')) return 'PDFs & notes';
  if (type.includes('video')) return 'Videos';
  if (type.includes('podcast')) return 'Podcasts';
  if (type.includes('paper')) return 'Past papers';
  if (type.includes('cheat')) return 'Cheat sheets';
  if (type.includes('book')) return 'Books';
  return 'External resources';
}

function Library() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All categories');

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

  const categorizedResources = useMemo(() => {
    return resources.map((resource) => ({
      ...resource,
      category: getResourceCategory(resource),
    }));
  }, [resources]);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(categorizedResources.map((resource) => resource.category)));
    return ['All categories', ...unique];
  }, [categorizedResources]);

  const filteredResources = useMemo(() => {
    return categorizedResources.filter((resource) => {
      const categoryMatch = selectedCategory === 'All categories' || resource.category === selectedCategory;
      const searchMatch = [resource.title, resource.type, resource.resource_type, resource.course, resource.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return categoryMatch && searchMatch;
    });
  }, [categorizedResources, selectedCategory, searchTerm]);

  const groupedResources = useMemo<Record<string, any[]>>(() => {
    return filteredResources.reduce((acc, resource) => {
      const key = resource.category || 'External resources';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(resource);
      return acc;
    }, {} as Record<string, any[]>);
  }, [filteredResources]);

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
        <section className="section-block">
          <p className="workspace-eyebrow">Academic library</p>
          <h2>Organized learning resources for your courses.</h2>
          <p className="workspace-lead">Search and filter lecture notes, PDFs, past papers, podcasts, videos, and external resources from one place.</p>
        </section>

        <section className="workspace-toolbar library-toolbar">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search resources by title, course, or type"
            className="search-input"
          />
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="filter-select"
          >
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </section>

        <div className="library-summary-grid">
          {categories.slice(1).map((category) => (
            <div key={category} className="library-summary-card">
              <strong>{category}</strong>
              <p>{filteredResources.filter((resource) => resource.category === category).length} items</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="workspace-loading-card"><p>Loading your library…</p></div>
        ) : filteredResources.length === 0 ? (
          <div className="empty-state">
            <p className="empty-text">No matching resources found.</p>
            <p className="empty-help">Try expanding your search or selecting a different category.</p>
          </div>
        ) : (
          <div className="resource-library-grid">
            {Object.entries(groupedResources).map(([category, items]) => (
              <section key={category} className="library-category-panel">
                <div className="section-header">
                  <h3>{category}</h3>
                  <span className="panel-pill">{items.length}</span>
                </div>
                <div className="detail-card-grid">
                  {items.map((resource) => (
                    <article key={resource.id} className="resource-library-card">
                      <strong>{resource.title || resource.name || 'Study resource'}</strong>
                      <p>{resource.course || resource.type || resource.resource_type || 'Reference material'}</p>
                      <div className="course-card-topline" style={{ marginTop: '0.75rem' }}>
                        <a href={resource.url} target="_blank" rel="noreferrer" className="button button-secondary">Open</a>
                        <button className="button button-dark" type="button" onClick={() => handleRemove(resource.id)}>Remove</button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Library;
