import {useEffect, useState} from 'react';

type Stats = {stars: number; forks: number} | null;

function fmt(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}

export default function GitHubStats({repo, style}: {repo: string; style?: React.CSSProperties}) {
  const [stats, setStats] = useState<Stats>(null);

  useEffect(() => {
    fetch(`https://api.github.com/repos/${repo}`)
      .then((r) => r.json())
      .then((d) => setStats({stars: d.stargazers_count, forks: d.forks_count}))
      .catch(() => {});
  }, [repo]);

  if (!stats) return null;

  return (
    <div className="github-stats" style={style}>
      <span className="github-stat-badge">
        <svg viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
          <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
        </svg>
        {fmt(stats.stars)}
      </span>
      <span className="github-stat-badge">
        <svg viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
          <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z" />
        </svg>
        {fmt(stats.forks)}
      </span>
    </div>
  );
}
