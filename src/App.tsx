import { useState } from 'react';
import rtLogo from './assets/rtLogo.png';
import { MenuOptions } from './menu-options';

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div className="wrapper">
        <nav id="sidebar">
          <div className="sidebar-header">
            <img id="RoguewarLogo" src="/src/assets/rtLogo.png" />
          </div>
          <MenuOptions />
          <a href="/tos" style={{ position: 'absolute', bottom: '5px' }}>
            <span className="fas fa-list-alt"></span>
            Terms of Data Use
          </a>
        </nav>
        <div
          id="content"
          className="container"
          style={{ margin: '0px', padding: '0px' }}
        >
          <h1 className="text-4xl text-blue-500">Rogue War Online Map</h1>
          <div className="unsupported-browser"></div>
          <nav
            className="navbar navbar-dark bg-dark"
            style={{ padding: '0.5rem 0rem' }}
          >
            <div
              className="container-fluid"
              // style="padding-left: 0px"
            >
              <button
                type="button"
                id="sidebarCollapse"
                className="btn btn-outline-light"
              >
                <i className="fas fa-align-left"></i>
              </button>
            </div>
          </nav>
          <div id="container"></div>
        </div>
      </div>
    </>
  );
}

export default App;
