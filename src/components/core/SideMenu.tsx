import { IconType } from 'react-icons';
import { FaHome, FaList, FaMap } from 'react-icons/fa';
import { Link } from 'react-router-dom';

interface MenuItemInterface {
  icon: IconType;
  path: string;
  label: string;
}

function MenuItem(props: MenuItemInterface) {
  return (
    <li className="items-center text-xl text-white font-bold mb-2 rounded hover:bg-gray-500 hover:shadow py-2">
      <Link to={props.path}>
        {<props.icon className="inline-block w-6 h-6 mr-2 -mt-2" />}
        {props.label}
      </Link>
    </li>
  );
}

export function SideMenu() {
  return (
    <div id="sideMenu" className="w-60 fixed h-full">
      <Link to="/">
        <div className="sideMenu-header">
          <img id="RoguewarLogo" src="/src/assets/rtLogo.png" />
        </div>
      </Link>
      <br />
      <ul>
        <MenuItem icon={FaHome} label="Home" path="/" key="Home" />
        <MenuItem icon={FaMap} label="Map" path="/map" key="Map" />
      </ul>
      <div className="absolute inset-x-0 bottom-0 h-16 items-center text-2x text-white">
        <Link to="/tos" className="inline-">
          <FaList className="inline-block w-4 h-4 mr-2 -mt-1" />
          Terms of Data User
        </Link>
      </div>
    </div>
  );
}
