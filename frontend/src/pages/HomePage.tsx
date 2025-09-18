import { Flex, Box, Heading, Text, Grid } from "@radix-ui/themes";
import { Button, Card, CardContent } from "../components/ui";
import hermitLogo from "../assets/images/Hermitlogo.png";
import humpbackLogo from "../assets/images/Humpbacklogo.png";
import splashZoneLogo from "../assets/images/SplashZonelogo.png";

export function HomePage() {
  return (
    <Flex direction="column" gap="8">
      {/* Hero Section */}
      <Box className="text-center section-padding slide-in-up">
        <Heading size="9" mb="4" className="text-gradient">
          Build. Play. Earn.
        </Heading>
        <Text size="5" className="text-secondary mb-6" style={{ maxWidth: "600px", margin: "0 auto" }}>
          Create custom board games with no-code tools, publish on Sui blockchain,
          and earn rewards based on player engagement.
        </Text>
        <Button variant="primary" btnSize="lg" glow>
          Start Creating
        </Button>
      </Box>

      {/* Features Grid */}
      <Grid columns="3" gap="6" width="100%">
        {/* Hermit Finance */}
        <Card variant="hover" className="float-animation">
          <CardContent>
            <Flex direction="column" align="center" gap="4">
              <img
                src={hermitLogo}
                alt="Hermit Finance"
                style={{ width: "80px", height: "80px" }}
              />
              <Heading size="5" className="text-primary">Hermit Finance</Heading>
              <Text size="3" className="text-secondary text-center">
                Stable value liquid staking with delta-neutral strategy.
                Protect your assets from SUI volatility.
              </Text>
              <Button variant="secondary" className="mt-auto">
                Learn More
              </Button>
            </Flex>
          </CardContent>
        </Card>

        {/* Humpback Launchpad */}
        <Card variant="hover" className="float-animation" style={{ animationDelay: "0.2s" }}>
          <CardContent>
            <Flex direction="column" align="center" gap="4">
              <img
                src={humpbackLogo}
                alt="Humpback Launchpad"
                style={{ width: "80px", height: "80px" }}
              />
              <Heading size="5" className="text-primary">Humpback Launchpad</Heading>
              <Text size="3" className="text-secondary text-center">
                No-code game creation tool. Build custom board games
                with cards, tokens, and automated rules.
              </Text>
              <Button variant="secondary" className="mt-auto">
                Create Game
              </Button>
            </Flex>
          </CardContent>
        </Card>

        {/* Splash Zone */}
        <Card variant="hover" className="float-animation" style={{ animationDelay: "0.4s" }}>
          <CardContent>
            <Flex direction="column" align="center" gap="4">
              <img
                src={splashZoneLogo}
                alt="Splash Zone"
                style={{ width: "80px", height: "80px" }}
              />
              <Heading size="5" className="text-primary">Splash Zone</Heading>
              <Text size="3" className="text-secondary text-center">
                Play community-created games, stake SUI,
                and compete for prizes in real-time matches.
              </Text>
              <Button variant="secondary" className="mt-auto">
                Play Games
              </Button>
            </Flex>
          </CardContent>
        </Card>
      </Grid>

      {/* Stats Section */}
      <Card variant="glow" padding="lg" className="mt-8">
        <Grid columns="4" gap="4">
          <Box className="text-center">
            <Heading size="6" className="text-gradient">12+</Heading>
            <Text size="2" className="text-muted">Games Created</Text>
          </Box>
          <Box className="text-center">
            <Heading size="6" className="text-gradient">1.2K</Heading>
            <Text size="2" className="text-muted">Active Players</Text>
          </Box>
          <Box className="text-center">
            <Heading size="6" className="text-gradient">45K SUI</Heading>
            <Text size="2" className="text-muted">Total Value Locked</Text>
          </Box>
          <Box className="text-center">
            <Heading size="6" className="text-gradient">$18K</Heading>
            <Text size="2" className="text-muted">Creator Earnings</Text>
          </Box>
        </Grid>
      </Card>
    </Flex>
  );
}