import { useEffect, useState, type CSSProperties, type ComponentPropsWithoutRef, type ElementType, type ReactNode } from 'react';

export type CardVariant = 'elevated' | 'outlined' | 'filled' | 'feature';
export type CardCategory = 'business' | 'technology' | 'arts' | 'health' | 'engineering' | 'default';

export function getCardCategory(value?: string): CardCategory {
  const category = value?.toLowerCase() || '';
  if (category.includes('business')) return 'business';
  if (category.includes('health')) return 'health';
  if (category.includes('engineer')) return 'engineering';
  if (category.includes('art') || category.includes('humanit')) return 'arts';
  if (category.includes('science') || category.includes('technology') || category.includes('computer')) return 'technology';
  return 'default';
}
type CardProps = {
  as?: ElementType;
  variant?: CardVariant;
  interactive?: boolean;
  disabled?: boolean;
  selected?: boolean;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<'article'>, 'as' | 'children' | 'className'>;

function Card({
  as: Element = 'article',
  variant = 'elevated',
  interactive = false,
  disabled = false,
  selected = false,
  className = '',
  children,
  ...props
}: CardProps) {
  const classes = [
    'sl-card',
    `sl-card--${variant}`,
    interactive && 'sl-card--interactive',
    disabled && 'sl-card--disabled',
    selected && 'sl-card--selected',
    className,
  ].filter(Boolean).join(' ');
  return <Element className={classes} aria-disabled={disabled || undefined} aria-current={selected ? 'true' : undefined} {...props}>{children}</Element>;
}

type MediaProps = {
  src?: string | null;
  alt?: string;
  placeholder?: ReactNode;
  className?: string;
};

function Media({ src, alt = '', placeholder, className = '' }: MediaProps) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return (
    <div className={`sl-card__media ${className}`.trim()}>
      {src ? <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} style={failed ? { opacity: 0 } : undefined} /> : null}
      {!src || failed
        ? <div className="sl-card__media-fallback" aria-hidden={!placeholder}>{placeholder || <span aria-hidden="true">✦</span>}</div>
        : null}
    </div>
  );
}

type HeaderProps = {
  overline?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  titleAs?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
};

function Header({ overline, title, subtitle, trailing, titleAs: Title = 'h3' }: HeaderProps) {
  return (
    <header className="sl-card__header">
      <div className="sl-card__heading">
        {overline ? <p className="sl-card__overline">{overline}</p> : null}
        <Title className="sl-card__title">{title}</Title>
        {subtitle ? <p className="sl-card__subtitle">{subtitle}</p> : null}
      </div>
      {trailing ? <div className="sl-card__trailing">{trailing}</div> : null}
    </header>
  );
}

function Body({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`sl-card__body ${className}`.trim()}>{children}</div>;
}

function Meta({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`sl-card__meta ${className}`.trim()}>{children}</div>;
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return <section className="sl-card__section"><h4 className="sl-card__section-label">{label}</h4><div className="sl-card__section-content">{children}</div></section>;
}

function Chips({ children, label = 'Details' }: { children: ReactNode; label?: string }) {
  return <div className="sl-card__chips" aria-label={label}>{children}</div>;
}

function Footer({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <footer className={`sl-card__footer ${className}`.trim()}>{children}</footer>;
}

function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' }) {
  return <span className={`sl-card__badge sl-card__badge--${tone}`}>{children}</span>;
}

function Skeleton({ media = false, lines = 3 }: { media?: boolean; lines?: number }) {
  return (
    <div className="sl-card sl-card--skeleton" aria-busy="true" aria-label="Loading">
      {media ? <div className="sl-skeleton sl-skeleton--media" /> : null}
      <div className="sl-skeleton sl-skeleton--title" />
      {Array.from({ length: Math.max(1, lines) }, (_, index) => (
        <div key={index} className={`sl-skeleton sl-skeleton--line${index === lines - 1 ? ' sl-skeleton--short' : ''}`} />
      ))}
    </div>
  );
}

function Empty({ icon = '◇', message, action }: { icon?: ReactNode; message: string; action?: ReactNode }) {
  return <div className="sl-card sl-card--state sl-card--empty"><span className="sl-card__state-icon" aria-hidden="true">{icon}</span><p>{message}</p>{action}</div>;
}

function Error({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="sl-card sl-card--state sl-card--error" role="alert"><p>{message}</p>{onRetry ? <button className="sl-card__retry" type="button" onClick={onRetry}>Retry</button> : null}</div>;
}

function Expandable({ children, lines = 3, label = 'Description' }: { children: ReactNode; lines?: number; label?: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="sl-card__expandable">
      <div className={`sl-card__expandable-content${expanded ? ' is-expanded' : ''}`} style={{ '--sl-clamp-lines': lines } as CSSProperties}>
        {children}
      </div>
      <button className="sl-card__expand-toggle" type="button" aria-expanded={expanded} aria-label={`${expanded ? 'Show less' : 'Show more'} ${label}`} onClick={() => setExpanded((current) => !current)}>
        {expanded ? 'Show less' : 'Show more'}
      </button>
    </div>
  );
}

function Link({ href, children, label, className = '' }: { href: string; children?: ReactNode; label: string; className?: string }) {
  return <a className={`sl-card__link ${className}`.trim()} href={href} aria-label={label}>{children}</a>;
}

const CardPrimitive = Object.assign(Card, { Media, Header, Body, Meta, Section, Chips, Footer, Badge, Skeleton, Empty, Error, Expandable, Link });
export { CardPrimitive as Card };
