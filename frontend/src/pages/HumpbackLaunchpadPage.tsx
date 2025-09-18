import { Flex, Box, Heading, Text, Card, Button, Grid, Tabs } from "@radix-ui/themes";
import humpbackLogo from "../assets/images/Humpbacklogo.png";

export function HumpbackLaunchpadPage() {
  const cardStyle = {
    background: "rgba(30, 41, 59, 0.4)",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(148, 163, 184, 0.1)",
    borderRadius: "16px",
    padding: "24px",
  };

  return (
    <Flex direction="column" gap="8">
      {/* Header */}
      <Flex align="center" gap="4" style={{ textAlign: "center" }} justify="center">
        <img
          src={humpbackLogo}
          alt="Humpback Launchpad"
          style={{ width: "64px", height: "64px" }}
        />
        <Box>
          <Heading size="8" style={{ color: "white" }}>Humpback Launchpad</Heading>
          <Text size="4" color="gray">
            No-code game creation with Hand, Board, and Private Area system
          </Text>
        </Box>
      </Flex>

      {/* Game Making Tool Overview */}
      <Card style={cardStyle}>
        <Heading size="5" style={{ color: "white" }} mb="4">Game Making Tool</Heading>
        <Text size="3" color="gray" mb="6">
          Create custom board games using our three-space system: Hand for player cards/tokens,
          Shared Board (5×5) for main gameplay, and Private Area for personal game pieces.
        </Text>

        <Grid columns="3" gap="4">
          <Box style={{ textAlign: "center" }}>
            <Heading size="4" style={{ color: "white" }} mb="2">Hand</Heading>
            <Text size="3" color="gray">
              Player's personal card and token collection space
            </Text>
          </Box>
          <Box style={{ textAlign: "center" }}>
            <Heading size="4" style={{ color: "white" }} mb="2">Shared Board</Heading>
            <Text size="3" color="gray">
              5×5 main board for all players to interact
            </Text>
          </Box>
          <Box style={{ textAlign: "center" }}>
            <Heading size="4" style={{ color: "white" }} mb="2">Private Area</Heading>
            <Text size="3" color="gray">
              3-5 personal slots for individual game pieces
            </Text>
          </Box>
        </Grid>
      </Card>

      {/* Space Types */}
      <Grid columns="3" gap="6">
        <Card style={cardStyle}>
          <Heading size="4" style={{ color: "white" }} mb="3">Image Spaces</Heading>
          <Text size="3" color="gray" mb="4">
            Display backgrounds or showcase cards/tokens. Simple visual elements for game aesthetics.
          </Text>
          <Button variant="outline" style={{ width: "100%" }}>
            Learn More
          </Button>
        </Card>

        <Card style={cardStyle}>
          <Heading size="4" style={{ color: "white" }} mb="3">Deck Spaces</Heading>
          <Text size="3" color="gray" mb="4">
            Card stacks with draw, shuffle, and flip functions. Perfect for card-based mechanics.
          </Text>
          <Button variant="outline" style={{ width: "100%" }}>
            Learn More
          </Button>
        </Card>

        <Card style={cardStyle}>
          <Heading size="4" style={{ color: "white" }} mb="3">Track Spaces</Heading>
          <Text size="3" color="gray" mb="4">
            Token movement with click-based interaction. Supports custom movement rules and effects.
          </Text>
          <Button variant="outline" style={{ width: "100%" }}>
            Learn More
          </Button>
        </Card>
      </Grid>

      {/* Game Creation Flow */}
      <Card style={cardStyle}>
        <Heading size="5" style={{ color: "white" }} mb="4">Create Your Game</Heading>

        <Tabs.Root defaultValue="design">
          <Tabs.List>
            <Tabs.Trigger value="design">Design</Tabs.Trigger>
            <Tabs.Trigger value="rules">Rules</Tabs.Trigger>
            <Tabs.Trigger value="test">Test</Tabs.Trigger>
            <Tabs.Trigger value="publish">Publish</Tabs.Trigger>
          </Tabs.List>

          <Box py="4">
            <Tabs.Content value="design">
              <Text size="3" color="gray" mb="4">
                Set up your game board layout and choose space types for each position.
              </Text>
              <Grid columns="2" gap="4">
                <Box>
                  <Text size="2" color="gray" mb="2">Board Layout</Text>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: "2px",
                    background: "rgba(148, 163, 184, 0.1)",
                    padding: "8px",
                    borderRadius: "8px"
                  }}>
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: "24px",
                          height: "24px",
                          background: "rgba(56, 189, 248, 0.3)",
                          borderRadius: "4px",
                          cursor: "pointer"
                        }}
                      />
                    ))}
                  </div>
                </Box>
                <Box>
                  <Text size="2" color="gray" mb="2">Space Types</Text>
                  <Flex direction="column" gap="2">
                    <Button variant="outline" size="2">Image Space</Button>
                    <Button variant="outline" size="2">Deck Space</Button>
                    <Button variant="outline" size="2">Track Space</Button>
                  </Flex>
                </Box>
              </Grid>
            </Tabs.Content>

            <Tabs.Content value="rules">
              <Text size="3" color="gray" mb="4">
                Define game rules, movement patterns, and win conditions.
              </Text>
              <Grid columns="2" gap="4">
                <Box>
                  <Text size="2" color="gray" mb="2">Movement Rules</Text>
                  <Text size="3" color="gray">
                    • Click-based token movement<br/>
                    • Direct mapping or distance-based<br/>
                    • Custom special effects per space
                  </Text>
                </Box>
                <Box>
                  <Text size="2" color="gray" mb="2">Victory Conditions</Text>
                  <Text size="3" color="gray">
                    • Reach specific positions<br/>
                    • Collect certain items<br/>
                    • Score-based competition
                  </Text>
                </Box>
              </Grid>
            </Tabs.Content>

            <Tabs.Content value="test">
              <Text size="3" color="gray" mb="4">
                Test your game with AI players or local simulation before publishing.
              </Text>
              <Flex gap="4">
                <Button style={{ background: "linear-gradient(135deg, var(--sky-9), var(--blue-9))" }}>
                  Start Test Game
                </Button>
                <Button variant="outline">AI vs AI Demo</Button>
              </Flex>
            </Tabs.Content>

            <Tabs.Content value="publish">
              <Text size="3" color="gray" mb="4">
                Upload to Walrus storage and register on Sui blockchain.
              </Text>
              <Flex direction="column" gap="4">
                <Box>
                  <Text size="2" color="gray" mb="2">Publishing Fee</Text>
                  <Text size="3" style={{ color: "white" }}>5 hSUI</Text>
                </Box>
                <Button
                  size="3"
                  style={{
                    background: "linear-gradient(135deg, var(--sky-9), var(--blue-9))",
                    width: "200px"
                  }}
                >
                  Publish Game
                </Button>
              </Flex>
            </Tabs.Content>
          </Box>
        </Tabs.Root>
      </Card>

      {/* Featured Games */}
      <Box>
        <Heading size="5" style={{ color: "white" }} mb="4">Community Games</Heading>
        <Grid columns="3" gap="4">
          <Card style={{ ...cardStyle, padding: "16px" }}>
            <Text size="2" color="gray" mb="1">Featured</Text>
            <Heading size="4" style={{ color: "white" }} mb="2">5×5 Racing</Heading>
            <Text size="3" color="gray" mb="3">Classic token racing with special power-ups</Text>
            <Flex justify="between" align="center">
              <Text size="2" color="gray">by creator123</Text>
              <Button size="1" variant="outline">Play</Button>
            </Flex>
          </Card>

          <Card style={{ ...cardStyle, padding: "16px" }}>
            <Text size="2" color="gray" mb="1">Popular</Text>
            <Heading size="4" style={{ color: "white" }} mb="2">Card Battle</Heading>
            <Text size="3" color="gray" mb="3">Strategic deck-based combat system</Text>
            <Flex justify="between" align="center">
              <Text size="2" color="gray">by gamedev456</Text>
              <Button size="1" variant="outline">Play</Button>
            </Flex>
          </Card>

          <Card style={{ ...cardStyle, padding: "16px" }}>
            <Text size="2" color="gray" mb="1">New</Text>
            <Heading size="4" style={{ color: "white" }} mb="2">Treasure Hunt</Heading>
            <Text size="3" color="gray" mb="3">Explore the board to find hidden treasures</Text>
            <Flex justify="between" align="center">
              <Text size="2" color="gray">by explorer789</Text>
              <Button size="1" variant="outline">Play</Button>
            </Flex>
          </Card>
        </Grid>
      </Box>
    </Flex>
  );
}