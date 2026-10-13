import type { ReactNode } from 'react';

type PageHeaderStat = {
  label: string;
  value: ReactNode;
};

type PageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  stats?: PageHeaderStat[];
  actions?: ReactNode;
  className?: string;
};

export default function PageHeader({
  title,
  description,
  eyebrow,
  stats = [],
  actions,
  className = '',
}: PageHeaderProps) {
  const classes = ['sl-page-header', stats.length === 0 && 'sl-page-header--single', className]
    .filter(Boolean)
    .join(' ');

  return (
    <header className={classes}>
      <div className="sl-page-header-copy">
        {eyebrow ? <p className="sl-page-header-eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <p className="sl-page-header-description">{description}</p> : null}
      </div>
      {stats.length ? (
        <dl className="sl-page-header-stats">
          {stats.map((stat) => (
            <div className="sl-page-header-stat" key={stat.label}>
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {actions ? <div className="sl-page-header-actions">{actions}</div> : null}
    </header>
  );
}
