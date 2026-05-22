import type {ReactNode} from 'react';

export default function NotFoundContent(): ReactNode {
  return (
    <section
      className="d-flex flex-column position-relative w-100 bg-black bg-gradient-rev"
      style={{minHeight: '80vh', paddingTop: '50px', overflowX: 'hidden'}}>
      <div className="flex-grow-1 d-flex align-items-center justify-content-center text-center position-relative z-1 w-100">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <h1 className="display-1s fw-bold mb-2 lh-1">
                <span className="text-gradient2">404</span>
              </h1>
              <h2 className="display-4 fw-bold text-white mb-4">Page not found</h2>
              <p className="lead text-sub mb-5 col-lg-10 mx-auto">
                Regrettably, the page you are attempting to access is not found.
                <br className="d-none d-sm-block" />
                We apologize for any inconvenience caused.
              </p>
              <div className="d-flex w-100 gap-3 flex-wrap justify-content-center">
                <a
                  href="/"
                  className="btn btn-sm btn-brand-outline rounded-pill px-4"
                  style={{minWidth: '240px'}}>
                  <i className="ph ph-house fs-5 align-middle"></i>&nbsp;&nbsp;Go Home
                </a>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') window.history.back();
                  }}
                  className="btn btn-sm btn-secondary-outline rounded-pill px-4"
                  style={{minWidth: '240px'}}>
                  <i className="ph ph-arrow-left fs-5 align-middle"></i>&nbsp;&nbsp;Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
