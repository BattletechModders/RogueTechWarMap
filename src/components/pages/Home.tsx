import PageTemplate from '../core/PageTemplate';

export function Home() {
  return (
    <>
      <PageTemplate>
        <h1>Welcome to the War Commander</h1>
        <br />
        <p>
          {' '}
          Welcome to the RogueTech Online, the asynchronous multiplayer map for
          RogueTech.
        </p>
        <br />
        <p>
          From here you can view stats for the various factions, see who
          controls the myriad of star systems within the Inner Sphere, view
          information on current events and learn how the system works.
        </p>
        <br />
        <br />
        <h3> How to Participate</h3>
        <p>
          {' '}
          To participate more than an observer on RogueTech Online you must be a
          member of the RogueWar discord (linked below). Once on the discord,
          you can register your career to gain access to the online shops, and
          become an active member of RTO.
        </p>
        <br />
        <div className="row">
          <div className="col-lg-4 mb-4">
            <div className="card border-info h-100">
              <div className="card-body d-flex flex-column align-items-start">
                <h4 className="card-title text-info">RogueWar Discord</h4>
                <p className="card-text">
                  RogueTech Online has a dedicated discord where you can gather
                  with fellow players of your factions and be notified of new
                  online events as they go live, this is where you must go to
                  participate
                </p>
                <a
                  href="https://discord.gg/JU8tuMG"
                  className="btn btn-info mt-auto"
                >
                  RogueWar Discord
                </a>
              </div>
            </div>
          </div>
          <div className="col-lg-4 mb-4">
            <div className="card border-primary h-100">
              <div className="card-body d-flex flex-column align-items-start">
                <h4 className="card-title text-primary">Get RogueTech</h4>
                <p className="card-text">
                  RogueTech can be found on Mods-In-Exile. RogueTech Online is
                  an exclusive part of RogueTech.
                </p>
                <br />
                <a
                  href="https://discourse.modsinexile.com/t/rogue-tech/134"
                  className="btn btn-primary mt-auto"
                >
                  Go To Mods-In-Exile
                </a>
              </div>
            </div>
          </div>
          <div className="col-lg-4 mb-4">
            <div className="card border-primary h-100">
              <div className="card-body d-flex flex-column align-items-start">
                <h4 className="card-title text-primary">Need Support</h4>
                <p className="card-text">
                  RogueTech's primary discord server is where you can file
                  tickets and get support with bugs or crashes. You can also
                  chat with fellow RT players, share builds and ask for advice.
                </p>
                <br />
                <b>
                  Note: This is the only place where the RT crew will offer
                  support.
                </b>
                <br />
                <a
                  href="https://discord.gg/93kxWQZ"
                  className="btn btn-primary mt-auto"
                >
                  RT Discord
                </a>
              </div>
            </div>
          </div>
          <div className="col-lg-4 mb-4">
            <div className="card border-primary h-100">
              <div className="card-body d-flex flex-column align-items-start">
                <h4 className="card-title text-primary">Praise the Wiki</h4>
                <p className="card-text">
                  RogueTech has a general Wiki full of helpful information. If
                  you need to know how something works, or information that
                  isn't here, try the wiki.
                </p>
                <a
                  href="https://roguetech.gamepedia.com"
                  className="btn btn-primary mt-auto"
                >
                  Wiki
                </a>
              </div>
            </div>
          </div>
          <div className="col-lg-4 mb-4">
            <div className="card border-primary h-100">
              <div className="card-body d-flex flex-column align-items-start">
                <h4 className="card-title text-primary">Support RogueTech</h4>
                <p className="card-text">
                  The RT crew do not expect to receive any compensation for our
                  work. However if you would like to help keep our over-worked
                  support staff caffeinated or the Urbie factories running you
                  can donate here.
                </p>
                <a
                  href="https://ko-fi.com/roguetech28443"
                  className="btn btn-primary mt-auto"
                >
                  Donate
                </a>
              </div>
            </div>
          </div>
        </div>
      </PageTemplate>
    </>
  );
}
