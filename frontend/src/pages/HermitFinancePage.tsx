import { Flex, Box, Heading, Text, Card, Button, Grid } from "@radix-ui/themes";
import { useState } from "react";
import { ArrowUpIcon, ArrowDownIcon } from "@radix-ui/react-icons";
import { useCurrentAccount } from "@mysten/dapp-kit";
import hermitLogo from "../assets/images/Hermitlogo.png";
import { useHermitFinance, useWalletBalances } from "../contracts/hooks";

export function HermitFinancePage() {
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [isSwapReversed, setIsSwapReversed] = useState(false);

  // Wallet and contract hooks
  const currentAccount = useCurrentAccount();
  const { depositSui, withdrawHSui, vaultStats, isLoading: contractLoading } = useHermitFinance();
  const walletBalances = useWalletBalances(currentAccount?.address);

  const fromToken = isSwapReversed ? "hSUI" : "SUI";
  const toToken = isSwapReversed ? "SUI" : "hSUI";
  const exchangeRate = isSwapReversed ? 1.001 : 0.999;

  const handleAmountChange = (value: string) => {
    setFromAmount(value);
    if (value) {
      const calculated = (parseFloat(value) * exchangeRate).toFixed(6);
      setToAmount(calculated);
    } else {
      setToAmount("");
    }
  };

  const handleSwapDirection = () => {
    setIsSwapReversed(!isSwapReversed);
    setFromAmount("");
    setToAmount("");
  };

  const handleMaxClick = () => {
    if (!walletBalances.data) return;

    const maxBalance = isSwapReversed
      ? walletBalances.data.hSui.balance.toString()
      : walletBalances.data.sui.balance.toString();
    handleAmountChange(maxBalance);
  };

  const handleSwapClick = async () => {
    if (!fromAmount || !currentAccount) {
      alert("Please connect wallet and enter amount");
      return;
    }

    try {
      const amount = parseFloat(fromAmount);
      if (isSwapReversed) {
        // Withdraw hSUI for SUI
        await withdrawHSui.mutateAsync(amount);
        alert("Withdrawal successful!");
      } else {
        // Deposit SUI for hSUI
        await depositSui.mutateAsync(amount);
        alert("Deposit successful!");
      }

      // Clear form
      setFromAmount("");
      setToAmount("");
    } catch (error) {
      console.error("Swap failed:", error);
      alert(`Swap failed: ${error.message}`);
    }
  };

  return (
    <Flex direction="column" gap="8" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
      {/* Hero Banner */}
      <Card
        style={{
          background: "linear-gradient(135deg, var(--leviathan-sky-blue), var(--leviathan-deep-blue))",
          borderRadius: "20px",
          padding: "32px",
          position: "relative",
          overflow: "hidden",
          border: "1px solid rgba(56, 189, 248, 0.3)",
          boxShadow: "0 0 40px rgba(56, 189, 248, 0.2)"
        }}
      >
        <Flex align="center" justify="between">
          <Box style={{ maxWidth: "60%" }}>
            <Heading size="8" style={{ color: "white", marginBottom: "16px", fontWeight: 700 }}>
              Introducing hSUI: Stable Value Liquid Staked SUI for Leviathan
            </Heading>
            <Text size="4" style={{ color: "rgba(255, 255, 255, 0.9)", lineHeight: 1.6 }}>
              Stake your SUI on Hermit Finance to receive hSUI — a yield-generating token you can use across the Sui DeFi ecosystem.
            </Text>
          </Box>
          <Box style={{ position: "relative" }}>
            <img
              src={hermitLogo}
              alt="Hermit Finance"
              style={{
                width: "120px",
                height: "120px",
                filter: "drop-shadow(0 0 20px rgba(255, 255, 255, 0.3))"
              }}
            />
          </Box>
        </Flex>
        <Button
          size="3"
          variant="outline"
          style={{
            marginTop: "24px",
            background: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            color: "white",
            backdropFilter: "blur(10px)"
          }}
        >
          Learn More
        </Button>
      </Card>

      {/* Swap Interface */}
      <Card
        style={{
          background: "var(--leviathan-bg-glass)",
          backdropFilter: "blur(16px)",
          border: "1px solid var(--leviathan-border-glass)",
          borderRadius: "16px",
          padding: "32px",
          maxWidth: "480px",
          margin: "0 auto",
          width: "100%"
        }}
      >
        <Flex align="center" justify="between" style={{ marginBottom: "24px" }}>
          <Heading size="6" className="text-primary">
            Swap
          </Heading>
          <Flex align="center" gap="2">
            <Text size="2" className="text-secondary">0.5%</Text>
            <Box
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                border: "1px solid var(--leviathan-text-secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                color: "var(--leviathan-text-secondary)"
              }}
            >
              ?
            </Box>
          </Flex>
        </Flex>

        {/* From Section */}
        <Box style={{ marginBottom: "8px" }}>
          <Text size="2" className="text-secondary" style={{ marginBottom: "8px", display: "block" }}>
            From
          </Text>
          <Card
            style={{
              background: "rgba(0, 0, 0, 0.2)",
              border: "1px solid var(--leviathan-border-glass)",
              borderRadius: "12px",
              padding: "16px"
            }}
          >
            <Flex justify="between" align="center" style={{ marginBottom: "12px" }}>
              <input
                type="number"
                value={fromAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.0"
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "var(--leviathan-text-primary)",
                  fontSize: "24px",
                  fontWeight: 600,
                  width: "60%"
                }}
              />
              <Button
                size="2"
                style={{
                  background: "var(--leviathan-sky-blue)",
                  color: "white",
                  border: "none",
                  borderRadius: "20px",
                  padding: "8px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <span style={{ fontSize: "16px" }}>⚡</span>
                {fromToken}
              </Button>
            </Flex>
            <Flex justify="between" align="center">
              <Text size="2" className="text-secondary">
                ${fromAmount ? (parseFloat(fromAmount) * 2.45).toFixed(2) : "0.00"}
              </Text>
              <Flex align="center" gap="2">
                <Text size="2" className="text-secondary">
                  Balance: {walletBalances.data
                    ? (isSwapReversed ? walletBalances.data.hSui.formatted : walletBalances.data.sui.formatted)
                    : (currentAccount ? "Loading..." : "Connect Wallet")
                  }
                </Text>
                <Button
                  size="1"
                  variant="ghost"
                  onClick={handleMaxClick}
                  style={{
                    color: "var(--leviathan-sky-blue)",
                    fontSize: "12px",
                    fontWeight: 600,
                    padding: "4px 8px"
                  }}
                >
                  MAX
                </Button>
              </Flex>
            </Flex>
          </Card>
        </Box>

        {/* Swap Direction Button */}
        <Flex justify="center" style={{ margin: "16px 0" }}>
          <Button
            size="2"
            variant="ghost"
            onClick={handleSwapDirection}
            style={{
              background: "var(--leviathan-bg-glass)",
              border: "1px solid var(--leviathan-border-glass)",
              borderRadius: "12px",
              padding: "8px",
              color: "var(--leviathan-text-primary)"
            }}
          >
            <Box style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
              <ArrowUpIcon width="12" height="12" />
              <ArrowDownIcon width="12" height="12" />
            </Box>
          </Button>
        </Flex>

        {/* To Section */}
        <Box style={{ marginBottom: "24px" }}>
          <Text size="2" className="text-secondary" style={{ marginBottom: "8px", display: "block" }}>
            To
          </Text>
          <Card
            style={{
              background: "rgba(0, 0, 0, 0.2)",
              border: "1px solid var(--leviathan-border-glass)",
              borderRadius: "12px",
              padding: "16px"
            }}
          >
            <Flex justify="between" align="center" style={{ marginBottom: "12px" }}>
              <Text
                size="6"
                style={{
                  color: "var(--leviathan-text-primary)",
                  fontWeight: 600,
                  width: "60%"
                }}
              >
                {toAmount || "0.0"}
              </Text>
              <Button
                size="2"
                style={{
                  background: toToken === "hSUI" ? "var(--leviathan-ocean)" : "var(--leviathan-cyan)",
                  color: "white",
                  border: "none",
                  borderRadius: "20px",
                  padding: "8px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <span style={{ fontSize: "16px" }}>💧</span>
                {toToken}
              </Button>
            </Flex>
            <Flex justify="between" align="center">
              <Text size="2" className="text-secondary">
                ${toAmount ? (parseFloat(toAmount) * 2.45).toFixed(2) : "0.00"}
              </Text>
              <Text size="2" className="text-secondary">
                Balance: {walletBalances.data
                  ? (isSwapReversed ? walletBalances.data.sui.formatted : walletBalances.data.hSui.formatted)
                  : (currentAccount ? "Loading..." : "Connect Wallet")
                }
              </Text>
            </Flex>
          </Card>
        </Box>

        {/* Swap Button */}
        <Button
          size="4"
          disabled={!currentAccount || !fromAmount || contractLoading || depositSui.isPending || withdrawHSui.isPending}
          onClick={handleSwapClick}
          style={{
            width: "100%",
            background: (!currentAccount || !fromAmount) ? "var(--gray-6)" : "var(--leviathan-sky-blue)",
            color: "white",
            borderRadius: "12px",
            fontWeight: 600,
            fontSize: "16px",
            padding: "16px",
            border: "none",
            opacity: (!currentAccount || !fromAmount) ? 0.5 : 1,
            cursor: (!currentAccount || !fromAmount) ? "not-allowed" : "pointer"
          }}
        >
          {!currentAccount
            ? "Connect Wallet"
            : (depositSui.isPending || withdrawHSui.isPending)
              ? "Processing..."
              : !fromAmount
                ? "Enter Amount"
                : `${isSwapReversed ? "Withdraw" : "Deposit"} ${fromAmount} ${fromToken}`
          }
        </Button>
      </Card>

      {/* Statistics Grid */}
      <Grid columns="4" gap="4" style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <Card
          style={{
            background: "var(--leviathan-bg-glass)",
            backdropFilter: "blur(16px)",
            border: "1px solid var(--leviathan-border-glass)",
            borderRadius: "16px",
            padding: "24px",
            textAlign: "center"
          }}
        >
          <Text size="2" className="text-secondary" style={{ marginBottom: "8px", display: "block" }}>
            Total Value Locked
          </Text>
          <Heading size="6" className="text-primary" style={{ marginBottom: "4px" }}>
            {vaultStats.data?.totalValueLocked || "Loading..."}
          </Heading>
          <Text size="1" className="text-gradient">
            +2.4% today
          </Text>
        </Card>

        <Card
          style={{
            background: "var(--leviathan-bg-glass)",
            backdropFilter: "blur(16px)",
            border: "1px solid var(--leviathan-border-glass)",
            borderRadius: "16px",
            padding: "24px",
            textAlign: "center"
          }}
        >
          <Text size="2" className="text-secondary" style={{ marginBottom: "8px", display: "block" }}>
            hSUI Supply
          </Text>
          <Heading size="6" className="text-primary" style={{ marginBottom: "4px" }}>
            73,542 hSUI
          </Heading>
          <Text size="1" className="text-gradient">
            +156 today
          </Text>
        </Card>

        <Card
          style={{
            background: "var(--leviathan-bg-glass)",
            backdropFilter: "blur(16px)",
            border: "1px solid var(--leviathan-border-glass)",
            borderRadius: "16px",
            padding: "24px",
            textAlign: "center"
          }}
        >
          <Text size="2" className="text-secondary" style={{ marginBottom: "8px", display: "block" }}>
            Current APY
          </Text>
          <Heading size="6" className="text-primary" style={{ marginBottom: "4px" }}>
            {vaultStats.data?.currentApy || "Loading..."}
          </Heading>
          <Text size="1" className="text-gradient">
            Stable yield
          </Text>
        </Card>

        <Card
          style={{
            background: "var(--leviathan-bg-glass)",
            backdropFilter: "blur(16px)",
            border: "1px solid var(--leviathan-border-glass)",
            borderRadius: "16px",
            padding: "24px",
            textAlign: "center"
          }}
        >
          <Text size="2" className="text-secondary" style={{ marginBottom: "8px", display: "block" }}>
            Exchange Rate
          </Text>
          <Heading size="6" className="text-primary" style={{ marginBottom: "4px" }}>
            {vaultStats.data?.exchangeRate || "Loading..."} SUI
          </Heading>
          <Text size="1" className="text-gradient">
            1 hSUI = {vaultStats.data?.exchangeRate || "1.00"} SUI
          </Text>
        </Card>
      </Grid>

      {/* How it works */}
      <Card
        style={{
          background: "var(--leviathan-bg-glass)",
          backdropFilter: "blur(16px)",
          border: "1px solid var(--leviathan-border-glass)",
          borderRadius: "16px",
          padding: "32px",
          maxWidth: "1000px",
          margin: "0 auto"
        }}
      >
        <Heading size="6" className="text-primary" style={{ marginBottom: "24px", textAlign: "center" }}>
          How Delta-Neutral Strategy Works
        </Heading>
        <Grid columns="3" gap="6">
          <Box style={{ textAlign: "center" }}>
            <Box
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "var(--leviathan-sky-blue)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: "24px"
              }}
            >
              💰
            </Box>
            <Heading size="4" className="text-primary" style={{ marginBottom: "12px" }}>
              1. Deposit
            </Heading>
            <Text size="3" className="text-secondary">
              50% of your SUI goes to staking validators for rewards
            </Text>
          </Box>
          <Box style={{ textAlign: "center" }}>
            <Box
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "var(--leviathan-ocean)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: "24px"
              }}
            >
              🛡️
            </Box>
            <Heading size="4" className="text-primary" style={{ marginBottom: "12px" }}>
              2. Hedge
            </Heading>
            <Text size="3" className="text-secondary">
              50% becomes collateral for 1x short position on perps DEX
            </Text>
          </Box>
          <Box style={{ textAlign: "center" }}>
            <Box
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "var(--leviathan-teal)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: "24px"
              }}
            >
              📈
            </Box>
            <Heading size="4" className="text-primary" style={{ marginBottom: "12px" }}>
              3. Stable Value
            </Heading>
            <Text size="3" className="text-secondary">
              Price movements cancel out, you keep staking rewards
            </Text>
          </Box>
        </Grid>
      </Card>
    </Flex>
  );
}