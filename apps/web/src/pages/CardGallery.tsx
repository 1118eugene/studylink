import { useEffect, useState } from 'react';
import { Card } from '../components/Card';

function CardGallery() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const root = document.documentElement;
    const previousTheme = root.getAttribute('data-theme');
    root.setAttribute('data-theme', theme);
    return () => {
      if (previousTheme) root.setAttribute('data-theme', previousTheme);
      else root.removeAttribute('data-theme');
    };
  }, [theme]);

  return (
    <section className="card-gallery-page">
      <div className="card-gallery-heading">
        <div>
          <p className="card-gallery-kicker">StudyLink UI system</p>
          <h1>Card system gallery</h1>
          <p>Preview card variants, content patterns, and interface states.</p>
        </div>
        <div className="card-gallery-theme" role="group" aria-label="Preview theme">
          <button type="button" aria-pressed={theme === 'light'} onClick={() => setTheme('light')}>Light</button>
          <button type="button" aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}>Dark</button>
        </div>
      </div>

      <div className="card-gallery-grid">
        <Card>
          <Card.Header overline="Course · Technology" title="Designing accessible interfaces" subtitle="COMP 204 · Level 2" />
          <Card.Body>
            <Card.Section label="Overview">A reusable elevated card with a clear heading, supporting copy, and semantic sections.</Card.Section>
            <Card.Chips label="Course details">
              <Card.Badge tone="brand">8 resources</Card.Badge>
              <Card.Badge tone="success">Enrolled</Card.Badge>
            </Card.Chips>
          </Card.Body>
          <Card.Footer>
            <button type="button" className="button button-primary">Open course</button>
            <button type="button" className="button button-secondary">Ask StudyLink AI</button>
          </Card.Footer>
        </Card>

        <Card variant="outlined" data-school-category="business">
          <Card.Header overline="Category accent" title="Business course" subtitle="Outlined treatment with category color" />
          <Card.Body>
            <Card.Meta>Updated today · 12 members</Card.Meta>
            <Card.Section label="Category">Category accent colors are decorative and do not replace labels.</Card.Section>
          </Card.Body>
        </Card>

        <Card variant="filled">
          <Card.Header title="Filled summary" subtitle="Sunken surface treatment" />
          <Card.Body><Card.Meta>Used for concise supporting summaries and grouped details.</Card.Meta></Card.Body>
        </Card>

        <Card variant="feature">
          <Card.Header overline="Featured" title="Plan your next study session" subtitle="Feature treatment for a primary summary." />
          <Card.Footer><button type="button" className="button button-primary">View sessions</button></Card.Footer>
        </Card>

        <Card variant="outlined" interactive selected tabIndex={0} aria-label="Selected interactive card">
          <Card.Header title="Selected interactive card" subtitle="Keyboard focus and selection state" />
          <Card.Body><Card.Meta>Interactive cards remain focusable and expose their state.</Card.Meta></Card.Body>
        </Card>

        <Card variant="outlined" disabled>
          <Card.Header title="Disabled card" subtitle="Unavailable action state" />
          <Card.Body><Card.Meta>Disabled state remains visible without implying an active action.</Card.Meta></Card.Body>
        </Card>

        <Card variant="outlined">
          <Card.Media alt="Course image unavailable" placeholder={<span aria-hidden="true">Course image unavailable</span>} />
          <Card.Header title="Image fallback" subtitle="Accessible fallback when media is unavailable" />
        </Card>

        <Card>
          <Card.Header title="Expandable content" subtitle="Long content stays reachable" />
          <Card.Body>
            <Card.Expandable label="group description">
              Study groups can include longer descriptions, requirements, and schedules. The expandable pattern preserves all content while keeping repeated list cards compact and scannable.
            </Card.Expandable>
          </Card.Body>
        </Card>

        <Card.Skeleton media lines={3} />
        <Card.Empty icon="◇" message="No study groups are available yet." action={<button type="button" className="button button-secondary">Create a group</button>} />
        <Card.Error message={`Unable to load sample content (${retryCount} retries).`} onRetry={() => setRetryCount((count) => count + 1)} />
      </div>
    </section>
  );
}

export default CardGallery;
