import { MenuOptions } from './menu-options';

function App() {
  return (
    <>
      <div className="w-full flex h-svh max-h-svh">
        <div className="h-full flex-[0.15]" id="sideBar">
          {/* SideBar */}
          <h5 className="block font-sans text-xl antialiased font-semibold leading-snug tracking-normal text-blue-gray-900">
            <img id="RoguewarLogo" src="/src/assets/rtLogo.png" />
          </h5>
          <MenuOptions />
          <div className="absolute inset-0">
            <a href="/tos" style={{ position: 'absolute', bottom: '5px' }}>
              <span className="fas fa-list-alt"></span>
              Terms of Data Use
            </a>
          </div>
        </div>
        <div className="h-full flex-1">
          <div className="flex h-full flex-col justify-between overflow-y-scroll bg-black">
            {/* ContentArea */}
            <div className="text-white">Content Area</div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
