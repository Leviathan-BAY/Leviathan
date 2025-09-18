export default function HumpbackLaunchpadPage() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="w-24 h-24 bg-secondary-100 rounded-lg flex items-center justify-center mx-auto">
          <img src="/images/Humpback.png" alt="Humpback Launchpad" className="w-16 h-16" />
        </div>
        <h1 className="text-3xl font-bold">Humpback Launchpad</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Create your own custom games without any coding knowledge. Choose from templates and customize to your heart's content.
        </p>
      </div>

      {/* Game Templates */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-center">Choose a Template</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 5x5 Board Game Template */}
          <div className="bg-card rounded-lg p-6 space-y-4 border-2 border-primary/20 relative">
            <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
              Featured
            </div>
            <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center mx-auto">
              <div className="grid grid-cols-3 gap-1">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="w-1 h-1 bg-primary rounded-sm" />
                ))}
              </div>
            </div>
            <h3 className="text-lg font-semibold text-center">5x5 Board Game</h3>
            <p className="text-sm text-muted-foreground text-center">
              Create custom board games like Yut-nori with special tiles, custom rules, and victory conditions.
            </p>
            <button className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium">
              Start Creating
            </button>
          </div>

          {/* Card Game Template */}
          <div className="bg-card rounded-lg p-6 space-y-4 opacity-50">
            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto">
              <div className="w-8 h-10 bg-muted-foreground/20 rounded border-2 border-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-semibold text-center">Card Game</h3>
            <p className="text-sm text-muted-foreground text-center">
              Design trading card games with custom decks, abilities, and battle mechanics.
            </p>
            <button className="w-full py-2 bg-muted text-muted-foreground rounded-lg font-medium cursor-not-allowed">
              Coming Soon
            </button>
          </div>

          {/* Dice Game Template */}
          <div className="bg-card rounded-lg p-6 space-y-4 opacity-50">
            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto">
              <div className="w-8 h-8 bg-muted-foreground/20 rounded border border-muted-foreground/30 flex items-center justify-center">
                <div className="grid grid-cols-3 gap-1">
                  <div></div>
                  <div className="w-1 h-1 bg-muted-foreground/50 rounded-full"></div>
                  <div></div>
                  <div className="w-1 h-1 bg-muted-foreground/50 rounded-full"></div>
                  <div className="w-1 h-1 bg-muted-foreground/50 rounded-full"></div>
                  <div className="w-1 h-1 bg-muted-foreground/50 rounded-full"></div>
                  <div></div>
                  <div className="w-1 h-1 bg-muted-foreground/50 rounded-full"></div>
                  <div></div>
                </div>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-center">Dice Game</h3>
            <p className="text-sm text-muted-foreground text-center">
              Build probability-based games with custom dice, betting mechanics, and risk-reward systems.
            </p>
            <button className="w-full py-2 bg-muted text-muted-foreground rounded-lg font-medium cursor-not-allowed">
              Coming Soon
            </button>
          </div>
        </div>
      </section>

      {/* Creation Process */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-center">Creation Process</h2>

        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto font-semibold">
              1
            </div>
            <h3 className="font-medium">Choose Template</h3>
            <p className="text-sm text-muted-foreground">
              Pick a game template that matches your vision
            </p>
          </div>

          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto font-semibold">
              2
            </div>
            <h3 className="font-medium">Customize Rules</h3>
            <p className="text-sm text-muted-foreground">
              Modify game mechanics, victory conditions, and parameters
            </p>
          </div>

          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto font-semibold">
              3
            </div>
            <h3 className="font-medium">Test & Preview</h3>
            <p className="text-sm text-muted-foreground">
              Play test your game with AI bots and validate rules
            </p>
          </div>

          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto font-semibold">
              4
            </div>
            <h3 className="font-medium">Publish</h3>
            <p className="text-sm text-muted-foreground">
              Launch your game to Splash Zone for players to discover
            </p>
          </div>
        </div>
      </section>

      {/* Featured Games */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-center">Featured Community Games</h2>

        <div className="text-center text-muted-foreground">
          <p>No community games yet. Be the first to create one!</p>
        </div>
      </section>
    </div>
  )
}