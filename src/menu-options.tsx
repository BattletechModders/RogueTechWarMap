import {
  HomeIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from './icons';

export const MenuOptions = () => {
  return (
    <>
      <nav className="flex min-w-[240px] flex-col gap-1 p-2 font-sans text-base font-normal text-blue-gray-700">
        <SideMenuOption icon={<HomeIcon />} label="Home" url="/index" />
        <SideMenuOption
          icon={<ChevronUpIcon />}
          label="Recent Activity"
          url="/recenthistory"
        />
        <CollapsableSideMenuOption icon={<ChevronRightIcon />} label="War Info">
          <SideMenuOption
            icon={<ChevronLeftIcon />}
            url="/howitworks"
            label="How It Works"
          />
        </CollapsableSideMenuOption>
        <SideMenuOption
          icon={<ChevronDownIcon />}
          label="Factions"
          url="/factions"
        />
        <SideMenuOption
          icon={<HomeIcon />}
          label="RTO Pilots"
          url="rtolegends"
        />
        <SideMenuOption
          icon={<HomeIcon />}
          label="Star Systems"
          url="rtolegends"
        />
        <SideMenuOption
          icon={<HomeIcon />}
          label="Factory Goods"
          url="factorygoods"
        />
        <SideMenuOption
          icon={<HomeIcon />}
          label="Insurrections"
          url="/insurrections"
        />
        <SideMenuOption
          icon={<ChevronRightIcon />}
          label="Events"
          url="/events"
        />
        <SideMenuOption
          icon={<ChevronLeftIcon />}
          label="War Stats"
          url="/warstats"
        />
        <SideMenuOption
          icon={<ChevronUpIcon />}
          label="K-series Transmitter"
          url="/blackboxMessages"
        />
        <CollapsableSideMenuOption icon={<HomeIcon />} label="Historical Ages">
          <SideMenuOption
            icon={<ChevronDownIcon />}
            url="/ages/s1/overview"
            label="Season 1"
          />
        </CollapsableSideMenuOption>
        <SideMenuOption icon={<HomeIcon />} label="War Map" url="warmap" />
      </nav>
    </>
  );
};

export interface SideMenuOptionProps {
  label: string;
  url: string;
  icon: React.ReactNode;
}

export const SideMenuOption = (props: SideMenuOptionProps) => {
  return (
    <>
      <a href={props.url} key={props.label}>
        <div
          role="button"
          className="flex items-center w-full p-3 leading-tight transition-all rounded-lg outline-none text-start hover:bg-blue-gray-50 hover:bg-opacity-80 hover:text-blue-gray-900 focus:bg-blue-gray-50 focus:bg-opacity-80 
          focus:text-blue-gray-900 active:bg-blue-gray-50 active:bg-opacity-80 active:text-blue-gray-900"
        >
          <div className="grid mr-4 place-items-center">{props.icon}</div>
          {props.label}
        </div>
      </a>
    </>
  );
};

export interface CollapsableSideMenuProps {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export const CollapsableSideMenuOption = (props: CollapsableSideMenuProps) => {
  return (
    <>
      <div
        role="button"
        className="flex items-center w-full p-3 leading-tight transition-all rounded-lg outline-none text-start hover:bg-blue-gray-50 hover:bg-opacity-80 hover:text-blue-gray-900 focus:bg-blue-gray-50 focus:bg-opacity-80 
          focus:text-blue-gray-900 active:bg-blue-gray-50 active:bg-opacity-80 active:text-blue-gray-900"
      >
        <div className="grid mr-4 place-items-center">{props.icon}</div>
        {props.label}
      </div>
      <div>{props.children}</div>
    </>
  );
};
