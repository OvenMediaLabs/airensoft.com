import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import BlogSidebar from '@theme/BlogSidebar';
import NewsletterForm from '@site/src/components/NewsletterForm';

import type {Props} from '@theme/BlogLayout';

export default function BlogLayout(props: Props): ReactNode {
  const {sidebar, toc, children, ...layoutProps} = props;
  const hasSidebar = sidebar && sidebar.items.length > 0;
  const isListPage = !toc;

  return (
    <Layout {...layoutProps}>
      <div className="container margin-vert--lg">
        <div className="row">
          <BlogSidebar sidebar={sidebar} />
          <main
            className={clsx('col', {
              'col--8': hasSidebar,
              'col--10': !hasSidebar && !!toc,
              'col--12': !hasSidebar && !toc,
            })}>
            {children}
          </main>
          {toc && <div className="col col--2">{toc}</div>}
        </div>
      </div>
      {isListPage && (
        <section id="newsletter" className="full-page-section d-flex flex-column position-relative bg-dark-30">
          <div className="w-100 flex-grow-1 d-flex align-items-center py-5">
            <div className="container text-center reveal-up">
              <NewsletterForm />
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
}
