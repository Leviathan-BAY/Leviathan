export function Footer() {
  return (
    <footer className="border-t bg-card/50 backdrop-blur-sm mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img src="/images/Leviathan.png" alt="Leviathan" className="w-6 h-6" />
              <span className="font-semibold">Leviathan</span>
            </div>
            <p className="text-sm text-muted-foreground">
              The ultimate Web3 game launchpad on Sui blockchain.
            </p>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h4 className="font-semibold">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/hermit" className="hover:text-primary">Hermit Finance</a></li>
              <li><a href="/launchpad" className="hover:text-primary">Humpback Launchpad</a></li>
              <li><a href="/splash" className="hover:text-primary">Splash Zone</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h4 className="font-semibold">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/docs" className="hover:text-primary">Documentation</a></li>
              <li><a href="/tutorials" className="hover:text-primary">Tutorials</a></li>
              <li><a href="/api" className="hover:text-primary">API Reference</a></li>
            </ul>
          </div>

          {/* Community */}
          <div className="space-y-4">
            <h4 className="font-semibold">Community</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary">Discord</a></li>
              <li><a href="#" className="hover:text-primary">Twitter</a></li>
              <li><a href="#" className="hover:text-primary">GitHub</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Leviathan. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}