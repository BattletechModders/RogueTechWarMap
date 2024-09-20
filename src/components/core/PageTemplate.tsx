import { SideMenu } from './SideMenu';

function PageTemplate({
  children,
}: React.PropsWithChildren<Record<never, never>>) {
  return (
    <div className="bg-black">
      <SideMenu />
      <div className="ml-40 pl-2">{children}</div>
    </div>
  );
}

export default PageTemplate;
