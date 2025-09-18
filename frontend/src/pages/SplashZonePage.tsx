export default function SplashZonePage() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="w-24 h-24 bg-primary-100 rounded-lg flex items-center justify-center mx-auto">
          <img src="/images/Splash Zone.png" alt="Splash Zone" className="w-16 h-16" />
        </div>
        <h1 className="text-3xl font-bold">Splash Zone</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover and play amazing games created by our community. Compete with other players and win rewards.
        </p>
      </div>

      {/* Game Browser */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <h2 className="text-2xl font-semibold">Browse Games</h2>

          {/* Filters */}
          <div className="flex gap-2">
            <select className="px-3 py-2 border rounded-lg bg-card text-sm">
              <option>All Categories</option>
              <option>Board Games</option>
              <option>Card Games</option>
              <option>Dice Games</option>
            </select>
            <select className="px-3 py-2 border rounded-lg bg-card text-sm">
              <option>Sort by Popular</option>
              <option>Sort by Newest</option>
              <option>Sort by Rating</option>
            </select>
          </div>
        </div>

        {/* Game Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placeholder for when no games exist */}
          <div className="col-span-full">
            <div className="bg-card rounded-lg p-12 text-center space-y-4 border-2 border-dashed border-muted">
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto">
                🎮
              </div>
              <h3 className="text-lg font-semibold">No Games Available Yet</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Be the first to create a game in the Humpback Launchpad and it will appear here for everyone to play!
              </p>
              <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium">
                Create First Game
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Match */}
      <section className="bg-card rounded-lg p-8">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">Quick Match</h2>
          <p className="text-muted-foreground">
            Jump into a random game and start playing immediately
          </p>
          <button
            className="bg-secondary text-secondary-foreground px-8 py-3 rounded-lg font-medium opacity-50 cursor-not-allowed"
            disabled
          >
            Find Match (No Games Available)
          </button>
        </div>
      </section>

      {/* Leaderboards */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-center">Leaderboards</h2>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Top Players */}
          <div className="bg-card rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-center">Top Players</h3>
            <div className="space-y-3">
              <div className="text-center text-muted-foreground text-sm">
                No players yet
              </div>
            </div>
          </div>

          {/* Most Popular Games */}
          <div className="bg-card rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-center">Popular Games</h3>
            <div className="space-y-3">
              <div className="text-center text-muted-foreground text-sm">
                No games yet
              </div>
            </div>
          </div>

          {/* Recent Winners */}
          <div className="bg-card rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-center">Recent Winners</h3>
            <div className="space-y-3">
              <div className="text-center text-muted-foreground text-sm">
                No matches yet
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}