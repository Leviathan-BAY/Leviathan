import { Link } from 'react-router-dom'
import { Button } from '@shared/components/ui/button'

export default function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            Leviathan
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            The ultimate Web3 game launchpad on Sui blockchain. Create, customize, and launch your own games with delta-neutral financial stability.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="text-lg px-8">
            <Link to="/launchpad">Create Games</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-lg px-8">
            <Link to="/splash">Play Games</Link>
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="grid md:grid-cols-3 gap-8">
        <div className="glass rounded-lg p-6 space-y-4">
          <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center mx-auto">
            <img src="/images/Hermit.png" alt="Hermit Finance" className="w-12 h-12" />
          </div>
          <h3 className="text-xl font-semibold text-center">Hermit Finance</h3>
          <p className="text-muted-foreground text-center">
            Delta-neutral strategy protects you from SUI price volatility. Trade with stable hSui tokens.
          </p>
          <div className="text-center">
            <Button asChild variant="outline">
              <Link to="/hermit">Learn More</Link>
            </Button>
          </div>
        </div>

        <div className="glass rounded-lg p-6 space-y-4">
          <div className="w-16 h-16 bg-secondary-100 rounded-lg flex items-center justify-center mx-auto">
            <img src="/images/Humpback.png" alt="Humpback Launchpad" className="w-12 h-12" />
          </div>
          <h3 className="text-xl font-semibold text-center">Humpback Launchpad</h3>
          <p className="text-muted-foreground text-center">
            No-code game creation tools. Build custom board games, card games, and more without programming.
          </p>
          <div className="text-center">
            <Button asChild variant="outline">
              <Link to="/launchpad">Start Creating</Link>
            </Button>
          </div>
        </div>

        <div className="glass rounded-lg p-6 space-y-4">
          <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center mx-auto">
            <img src="/images/Splash Zone.png" alt="Splash Zone" className="w-12 h-12" />
          </div>
          <h3 className="text-xl font-semibold text-center">Splash Zone</h3>
          <p className="text-muted-foreground text-center">
            Discover and play community-created games. Compete for rewards in a fair, transparent environment.
          </p>
          <div className="text-center">
            <Button asChild variant="outline">
              <Link to="/splash">Explore Games</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-card rounded-lg p-8">
        <h2 className="text-2xl font-semibold text-center mb-8">Platform Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">0</div>
            <div className="text-sm text-muted-foreground">Games Created</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">0</div>
            <div className="text-sm text-muted-foreground">Active Players</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">0 SUI</div>
            <div className="text-sm text-muted-foreground">Total Volume</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">0 hSUI</div>
            <div className="text-sm text-muted-foreground">TVL</div>
          </div>
        </div>
      </section>
    </div>
  )
}