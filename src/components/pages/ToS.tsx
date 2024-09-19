import PageTemplate from '../core/PageTemplate';

export function ToS() {
  return (
    <PageTemplate>
      <h2>Terms of Data Use</h2>
      <br />
      <div className="row">
        <p>
          This document serves as the rules for using the data contained on this
          site{' '}
        </p>
      </div>
      <br />
      <h3>Humans</h3>
      <div className="row">
        <p>
          If you are a human and using a brower to view this site, then you are
          free to do so{' '}
        </p>
      </div>
      <br />
      <h3>Bots &amp; other Non-Humans</h3>
      <div className="row">
        <p>
          Due to issues with scrapping bots and other applications causing a
          heavy load on the server all non-humans (including but not limited to
          bots, scripts &amp; other applications) must access all data through
          an API. API access will be granted so long as the following terms are
          met:
        </p>
        <ul>
          <li>
            API usage rate must be reasonable (ie not more than once every 15
            seconds for the same call &amp; parameters)
          </li>
          <li>
            Your API Secret is only used for one application (ie each
            application or instance should have a unique secret)
          </li>
          <li>
            To avoid an unfair advantage your application must be made available
            to any players who want to use it, options for meeting this
            requirement include:
          </li>
          <ul>
            <li>
              {' '}
              Your Application is open-source (under a recognized license such
              as the GPL, MIT, BSD or similar)
            </li>
            <li>
              {' '}
              If your application is a discord bot, it is on the primary war
              discord
            </li>
            <li>
              {' '}
              You provide the application on request along with instructions for
              use (ie. you may distribute a binary if you do not wish to
              disclose source)
            </li>
            <li>
              {' '}
              You offer to setup an instance of the application for others to
              use
            </li>
          </ul>
        </ul>
      </div>
    </PageTemplate>
  );
}
