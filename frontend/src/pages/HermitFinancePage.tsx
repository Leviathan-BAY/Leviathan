import { Flex, Box, Heading, Text, Card, Button, Grid } from "@radix-ui/themes";
import { useState } from "react";
import hermitLogo from "../assets/images/Hermitlogo.png";

export function HermitFinancePage() {
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  return (
    <Flex direction="column" gap="8">
      {/* Header */}
      <Flex align="center" gap="4" style={{ textAlign: "center" }} justify="center">
        <img
          src={hermitLogo}
          alt="Hermit Finance"
          style={{ width: "64px", height: "64px" }}
        />
        <Box>
          <Heading size="8" color="white">Hermit Finance</Heading>
          <Text size="4" color="gray">
            Delta-neutral liquid staking for stable value storage
          </Text>
        </Box>
      </Flex>

      {/* Stats Cards */}
      <Grid columns="4" gap="4">
        <Card p="4" style={{
          background: "rgba(30, 41, 59, 0.4)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(148, 163, 184, 0.1)",
        }}>
          <Text size="2" color="gray">Total Value Locked</Text>
          <Heading size="5" color="white">45,234 SUI</Heading>
        </Card>
        <Card p="4" style={{
          background: "rgba(30, 41, 59, 0.4)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(148, 163, 184, 0.1)",
        }}>
          <Text size="2" color="gray">hSUI Supply</Text>
          <Heading size="5" color="white">45,180 hSUI</Heading>
        </Card>
        <Card p="4" style={{
          background: "rgba(30, 41, 59, 0.4)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(148, 163, 184, 0.1)",
        }}>
          <Text size="2" color="gray">APY</Text>
          <Heading size="5" color="white">4.2%</Heading>
        </Card>
        <Card p="4" style={{
          background: "rgba(30, 41, 59, 0.4)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(148, 163, 184, 0.1)",
        }}>
          <Text size="2" color="gray">Exchange Rate</Text>
          <Heading size="5" color="white">1.001 SUI</Heading>
        </Card>
      </Grid>

      {/* Deposit/Withdraw Interface */}
      <Grid columns="2" gap="6">
        {/* Deposit Card */}
        <Card p="6" style={{
          background: "rgba(30, 41, 59, 0.4)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(148, 163, 184, 0.1)",
          borderRadius: "16px",
        }}>
          <Heading size="5" color="white" mb="4">Deposit SUI</Heading>
          <Text size="3" color="gray" mb="4">
            Convert your SUI to hSUI for stable value storage
          </Text>

          <Box mb="4">
            <Text size="2" color="gray" mb="2">Amount to deposit</Text>
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="0.0"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                background: "rgba(0, 0, 0, 0.2)",
                color: "white",
                fontSize: "16px",
              }}
            />
            <Text size="2" color="gray" mt="1">
              You will receive: {depositAmount ? (parseFloat(depositAmount) * 0.999).toFixed(3) : "0"} hSUI
            </Text>
          </Box>

          <Button
            size="3"
            style={{
              width: "100%",
              background: "linear-gradient(135deg, var(--sky-9), var(--blue-9))",
            }}
          >
            Deposit SUI
          </Button>
        </Card>

        {/* Withdraw Card */}
        <Card p="6" style={{
          background: "rgba(30, 41, 59, 0.4)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(148, 163, 184, 0.1)",
          borderRadius: "16px",
        }}>
          <Heading size="5" color="white" mb="4">Withdraw SUI</Heading>
          <Text size="3" color="gray" mb="4">
            Convert your hSUI back to SUI with accrued rewards
          </Text>

          <Box mb="4">
            <Text size="2" color="gray" mb="2">Amount to withdraw</Text>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="0.0"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                background: "rgba(0, 0, 0, 0.2)",
                color: "white",
                fontSize: "16px",
              }}
            />
            <Text size="2" color="gray" mt="1">
              You will receive: {withdrawAmount ? (parseFloat(withdrawAmount) * 1.001).toFixed(3) : "0"} SUI
            </Text>
          </Box>

          <Button
            size="3"
            variant="outline"
            style={{ width: "100%" }}
          >
            Withdraw SUI
          </Button>
        </Card>
      </Grid>

      {/* How it works */}
      <Card p="6" style={{
        background: "rgba(30, 41, 59, 0.4)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(148, 163, 184, 0.1)",
        borderRadius: "16px",
      }}>
        <Heading size="5" color="white" mb="4">How Delta-Neutral Strategy Works</Heading>
        <Grid columns="3" gap="4">
          <Box>
            <Heading size="3" color="white" mb="2">1. Deposit</Heading>
            <Text size="3" color="gray">
              50% of your SUI goes to staking validators for rewards
            </Text>
          </Box>
          <Box>
            <Heading size="3" color="white" mb="2">2. Hedge</Heading>
            <Text size="3" color="gray">
              50% becomes collateral for 1x short position on perps DEX
            </Text>
          </Box>
          <Box>
            <Heading size="3" color="white" mb="2">3. Stable Value</Heading>
            <Text size="3" color="gray">
              Price movements cancel out, you keep staking rewards
            </Text>
          </Box>
        </Grid>
      </Card>
    </Flex>
  );
}