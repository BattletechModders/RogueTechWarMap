export const MenuOptions = () => {
  return (
    <>
      <ul className="list-unstyled components">
        <li>
          <a href="/index">
            <span className="fas fa-home"></span>
            Home
          </a>
        </li>
        <li>
          <a href="/recenthistory">
            <span className="fas fa-history"></span>
            Recent Activity
          </a>
        </li>
        <li>
          <a
            href="#infoSubmenu"
            data-toggle="collapse"
            aria-expanded="false"
            className="dropdown-toggle"
          >
            <span className="fas fa-info-circle"></span>
            War Info
          </a>
          <ul className="collapse list-unstyled" id="infoSubmenu">
            <li>
              <a href="/howitworks">
                <span className="fas fa-atom"></span>
                How It Works
              </a>
            </li>
            <li>
              <a href="/contract-info">
                <span className="fas fa-file-signature"></span>
                Contracts
              </a>
            </li>
            <li>
              <a href="/globalsettings">
                <span className="fas fa-globe"></span>
                View Globals
              </a>
            </li>
            <li>
              <a href="/playersearch">
                <span className="fas fa-fingerprint"></span>
                Career Lookup
              </a>
            </li>
            <li>
              <a href="/insurrectsettings">
                <span className="fas fa-chalkboard-teacher"></span>
                Insurrection Information
              </a>
            </li>
            <li>
              <a href="/blackmarkets">
                <span className="fas fa-digital-tachograph"></span>
                About Black Markets
              </a>
            </li>
            <li>
              <a href="/systemdamage">
                <span className="fas fa-skull"></span>
                System Damage Information
              </a>
            </li>
          </ul>
        </li>
        <li>
          <a href="/factions">
            <span className="fas fa-crown"></span>
            Factions
          </a>
        </li>
        <li>
          <a href="/rtolegends">
            <span className="fas fa-user-secret"></span>
            RTO Pilots
          </a>
        </li>
        <li>
          <a href="/systems">
            <span className="fas fa-atlas"></span>
            Star Systems
          </a>
        </li>
        <li>
          <a href="/factorygoods">
            <span className="fas fa-industry"></span>
            Factory Goods
          </a>
        </li>
        <li>
          <a href="/insurrections">
            <span className="fab fa-rebel"></span>
            Insurrections
          </a>
        </li>
        <li>
          <a href="/events">
            <span className="fas fa-newspaper"></span>
            Events
          </a>
        </li>
        <li>
          <a href="/warstats">
            <span className="fas fa-chart-bar"></span>
            War Stats
          </a>
        </li>
        <li>
          <a href="/blackboxMessages">
            <span className="fas fa-satellite-dish"></span>
            K-series Transmitter
          </a>
        </li>
        <li>
          <a
            href="#seasonSubmenu"
            data-toggle="collapse"
            aria-expanded="false"
            className="dropdown-toggle"
          >
            <span className="fas fa-monument"></span>
            Historical Ages
          </a>
          <ul className="collapse list-unstyled" id="seasonSubmenu">
            <li>
              <a href="/ages/s1/overview">
                <span className="fas fa-journal-whills"></span>
                Season 1
              </a>
            </li>
            <li>
              <a href="/ages/s1.5/overview">
                <span className="fas fa-journal-whills"></span>
                Season 1.5
              </a>
            </li>
            <li>
              <a href="/ages/s2r/overview">
                <span className="fas fa-journal-whills"></span>
                Season 2R
              </a>
            </li>
            <li>
              <a href="/ages/s3/overview">
                <span className="fas fa-journal-whills"></span>
                Season 3
              </a>
            </li>
          </ul>
        </li>
        <li>
          <a href="/warmap">
            <span className="fas fa-map-marked-alt"></span>
            War Map
          </a>
        </li>
      </ul>
    </>
  );
};
