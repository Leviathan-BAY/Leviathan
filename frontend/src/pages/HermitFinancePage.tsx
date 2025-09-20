import { Flex, Box, Heading, Text, Card, Button, Grid } from "@radix-ui/themes";
import { useState } from "react";
import { ArrowUpIcon, ArrowDownIcon } from "@radix-ui/react-icons";
import hermitLogo from "../assets/images/Hermitlogo.png";
import { CONTRACT_FUNCTIONS, CONTRACT_EVENTS } from '../contracts/constants';

export function HermitFinancePage() {
  const [stakeAmount, setStakeAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("");
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactions, setTransactions] = useState([
    {
      id: 1,
      type: "stake",
      amount: "10.5",
      received: "10.495",
      date: "2024-01-15 14:30",
      status: "completed"
    },
    {
      id: 2,
      type: "stake",
      amount: "25.0",
      received: "24.975",
      date: "2024-01-14 09:15",
      status: "completed"
    }
  ]);

  const fromToken = isUnstaking ? "hSUI" : "SUI";
  const toToken = isUnstaking ? "SUI" : "hSUI";
  const exchangeRate = isUnstaking ? 1.001 : 0.999;

  const handleAmountChange = (value: string) => {
    setStakeAmount(value);
    if (value) {
      const calculated = (parseFloat(value) * exchangeRate).toFixed(6);
      setReceiveAmount(calculated);
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
    const maxBalance = isUnstaking ? "12.5" : "53.614"; // Mock balances
    handleAmountChange(maxBalance);
  };

  const handleStakeClick = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) return;

    setIsLoading(true);
    
    try {
      // 실제 컨트랙트 호출을 위한 함수명 사용 (향후 실제 구현 시 사용)
      console.log('Function:', isUnstaking ? CONTRACT_FUNCTIONS.REDEEM_HSUI : CONTRACT_FUNCTIONS.DEPOSIT_SUI);
      console.log('Event:', isUnstaking ? CONTRACT_EVENTS.HSUI_REDEEMED : CONTRACT_EVENTS.SUI_DEPOSITED);
      
      // Simulate transaction time
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Add new transaction to history
      const newTransaction = {
        id: transactions.length + 1,
        type: isUnstaking ? "unstake" : "stake",
        amount: stakeAmount,
        received: receiveAmount,
        date: new Date().toLocaleString(),
        status: "completed"
      };
      setTransactions([newTransaction, ...transactions]);

      setIsLoading(false);
      setShowSuccess(true);

      // Reset form after success
      setTimeout(() => {
        setShowSuccess(false);
        setStakeAmount("");
        setReceiveAmount("");
      }, 3000);
    } catch (error) {
      console.error('Transaction failed:', error);
      setIsLoading(false);
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
                  Balance: {isUnstaking ? "12.5" : "53.614"}
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
                Balance: {isUnstaking ? "53.614" : "0"}
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
          disabled={isLoading || !stakeAmount || parseFloat(stakeAmount) <= 0}
          style={{
            width: "100%",
            background: isLoading ? "var(--leviathan-text-secondary)" : "var(--leviathan-sky-blue)",
            color: "white",
            borderRadius: "12px",
            fontWeight: 600,
            fontSize: "16px",
            padding: "16px",
            border: "none",
            cursor: isLoading ? "not-allowed" : "pointer",
            transition: "all var(--transition-normal)"
          }}
        >
          {isLoading ? "Processing Transaction..." : (isUnstaking ? "Unstake Now" : "Stake Now")}
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
            73,542 SUI
          </Heading>
          <Text size="1" className="text-gradient">
            +156 SUI today
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
            73,542 hSUI
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
            1.001 SUI
          </Heading>
          <Text size="1" className="text-gradient">
            1 hSUI = 1.001 SUI
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
        {transactions.length === 0 ? (
          <Text className="text-secondary" style={{ textAlign: "center", padding: "32px" }}>
            No transactions yet. Start by staking some SUI!
          </Text>
        ) : (
          <Box>
            {transactions.slice(0, 5).map((tx) => (
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
                  </Box>
                  <Box style={{ textAlign: "right" }}>
                    <Text size="2" className="text-gradient" style={{ fontWeight: 600 }}>
                      ✓ Completed
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