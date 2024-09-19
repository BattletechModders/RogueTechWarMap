import PageTemplate from '../core/PageTemplate';

interface tosBlockInterface {
  heading2?: string;
  heading3?: string;
}

function TosBlock({
  children,
  heading2,
  heading3,
}: React.PropsWithChildren<tosBlockInterface>) {
  return (
    <>
      {heading2 && (
        <h2 className="text-primary font-extrabold text-3xl ff-comfortaa mb-2">
          {heading2}
        </h2>
      )}
      {heading3 && (
        <h3 className="text-primary font-bold text-2xl ff-comfortaa mb-2">
          {heading3}
        </h3>
      )}
      <div>{children}</div>
    </>
  );
}
interface bulletPointInterface {
  isNested?: boolean;
}
export function BulletPoint({
  children,
  isNested,
}: React.PropsWithChildren<bulletPointInterface>) {
  return (
    <li className={`${isNested ? 'nested-list  ml-12' : 'list-disc ml-4'}`}>
      {children}
    </li>
  );
}

export function ToS() {
  return (
    <PageTemplate>
      <div className="pl-10 pt-10">
        <TosBlock heading2="Terms of Data Use">
          <p>
            This document serves as the rules for using the data contained on
            this site
          </p>
        </TosBlock>
        <br />
        <h3></h3>
        <TosBlock heading3="Humans">
          <p>
            If you are a human and using a brower to view this site, then you
            are free to do so
          </p>
        </TosBlock>
        <br />
        <TosBlock heading3="Bots &amp; other Non-Humans">
          <p className="mb-1">
            Due to issues with scrapping bots and other applications causing a
            heavy load on the server all non-humans (including but not limited
            to bots, scripts &amp; other applications) must access all data
            through an API. API access will be granted so long as the following
            terms are met:
          </p>
          <ul>
            <BulletPoint>
              API usage rate must be reasonable (ie not more than once every 15
              seconds for the same call &amp; parameters)
            </BulletPoint>
            <BulletPoint>
              Your API Secret is only used for one appBulletPointcation (ie each
              application or instance should have a unique secret)
            </BulletPoint>
            <BulletPoint>
              To avoid an unfair advantage your application must be made
              available to any players who want to use it, options for meeting
              this requirement include:
            </BulletPoint>
            <ul>
              <BulletPoint isNested={true}>
                Your Application is open-source (under a recognized
                BulletPointcense such as the GPL, MIT, BSD or similar)
              </BulletPoint>
              <BulletPoint isNested={true}>
                If your application is a discord bot, it is on the primary war
                discord
              </BulletPoint>
              <BulletPoint isNested={true}>
                You provide the application on request along with instructions
                for use (ie. you may distribute a binary if you do not wish to
                disclose source)
              </BulletPoint>
              <BulletPoint isNested={true}>
                You offer to setup an instance of the application for others to
                use
              </BulletPoint>
            </ul>
          </ul>
        </TosBlock>
      </div>
    </PageTemplate>
  );
}
