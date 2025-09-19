import { Flex, Box, Heading, Text, Grid, Card, Button } from "@radix-ui/themes";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import LeviathanLogo from "../assets/images/Leviathanlogo.png";
import hermitLogo from "../assets/images/Hermitlogo.png";
import humpbackLogo from "../assets/images/Humpbacklogo.png";
import splashZoneLogo from "../assets/images/SplashZonelogo.png";

export function HomePage() {
  const cardStyle = {
    background: "rgba(30, 41, 59, 0.4)",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(148, 163, 184, 0.1)",
    borderRadius: "16px",
    padding: "24px",
    transition: "all 0.3s ease",
    cursor: "pointer",
  };

  const cardHoverStyle = {
    transform: "translateY(-4px)",
    boxShadow: "0 16px 48px rgba(56, 189, 248, 0.2)",
    border: "1px solid rgba(56, 189, 248, 0.3)",
  };

  return (
    <Flex direction="column" gap="8">
      {/* Hero Section */}
      <Card style={{
        ...cardStyle,
        padding: "32px",
        textAlign: "center",
        maxWidth: "900px",
        margin: "0 auto",
        background: "rgba(56, 189, 248, 0.05)",
        border: "1px solid rgba(56, 189, 248, 0.2)"
      }}>
        <Flex direction="column" align="center" gap="4">
          <img
            src={LeviathanLogo}
            alt="Leviathan Logo"
            style={{ height: "120px", width: "auto" }}
          />
          <Heading size="8" style={{ color: "white" }}>
            Leviathan
          </Heading>
          <Heading size="5" style={{ color: "var(--sky-9)" }}>
            Web3 Game Launchpad on Sui
          </Heading>
          <Text size="3" color="gray" style={{ maxWidth: "500px", lineHeight: "1.6" }}>
            Create custom board games with no-code tools, publish on Sui blockchain, and earn rewards based on player engagement
          </Text>

          {/* Quick Stats Row */}
          <Grid columns="3" gap="6" style={{ margin: "16px 0", width: "100%" }}>
            <Box style={{ textAlign: "center" }}>
              <Heading size="4" style={{ color: "var(--sky-9)" }}>12+</Heading>
              <Text size="1" color="gray">Games</Text>
            </Box>
            <Box style={{ textAlign: "center" }}>
              <Heading size="4" style={{ color: "var(--sky-9)" }}>1.2K</Heading>
              <Text size="1" color="gray">Players</Text>
            </Box>
            <Box style={{ textAlign: "center" }}>
              <Heading size="4" style={{ color: "var(--sky-9)" }}>45K SUI</Heading>
              <Text size="1" color="gray">Staked</Text>
            </Box>
          </Grid>

          <Flex gap="3" style={{ marginTop: "8px" }}>
            <Link to="/humpback-launchpad">
              <Button
                size="3"
                style={{ background: "linear-gradient(135deg, var(--sky-9), var(--blue-9))" }}
              >
                <ArrowRightIcon />
                Start Creating
              </Button>
            </Link>
            <Link to="/splash-zone">
              <Button size="3" variant="outline">
                Explore Games
              </Button>
            </Link>
          </Flex>
        </Flex>
      </Card>

      {/* Main Features Grid */}
      <Grid columns="3" gap="6" style={{ maxWidth: "1000px", margin: "0 auto" }}>
        {/* Hermit Finance */}
        <Link to="/hermit-finance" style={{ textDecoration: "none" }}>
          <Card
            style={cardStyle}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, cardStyle)}
          >
            <Flex direction="column" align="center" gap="3">
              <img
                src={hermitLogo}
                alt="Hermit Finance"
                style={{ width: "80px", height: "80px" }}
              />
              <Heading size="4" style={{ color: "white" }}>
                Hermit Finance
              </Heading>
              <Text size="2" color="gray" style={{ textAlign: "center", lineHeight: "1.5" }}>
                Stable value liquid staking with delta-neutral strategy. Protect assets from volatility.
              </Text>
              <Button variant="outline" size="1">
                Learn More
              </Button>
            </Flex>
          </Card>
        </Link>

        {/* Humpback Launchpad */}
        <Link to="/humpback-launchpad" style={{ textDecoration: "none" }}>
          <Card
            style={cardStyle}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, cardStyle)}
          >
            <Flex direction="column" align="center" gap="3">
              <img
                src={humpbackLogo}
                alt="Humpback Launchpad"
                style={{ width: "80px", height: "80px" }}
              />
              <Heading size="4" style={{ color: "white" }}>
                Humpback Launchpad
              </Heading>
              <Text size="2" color="gray" style={{ textAlign: "center", lineHeight: "1.5" }}>
                No-code game creation tool. Build custom board games with automated rules in minutes.
              </Text>
              <Button variant="outline" size="1">
                Create Game
              </Button>
            </Flex>
          </Card>
        </Link>

        {/* Splash Zone */}
        <Link to="/splash-zone" style={{ textDecoration: "none" }}>
          <Card
            style={cardStyle}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, cardStyle)}
          >
            <Flex direction="column" align="center" gap="3">
              <img
                src={splashZoneLogo}
                alt="Splash Zone"
                style={{ width: "80px", height: "80px" }}
              />
              <Heading size="4" style={{ color: "white" }}>
                Splash Zone
              </Heading>
              <Text size="2" color="gray" style={{ textAlign: "center", lineHeight: "1.5" }}>
                Play community games, stake SUI, and compete for prizes in Discord-enabled matches.
              </Text>
              <Button variant="outline" size="1">
                Play Games
              </Button>
            </Flex>
          </Card>
        </Link>
      </Grid>

      {/* Call to Action */}
      <Card style={{
        ...cardStyle,
        padding: "32px",
        textAlign: "center",
        maxWidth: "800px",
        margin: "0 auto",
        background: "rgba(56, 189, 248, 0.1)",
        border: "1px solid rgba(56, 189, 248, 0.3)"
      }}>
        <Heading size="5" style={{ color: "white", marginBottom: "12px" }}>
          Ready to Build the Future of Web3 Gaming?
        </Heading>
        <Text size="3" color="gray" style={{ marginBottom: "24px" }}>
          Join creators and players building the next generation of blockchain games on Sui
        </Text>
        <Flex gap="4" justify="center">
          <Link to="/humpback-launchpad">
            <Button
              size="3"
              style={{ background: "linear-gradient(135deg, var(--sky-9), var(--blue-9))" }}
            >
              Start Creating
            </Button>
          </Link>
          <Link to="/splash-zone">
            <Button size="3" variant="outline">
              Explore Games
            </Button>
          </Link>
        </Flex>
      </Card>
    </Flex>
  );
}