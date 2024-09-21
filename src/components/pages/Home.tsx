import PageTemplate from '../core/PageTemplate';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Typography,
  Button,
} from '@material-tailwind/react';

enum CardStyle {
  Primary = '-primary',
  Info = '-info',
}

export interface HomeCardInterface {
  style: CardStyle;
  heading: string;
  buttonLabel: string;
  buttonUri: string;
}

export function HomeCard({
  style,
  heading,
  buttonLabel,
  buttonUri,
  children,
}: React.PropsWithChildren<HomeCardInterface>) {
  const borderColor =
    style === CardStyle.Primary ? 'border-primary' : 'border-info';
  const buttonColor =
    style === CardStyle.Primary ? 'button-primary' : 'button-info';
  const textColor = style === CardStyle.Primary ? 'text-primary' : 'text-info';

  return (
    <Card
      className={`mt-6 w-96 h-56 border-2 ${borderColor} p-5 rounded-lg ml-14 inline-block h-96 relative grow-0`}
    >
      <CardHeader className={`relative font-bold ${textColor}`}>
        {heading}
      </CardHeader>
      <CardBody className="relative pt-2">{children}</CardBody>
      <CardFooter className="pt-10 absolute inset-x-5 bottom-8 ">
        <a target="_blank" href={buttonUri}>
          <Button className={`text-red-50 ${buttonColor} rounded p-2`}>
            {buttonLabel}
          </Button>
        </a>
      </CardFooter>
    </Card>
  );
}

export function Home() {
  return (
    <>
      <PageTemplate>
        <h1 className="text-4xl text-center">Welcome to the War Commander</h1>
        <br />
        <Typography className="text-center py-5">
          Welcome to the RogueTech Online, the asynchronous multiplayer map for
          RogueTech.
        </Typography>
        <br />
        <Typography className="text-center py-5">
          From here you can view stats for the various factions, see who
          controls the myriad of star systems within the Inner Sphere, view
          information on current events and learn how the system works.
        </Typography>
        <br />
        <br />
        <h3 className="text-center text-2xl "> How to Participate</h3>
        <Typography className="text-center py-10">
          To participate more than an observer on RogueTech Online you must be a
          member of the RogueWar discord (linked below). Once on the discord,
          you can register your career to gain access to the online shops, and
          become an active member of RTO.
        </Typography>
        <br />
        <div className="flex flex-wrap">
          <HomeCard
            style={CardStyle.Info}
            heading="RogueWar Discord"
            buttonUri="https://discord.gg/JU8tuMG"
            buttonLabel="RogueWar Discord"
          >
            <Typography>
              RogueTech Online has a dedicated discord where you can gather with
              fellow players of your factions and be notified of new online
              events as they go live, this is where you must go to participate
            </Typography>
          </HomeCard>
          <HomeCard
            style={CardStyle.Primary}
            heading="Get RogueTech"
            buttonUri="https://discourse.modsinexile.com/t/rogue-tech/134"
            buttonLabel=" Go To Mods-In-Exile"
          >
            <Typography className="card-text">
              RogueTech can be found on Mods-In-Exile. RogueTech Online is an
              exclusive part of RogueTech.
            </Typography>
          </HomeCard>
          <HomeCard
            style={CardStyle.Primary}
            heading="Need Support"
            buttonUri="https://discord.gg/93kxWQZ"
            buttonLabel="RT Discord"
          >
            <Typography className="card-text">
              RogueTech's primary discord server is where you can file tickets
              and get support with bugs or crashes. You can also chat with
              fellow RT players, share builds and ask for advice.
            </Typography>
            <Typography className="mt-10 font-semibold">
              Note: This is the only place where the RT crew will offer support.
            </Typography>
          </HomeCard>
          <HomeCard
            style={CardStyle.Primary}
            heading="Praise the Wiki"
            buttonUri="https://roguetech.gamepedia.com"
            buttonLabel="Wiki"
          >
            <Typography>
              RogueTech has a general Wiki full of helpful information. If you
              need to know how something works, or information that isn't here,
              try the wiki.
            </Typography>
          </HomeCard>
          <HomeCard
            style={CardStyle.Primary}
            heading="Support RogueTech"
            buttonUri="https://ko-fi.com/roguetech28443"
            buttonLabel="Donate"
          >
            <Typography>
              The RT crew do not expect to receive any compensation for our
              work. However if you would like to help keep our over-worked
              support staff caffeinated or the Urbie factories running you can
              donate here.
            </Typography>
          </HomeCard>
        </div>
      </PageTemplate>
    </>
  );
}
