import { HiHome } from 'react-icons/hi';
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import PageTemplate from '../core/PageTemplate';

export default function ErrorPage() {
  return (
    <PageTemplate>
      <ErrorPageContent />
    </PageTemplate>
  );
}

function ErrorPageContent() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div id="error-page">
        {/* <h1>Oops! {error.status}</h1>
        <p>{error.statusText}</p>
        {error.data?.message && (
          <p>
            <i>{error.data.message}</i>
          </p>
        )} */}
        If you came to this page from a link, please contact Rogue War on the
        Discord Server
        <Link to={'/'}>
          <div className="flex">
            <HiHome className="inline-block w-6 h-6 mr-2 -mt-2" />
            Click here to return Home
          </div>
        </Link>
      </div>
    );
  } else if (error instanceof Error) {
    return (
      <div id="error-page">
        <h1>Oops! Unexpected Error</h1>
        <p>Something went wrong.</p>
        <p>
          <i>{error.message}</i>
        </p>
      </div>
    );
  } else {
    return <>Unknown error</>;
  }
}
