import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

type Author = {
  name?: string;
  title?: string;
  url?: string;
  imageURL?: string;
  email?: string;
  page?: {permalink: string} | null;
};

function MaybeLink({
  href,
  className,
  children,
}: {
  href?: string;
  className?: string;
  children: ReactNode;
}): ReactNode {
  if (!href) {
    return <span className={className}>{children}</span>;
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export default function BlogAuthorCard({
  authors,
}: {
  authors: Author[];
}): ReactNode {
  if (!authors || authors.length === 0) {
    return null;
  }
  return (
    <aside className={styles.card} aria-label="Author">
      <div className={styles.label}>Written by</div>
      {authors.map((author, idx) => {
        const link = author.page?.permalink || author.url;
        return (
          <div key={idx} className={styles.author}>
            {author.imageURL && (
              <MaybeLink href={link} className={styles.avatarLink}>
                <img
                  src={author.imageURL}
                  alt={author.name ?? ''}
                  className={styles.avatar}
                />
              </MaybeLink>
            )}
            <div className={styles.text}>
              {author.name && (
                <MaybeLink href={link} className={styles.name}>
                  {author.name}
                </MaybeLink>
              )}
              {author.title && (
                <div className={styles.titleGroup}>
                  {/* Split a multi-role title on " / " so each role sits
                   * on its own line — avoids ugly mid-phrase wraps like
                   * "CEO of OvenMedia Labs / Lead" + "developer of …"
                   * inside the narrow card column. */}
                  {author.title.split(/\s+\/\s+/).map((part, i) => (
                    <div key={i} className={styles.title}>
                      {part}
                    </div>
                  ))}
                </div>
              )}
              {author.email && (
                <div className={styles.email}>{author.email}</div>
              )}
            </div>
          </div>
        );
      })}
    </aside>
  );
}
