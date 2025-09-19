import { Container, Flex, Box, Text } from "@radix-ui/themes";
import { Outlet, Link } from "react-router-dom";
import { WalletStatus } from "../WalletStatus";
import leviathanLogo from "../assets/images/Leviathanlogo.png";

export function MainLayout() {
  return (
    <Box
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, var(--blue-9) 0%, var(--indigo-9) 100%)",
      }}
    >
      {/* Header */}
      <Box
        style={{
          backdropFilter: "blur(16px)",
          backgroundColor: "rgba(30, 41, 59, 0.4)",
          borderBottom: "1px solid rgba(148, 163, 184, 0.1)",
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        <Container size="4">
          <Flex justify="between" align="center" py="4">
            {/* Logo */}
            <Link to="/" style={{ textDecoration: "none" }}>
              <Flex align="center" gap="3">
                <img
                  src={leviathanLogo}
                  alt="Leviathan"
                  style={{ width: "48px", height: "48px" }}
                />
                <Text size="6" weight="bold" style={{ color: "white" }}>
                  Leviathan
                </Text>
              </Flex>
            </Link>

            {/* Navigation */}
            <Flex align="center" gap="6">
              <Link to="/hermit-finance" style={{ textDecoration: "none" }}>
                <Text size="3" weight="medium" style={{ color: "white", cursor: "pointer" }}>
                  Hermit Finance
                </Text>
              </Link>
              <Link to="/humpback-launchpad" style={{ textDecoration: "none" }}>
                <Text size="3" weight="medium" style={{ color: "white", cursor: "pointer" }}>
                  Humpback Launchpad
                </Text>
              </Link>
              <Link to="/splash-zone" style={{ textDecoration: "none" }}>
                <Text size="3" weight="medium" style={{ color: "white", cursor: "pointer" }}>
                  Splash Zone
                </Text>
              </Link>

              {/* Wallet Status */}
              <WalletStatus />
            </Flex>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Container size="4" py="6">
        <Outlet />
      </Container>

      {/* Footer */}
      <Box mt="9" py="6">
        <Container size="4">
          <Flex justify="center" align="center">
            <Text size="2" color="gray" align="center">
              © 2025 Leviathan. Web3 Game Launchpad on Sui Network
            </Text>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
}