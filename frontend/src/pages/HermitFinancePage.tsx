import { Flex, Box, Heading, Text, Card, Button, Grid } from "@radix-ui/themes";
import { useState } from "react";
import { ArrowUpIcon, ArrowDownIcon } from "@radix-ui/react-icons";
import hermitLogo from "../assets/images/Hermitlogo.png";
import { useHSui } from "../hooks/useHSui";

export function HermitFinancePage() {
  const [stakeAmount, setStakeAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("");
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Use the hSUI hook for real blockchain integration
  const {
    suiBalance,
    hsuiBalance,
    vaultInfo,
    transactionHistory,
    isLoading,
    error,
    stakeSui,
    unstakeHSui,
    calculateStakeOutput,
    calculateUnstakeOutput,
    clearError,
    isConnected
  } = useHSui();

  const fromToken = isUnstaking ? "hSUI" : "SUI";
  const toToken = isUnstaking ? "SUI" : "hSUI";

  const handleAmountChange = async (value: string) => {
    setStakeAmount(value);
    if (value && parseFloat(value) > 0) {
      try {
        if (isUnstaking) {
          const result = await calculateUnstakeOutput(parseFloat(value));
          setReceiveAmount(result.suiAmount.toFixed(6));
        } else {
          const result = await calculateStakeOutput(parseFloat(value));
          setReceiveAmount(result.toFixed(6));
        }
      } catch (error) {
        console.error('Error calculating output:', error);
        setReceiveAmount("");
      }
    } else {
      setReceiveAmount("");
    }
  };

  const handleToggleStaking = () => {
    setIsUnstaking(!isUnstaking);
    setStakeAmount("");
    setReceiveAmount("");
  };

  const handleMaxClick = () => {
    const maxBalance = isUnstaking ? hsuiBalance.toString() : suiBalance.toString();
    handleAmountChange(maxBalance);
  };

  const handleStakeClick = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) return;
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    // Clear any previous errors
    clearError();

    try {
      const amount = parseFloat(stakeAmount);
      let success = false;

      if (isUnstaking) {
        success = await unstakeHSui(amount);
      } else {
        success = await stakeSui(amount);
      }

      if (success) {
        setShowSuccess(true);
        setStakeAmount("");
        setReceiveAmount("");

        // Hide success message after 3 seconds
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Transaction failed:', error);
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
            {isUnstaking ? "Unstake hSUI" : "Stake SUI"}
          </Heading>
          <Flex align="center" gap="2">
            <Text size="2" className="text-secondary">4.2% APY</Text>
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

        {/* Stake Amount Section */}
        <Box style={{ marginBottom: "8px" }}>
          <Text size="2" className="text-secondary" style={{ marginBottom: "8px", display: "block" }}>
            {isUnstaking ? "Unstake Amount" : "Stake Amount"}
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
                value={stakeAmount}
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
                ${stakeAmount ? (parseFloat(stakeAmount) * 2.45).toFixed(2) : "0.00"}
              </Text>
              <Flex align="center" gap="2">
                <Text size="2" className="text-secondary">
                  Balance: {isUnstaking ? hsuiBalance.toFixed(3) : suiBalance.toFixed(3)}
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
            onClick={handleToggleStaking}
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

        {/* You Will Receive Section */}
        <Box style={{ marginBottom: "24px" }}>
          <Text size="2" className="text-secondary" style={{ marginBottom: "8px", display: "block" }}>
            {isUnstaking ? "You will receive" : "You will receive"}
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
                {receiveAmount || "0.0"}
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
                ${receiveAmount ? (parseFloat(receiveAmount) * 2.45).toFixed(2) : "0.00"}
              </Text>
              <Text size="2" className="text-secondary">
                Balance: {isUnstaking ? suiBalance.toFixed(3) : hsuiBalance.toFixed(3)}
              </Text>
            </Flex>
          </Card>
        </Box>

          {/* Transaction Info */}
        {stakeAmount && parseFloat(stakeAmount) > 0 && (
          <Card style={{
            background: "rgba(56, 189, 248, 0.1)",
            border: "1px solid rgba(56, 189, 248, 0.3)",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "16px"
          }}>
            <Text size="2" className="text-primary" style={{ display: "block", marginBottom: "4px" }}>
              {isUnstaking ? "Unstaking Details:" : "Staking Details:"}
            </Text>
            <Text size="1" className="text-secondary">
              {isUnstaking
                ? `Unstaking ${stakeAmount} hSUI for ~${receiveAmount} SUI`
                : `Staking ${stakeAmount} SUI to receive ~${receiveAmount} hSUI`
              }
            </Text>
            <Text size="1" className="text-secondary" style={{ display: "block" }}>
              {isUnstaking
                ? "Unstaking is instant with current exchange rate"
                : "Earn 4.2% APY on your staked SUI with delta-neutral protection"
              }
            </Text>
          </Card>
        )}

        {/* Network Warning */}
        {isConnected && suiBalance === 0 && (
          <Card style={{
            background: "rgba(251, 191, 36, 0.1)",
            border: "1px solid rgba(251, 191, 36, 0.3)",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "16px",
            textAlign: "center"
          }}>
            <Text size="3" style={{ color: "rgb(251, 191, 36)", fontWeight: 600 }}>
              ⚠️ Network Notice
            </Text>
            <Text size="2" className="text-primary" style={{ display: "block", marginTop: "4px" }}>
              Make sure your wallet is connected to <strong>Sui Testnet</strong> and you have SUI tokens.
              Get testnet SUI from the faucet if needed.
            </Text>
          </Card>
        )}


        {/* Contract Deployment Warning */}
        {isConnected && suiBalance > 0 && !vaultInfo && (
          <Card style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "16px",
            textAlign: "center"
          }}>
            <Text size="3" style={{ color: "rgb(239, 68, 68)", fontWeight: 600 }}>
              ⚠️ Contract Not Deployed
            </Text>
            <Text size="2" className="text-primary" style={{ display: "block", marginTop: "4px" }}>
              The hSUI vault contract is not deployed on testnet yet. Please deploy the contracts first.
            </Text>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "16px",
            textAlign: "center"
          }}>
            <Text size="3" style={{ color: "rgb(239, 68, 68)", fontWeight: 600 }}>
              ⚠️ Transaction Failed
            </Text>
            <Text size="2" className="text-primary" style={{ display: "block", marginTop: "4px" }}>
              {error}
            </Text>
            <Button
              size="1"
              variant="ghost"
              onClick={clearError}
              style={{ marginTop: "8px", color: "rgb(239, 68, 68)" }}
            >
              Dismiss
            </Button>
          </Card>
        )}

        {/* Success Message */}
        {showSuccess && (
          <Card style={{
            background: "rgba(34, 211, 238, 0.1)",
            border: "1px solid rgba(34, 211, 238, 0.3)",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "16px",
            textAlign: "center"
          }}>
            <Text size="3" className="text-gradient" style={{ fontWeight: 600 }}>
              {isUnstaking ? "🎉 Unstaking Successful!" : "🎉 Staking Successful!"}
            </Text>
            <Text size="2" className="text-primary" style={{ display: "block", marginTop: "4px" }}>
              {isUnstaking
                ? `You received ${receiveAmount} SUI`
                : `You received ${receiveAmount} hSUI and are now earning rewards!`
              }
            </Text>
          </Card>
        )}

        {/* Stake Button */}
        <Button
          size="4"
          onClick={handleStakeClick}
          disabled={!isConnected || isLoading || !stakeAmount || parseFloat(stakeAmount) <= 0 || !vaultInfo}
          style={{
            width: "100%",
            background: !isConnected || !vaultInfo
              ? "var(--leviathan-text-secondary)"
              : isLoading
                ? "var(--leviathan-text-secondary)"
                : "var(--leviathan-sky-blue)",
            color: "white",
            borderRadius: "12px",
            fontWeight: 600,
            fontSize: "16px",
            padding: "16px",
            border: "none",
            cursor: (!isConnected || isLoading || !vaultInfo) ? "not-allowed" : "pointer",
            transition: "all var(--transition-normal)"
          }}
        >
          {!isConnected
            ? "Connect Wallet to Continue"
            : !vaultInfo
              ? "Contract Not Available"
              : isLoading
                ? "Processing Transaction..."
                : (isUnstaking ? "Unstake Now" : "Stake Now")
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
            Total SUI Staked
          </Text>
          <Heading size="6" className="text-primary" style={{ marginBottom: "4px" }}>
            {vaultInfo ? vaultInfo.totalDeposits.toLocaleString() : "0"} SUI
          </Heading>
          <Text size="1" className="text-gradient">
            {vaultInfo ? `${vaultInfo.suiBalance.toFixed(0)} SUI in vault` : "Loading..."}
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
            hSUI in Circulation
          </Text>
          <Heading size="6" className="text-primary" style={{ marginBottom: "4px" }}>
            {vaultInfo ? vaultInfo.hsuiSupply.toLocaleString() : "0"} hSUI
          </Heading>
          <Text size="1" className="text-gradient">
            1:1 backed by SUI
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
            4.2%
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
            {vaultInfo ? vaultInfo.exchangeRate.toFixed(3) : "1.000"} SUI
          </Heading>
          <Text size="1" className="text-gradient">
            1 hSUI = {vaultInfo ? vaultInfo.exchangeRate.toFixed(3) : "1.000"} SUI
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

      {/* Transaction History */}
      <Card
        style={{
          background: "var(--leviathan-bg-glass)",
          backdropFilter: "blur(16px)",
          border: "1px solid var(--leviathan-border-glass)",
          borderRadius: "16px",
          padding: "32px",
          maxWidth: "800px",
          margin: "0 auto"
        }}
      >
        <Heading size="6" className="text-primary" style={{ marginBottom: "24px" }}>
          Recent Transactions
        </Heading>
        {!isConnected ? (
          <Text className="text-secondary" style={{ textAlign: "center", padding: "32px" }}>
            Connect your wallet to view transaction history
          </Text>
        ) : transactionHistory.length === 0 ? (
          <Text className="text-secondary" style={{ textAlign: "center", padding: "32px" }}>
            No transactions yet. Start by staking some SUI!
          </Text>
        ) : (
          <Box>
            {transactionHistory.slice(0, 5).map((tx) => (
              <Card
                key={tx.id}
                style={{
                  background: "rgba(0, 0, 0, 0.2)",
                  border: "1px solid var(--leviathan-border-glass)",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "12px"
                }}
              >
                <Flex justify="between" align="center">
                  <Box>
                    <Text size="3" className="text-primary" style={{ fontWeight: 600 }}>
                      {tx.type === "stake" ? "🔒 Staked" : "🔓 Unstaked"} {tx.amount} {tx.type === "stake" ? "SUI" : "hSUI"}
                    </Text>
                    <Text size="2" className="text-secondary" style={{ display: "block" }}>
                      Received {tx.received} {tx.type === "stake" ? "hSUI" : "SUI"}
                    </Text>
                    {tx.hash && (
                      <Text size="1" className="text-secondary" style={{ display: "block", fontFamily: "monospace" }}>
                        Tx: {tx.hash.substring(0, 12)}...
                      </Text>
                    )}
                  </Box>
                  <Box style={{ textAlign: "right" }}>
                    <Text size="2" className="text-gradient" style={{ fontWeight: 600 }}>
                      {tx.status === "completed" ? "✓ Completed" : tx.status === "pending" ? "⏳ Pending" : "❌ Failed"}
                    </Text>
                    <Text size="1" className="text-secondary" style={{ display: "block" }}>
                      {tx.date}
                    </Text>
                  </Box>
                </Flex>
              </Card>
            ))}
          </Box>
        )}
      </Card>
    </Flex>
  );
}