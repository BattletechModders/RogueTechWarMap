import { SideMenu } from './SideMenu';

function PageTemplate({
  children,
}: React.PropsWithChildren<Record<never, never>>) {
  return (
    <div className="bg-black">
      <SideMenu />
      <div className="ml-60 pl-2 h-f">{children}</div>
    </div>
  );
}

export default PageTemplate;
