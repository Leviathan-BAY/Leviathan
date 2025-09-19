import { Flex, Box, Heading, Text, Grid } from "@radix-ui/themes";
import { Button, Card, CardContent } from "../components/ui";
import LeviathanLogo from "../assets/images/Leviathanlogo.png";
import hermitLogo from "../assets/images/Hermitlogo.png";
import humpbackLogo from "../assets/images/Humpbacklogo.png";
import splashZoneLogo from "../assets/images/SplashZonelogo.png";

export function HomePage() {
  return (
    <Flex direction="column" gap="0">
      {/* Hero Section - Leviathan */}
      <Box className="text-center section-padding slide-in-up" style={{ minHeight: "80vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <Heading size="9" mb="4" className="text-gradient">
          Build. Play. Earn.
        </Heading>
        <img
          src={LeviathanLogo}
          alt="Leviathan Logo"
          style={{ width: "360px", height: "500px", margin: "20px auto" }}
        />
        <Heading size="9" mb="4" style={{ fontSize: "3rem", fontWeight: 800, color: "#1E3A8A" }}>
          Leviathan
        </Heading>
        <Text size="5" className="text-secondary mb-6" style={{ maxWidth: "600px", margin: "0 auto" }}>
          Create custom board games with no-code tools, publish on Sui blockchain,
          and earn rewards based on player engagement.
        </Text>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="primary"
            btnSize="lg"
            glow
            style={{ minWidth: '200px' }}
          >
            Start Creating
          </Button>
        </div>
      </Box>

      {/* Hermit Finance Section */}
      <Box className="section-padding feature-section slide-in-up" style={{ minHeight: "70vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <Card variant="hover" style={{ width: "100%", maxWidth: "600px" }}>
          <CardContent>
            <Flex direction="column" align="center" gap="4">
              <img
                src={hermitLogo}
                alt="Hermit Finance"
                style={{ width: "360px", height: "360px" }}
              />
              <Heading size="7" className="text-primary">Hermit Finance</Heading>
              <Text size="4" className="text-secondary text-center">
                Stable value liquid staking with delta-neutral strategy.<br />
                Protect your assets from SUI volatility.
              </Text>
              <Button
                variant="primary"
                style={{ minWidth: '160px' }}
              >
                Learn More
              </Button>
            </Flex>
          </CardContent>
        </Card>
      </Box>

      {/* Humpback Launchpad Section */}
      <Box className="section-padding feature-section slide-in-up" style={{ minHeight: "70vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <Card variant="hover" style={{ width: "100%", maxWidth: "600px" }}>
          <CardContent>
            <Flex direction="column" align="center" gap="4">
              <img
                src={humpbackLogo}
                alt="Humpback Launchpad"
                style={{ width: "360px", height: "360px" }}
              />
              <Heading size="7" className="text-primary">Humpback Launchpad</Heading>
              <Text size="4" className="text-secondary text-center">
                No-code game creation tool. Build custom board games<br />
                with cards, tokens, and automated rules.
              </Text>
              <Button
                variant="primary"
                style={{ minWidth: '160px' }}
              >
                Create Game
              </Button>
            </Flex>
          </CardContent>
        </Card>
      </Box>

      {/* Splash Zone Section */}
      <Box className="section-padding feature-section slide-in-up" style={{ minHeight: "70vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <Card variant="hover" style={{ width: "100%", maxWidth: "600px" }}>
          <CardContent>
            <Flex direction="column" align="center" gap="4">
              <img
                src={splashZoneLogo}
                alt="Splash Zone"
                style={{ width: "360px", height: "360px" }}
              />
              <Heading size="7" className="text-primary">Splash Zone</Heading>
              <Text size="4" className="text-secondary text-center">
                Play community-created games, stake SUI,<br />
                and compete for prizes in real-time matches.
              </Text>
              <Button
                variant="primary"
                style={{ minWidth: '160px' }}
              >
                Play Games
              </Button>
            </Flex>
          </CardContent>
        </Card>
      </Box>

      {/* Stats Section */}
      <Card variant="glow" padding="lg" className="mt-8" style={{ maxWidth: "700px", margin: "0 auto" }}>
        <Grid columns="4" gap="4">
          <Box className="text-center">
            <Heading size="6" className="text-gradient">12+</Heading>
            <Text size="2" className="text-secondary">Games Created</Text>
          </Box>
          <Box className="text-center">
            <Heading size="6" className="text-gradient">1.2K</Heading>
            <Text size="2" className="text-secondary">Active Players</Text>
          </Box>
          <Box className="text-center">
            <Heading size="6" className="text-gradient">45K SUI</Heading>
            <Text size="2" className="text-secondary">Total Value Locked</Text>
          </Box>
          <Box className="text-center">
            <Heading size="6" className="text-gradient">$18K</Heading>
            <Text size="2" className="text-secondary">Creator Earnings</Text>
          </Box>
        </Grid>
      </Card>
    </Flex>
  );
}