export default function HermitFinancePage() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="w-24 h-24 bg-primary-100 rounded-lg flex items-center justify-center mx-auto">
          <img src="/images/Hermit.png" alt="Hermit Finance" className="w-16 h-16" />
        </div>
        <h1 className="text-3xl font-bold">Hermit Finance</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Convert your SUI to hSui and protect yourself from price volatility with our delta-neutral strategy.
        </p>
      </div>

      <div className="glass rounded-lg p-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6 text-center">SUI ↔ hSui Converter</h2>

        <div className="space-y-6">
          {/* Conversion Interface Placeholder */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">From: SUI</span>
              <span className="text-sm text-muted-foreground">Balance: 0 SUI</span>
            </div>
            <div className="p-4 border rounded-lg">
              <input
                type="number"
                placeholder="0.0"
                className="w-full bg-transparent text-2xl outline-none"
                disabled
              />
            </div>
          </div>

          <div className="flex justify-center">
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              ↓
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">To: hSUI</span>
              <span className="text-sm text-muted-foreground">Balance: 0 hSUI</span>
            </div>
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="w-full text-2xl text-muted-foreground">0.0</div>
            </div>
          </div>

          <button
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium opacity-50 cursor-not-allowed"
            disabled
          >
            Connect Wallet to Continue
          </button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-card rounded-lg p-6 space-y-3">
          <h3 className="font-semibold">Delta Neutral Strategy</h3>
          <p className="text-sm text-muted-foreground">
            50% staking + 50% futures short position to maintain stable value regardless of SUI price movements.
          </p>
        </div>
        <div className="bg-card rounded-lg p-6 space-y-3">
          <h3 className="font-semibold">1:1 Conversion</h3>
          <p className="text-sm text-muted-foreground">
            Simple 1:1 ratio between SUI and hSui for easy understanding and transparent conversions.
          </p>
        </div>
        <div className="bg-card rounded-lg p-6 space-y-3">
          <h3 className="font-semibold">Instant Liquidity</h3>
          <p className="text-sm text-muted-foreground">
            Convert back to SUI anytime with minimal fees and no lock-up periods.
          </p>
        </div>
      </div>
    </div>
  )
}