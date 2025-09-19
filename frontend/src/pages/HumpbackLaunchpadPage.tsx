import { Flex, Box, Heading, Text, Card, Button, Grid, Tabs, Badge, Separator } from "@radix-ui/themes";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { PlusIcon, Pencil2Icon, PlayIcon, StarIcon, PersonIcon, CubeIcon, StackIcon } from "@radix-ui/react-icons";
import humpbackLogo from "../assets/images/Humpbacklogo.png";
import { useGameLaunchpad, useGameMaker } from "../contracts/hooks";
import { MOCK_GAMES } from "../contracts/constants";
import { useState } from "react";

export function HumpbackLaunchpadPage() {
  const currentAccount = useCurrentAccount();
  const { publishedGames, gameStats, isLoading } = useGameLaunchpad();
  const { createGame } = useGameMaker();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const cardStyle = {
    background: "rgba(30, 41, 59, 0.4)",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(148, 163, 184, 0.1)",
    borderRadius: "16px",
    transition: "all 0.3s ease",
  };

  const templateCardStyle = {
    ...cardStyle,
    padding: "24px",
    cursor: "pointer",
    transform: "translateY(0)",
    boxShadow: "0 8px 32px rgba(56, 189, 248, 0.1)",
  };

  const templateCardHoverStyle = {
    ...templateCardStyle,
    transform: "translateY(-4px)",
    boxShadow: "0 16px 48px rgba(56, 189, 248, 0.2)",
    border: "1px solid rgba(56, 189, 248, 0.3)",
  };

  const handleCreateGame = async (template: string) => {
    if (!currentAccount) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      await createGame.mutateAsync({
        title: `My ${template} Game`,
        handMaxSlots: template === "board" ? 5 : 10,
        privateAreaSlots: 3
      });
      alert("Game creation successful! Check your wallet for the game components object.");
    } catch (error) {
      console.error("Game creation failed:", error);
      alert(`Game creation failed: ${error.message}`);
    }
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
            Create and publish Web3 games in minutes, no coding required
          </Text>
        </Box>
      </Flex>

      {/* Quick Start Section */}
      <Card style={{ ...cardStyle, padding: "32px", textAlign: "center" }}>
        <Heading size="6" style={{ color: "white" }} mb="3">Choose Your Game Template</Heading>
        <Text size="4" color="gray" mb="6">
          Select a template below to start creating your game immediately
        </Text>

        {/* Main Game Templates */}
        <Grid columns="2" gap="8" style={{ maxWidth: "800px", margin: "0 auto" }}>
          {/* Board Game Template */}
          <Card
            style={templateCardStyle}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, templateCardHoverStyle)}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, templateCardStyle)}
            onClick={() => setSelectedTemplate("board")}
          >
            <Box style={{ textAlign: "center" }}>
              <Box style={{
                background: "linear-gradient(135deg, var(--sky-9), var(--blue-9))",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "64px",
                height: "64px",
                margin: "0 auto 16px auto"
              }}>
                <CubeIcon width="32" height="32" color="white" />
              </Box>
              <Heading size="5" style={{ color: "white" }} mb="3">Board Game</Heading>
              <Text size="3" color="gray" mb="4">
                Monopoly-style games with a 5×5 board, player tokens, and movement mechanics. Perfect for strategy games.
              </Text>

              {/* Mini Board Preview */}
              <Box style={{
                background: "rgba(148, 163, 184, 0.1)",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "16px"
              }}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: "2px",
                  maxWidth: "150px",
                  margin: "0 auto"
                }}>
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: "16px",
                        height: "16px",
                        background: i === 0 || i === 24 ? "var(--green-9)" :
                                   (i < 5 || i % 5 === 0 || i % 5 === 4 || i > 19) ? "var(--sky-9)" : "rgba(56, 189, 248, 0.3)",
                        borderRadius: "2px",
                      }}
                    />
                  ))}
                </div>
              </Box>

              <Flex gap="2" justify="center">
                <Button
                  size="3"
                  style={{ background: "linear-gradient(135deg, var(--sky-9), var(--blue-9))" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateGame("board");
                  }}
                  disabled={!currentAccount}
                >
                  <PlusIcon /> Create Now
                </Button>
                <Button variant="outline" size="3">
                  <Pencil2Icon /> Customize
                </Button>
              </Flex>
            </Box>
          </Card>

          {/* Card Game Template */}
          <Card
            style={templateCardStyle}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, templateCardHoverStyle)}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, templateCardStyle)}
            onClick={() => setSelectedTemplate("card")}
          >
            <Box style={{ textAlign: "center" }}>
              <Box style={{
                background: "linear-gradient(135deg, var(--purple-9), var(--violet-9))",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "64px",
                height: "64px",
                margin: "0 auto 16px auto"
              }}>
                <StackIcon width="32" height="32" color="white" />
              </Box>
              <Heading size="5" style={{ color: "white" }} mb="3">Card Game</Heading>
              <Text size="3" color="gray" mb="4">
                Deck-based games with hand management, card drawing, and strategic play. Great for TCG-style games.
              </Text>

              {/* Card Preview */}
              <Box style={{
                background: "rgba(148, 163, 184, 0.1)",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "16px"
              }}>
                <Flex gap="2" justify="center" align="center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: "20px",
                        height: "28px",
                        background: i === 2 ? "var(--purple-9)" : "rgba(147, 51, 234, 0.3)",
                        borderRadius: "3px",
                        border: "1px solid rgba(147, 51, 234, 0.5)",
                        transform: i === 2 ? "translateY(-4px)" : "none"
                      }}
                    />
                  ))}
                </Flex>
              </Box>

              <Flex gap="2" justify="center">
                <Button
                  size="3"
                  style={{ background: "linear-gradient(135deg, var(--purple-9), var(--violet-9))" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateGame("card");
                  }}
                  disabled={!currentAccount}
                >
                  <PlusIcon /> Create Now
                </Button>
                <Button variant="outline" size="3">
                  <Pencil2Icon /> Customize
                </Button>
              </Flex>
            </Box>
          </Card>
        </Grid>
      </Card>

      {/* Advanced Templates Section */}
      <Card style={{ ...cardStyle, padding: "24px" }}>
        <Heading size="5" style={{ color: "white" }} mb="3">More Templates</Heading>
        <Text size="3" color="gray" mb="5">
          Additional game types for advanced creators
        </Text>

        <Grid columns="3" gap="4">
          <Card style={{ ...cardStyle, padding: "16px", opacity: 0.6 }}>
            <Badge size="1" color="orange" mb="2">Coming Soon</Badge>
            <Heading size="4" style={{ color: "white" }} mb="2">Strategy Game</Heading>
            <Text size="2" color="gray" mb="3">
              Complex board games with multiple victory conditions and resource management
            </Text>
            <Button variant="outline" size="2" disabled style={{ width: "100%" }}>
              Notify Me
            </Button>
          </Card>

          <Card style={{ ...cardStyle, padding: "16px", opacity: 0.6 }}>
            <Badge size="1" color="orange" mb="2">Coming Soon</Badge>
            <Heading size="4" style={{ color: "white" }} mb="2">Puzzle Game</Heading>
            <Text size="2" color="gray" mb="3">
              Tile-based puzzles with pattern matching and logic challenges
            </Text>
            <Button variant="outline" size="2" disabled style={{ width: "100%" }}>
              Notify Me
            </Button>
          </Card>

          <Card style={{ ...cardStyle, padding: "16px", opacity: 0.6 }}>
            <Badge size="1" color="orange" mb="2">Coming Soon</Badge>
            <Heading size="4" style={{ color: "white" }} mb="2">RPG Game</Heading>
            <Text size="2" color="gray" mb="3">
              Character progression and story-driven adventures
            </Text>
            <Button variant="outline" size="2" disabled style={{ width: "100%" }}>
              Notify Me
            </Button>
          </Card>
        </Grid>
      </Card>

      {/* Game Editor Preview */}
      {selectedTemplate && (
        <Card style={{ ...cardStyle, padding: "24px" }}>
          <Heading size="5" style={{ color: "white" }} mb="4">
            {selectedTemplate === "board" ? "Board Game" : "Card Game"} Editor Preview
          </Heading>

          <Grid columns="2" gap="6">
            {/* Left Side - Game Canvas */}
            <Box>
              <Text size="3" color="gray" mb="3">Game Canvas</Text>
              {selectedTemplate === "board" ? (
                <Box style={{
                  background: "rgba(148, 163, 184, 0.1)",
                  borderRadius: "12px",
                  padding: "16px",
                  border: "2px dashed rgba(56, 189, 248, 0.3)"
                }}>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: "4px",
                    margin: "0 auto",
                    maxWidth: "200px"
                  }}>
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: "32px",
                          height: "32px",
                          background: i === 0 ? "var(--green-9)" :
                                     i === 24 ? "var(--orange-9)" :
                                     (i < 5 || i % 5 === 0 || i % 5 === 4 || i > 19) ? "var(--sky-9)" : "rgba(56, 189, 248, 0.2)",
                          borderRadius: "4px",
                          cursor: "pointer",
                          border: "1px solid rgba(56, 189, 248, 0.4)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "8px",
                          color: "white"
                        }}
                      >
                        {i === 0 ? "S" : i === 24 ? "F" : ""}
                      </div>
                    ))}
                  </div>
                  <Text size="2" color="gray" style={{ textAlign: "center", marginTop: "8px" }}>
                    5×5 Board • S=Start, F=Finish
                  </Text>
                </Box>
              ) : (
                <Box style={{
                  background: "rgba(148, 163, 184, 0.1)",
                  borderRadius: "12px",
                  padding: "24px",
                  border: "2px dashed rgba(147, 51, 234, 0.3)",
                  textAlign: "center"
                }}>
                  {/* Hand Area */}
                  <Text size="2" color="gray" mb="2">Player Hand</Text>
                  <Flex gap="2" justify="center" mb="4">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: "24px",
                          height: "36px",
                          background: "var(--purple-9)",
                          borderRadius: "4px",
                          border: "1px solid rgba(147, 51, 234, 0.5)"
                        }}
                      />
                    ))}
                  </Flex>

                  {/* Deck Area */}
                  <Separator size="4" />
                  <Text size="2" color="gray" mb="2" mt="4">Draw Deck</Text>
                  <div style={{
                    width: "40px",
                    height: "56px",
                    background: "var(--purple-7)",
                    borderRadius: "4px",
                    margin: "0 auto",
                    border: "2px solid var(--purple-9)"
                  }} />
                </Box>
              )}
            </Box>

            {/* Right Side - Tools */}
            <Box>
              <Text size="3" color="gray" mb="3">Editing Tools</Text>
              <Flex direction="column" gap="3">
                <Button size="3" variant="outline">
                  <Pencil2Icon /> Edit Game Rules
                </Button>
                <Button size="3" variant="outline">
                  <CubeIcon /> Add Game Pieces
                </Button>
                <Button size="3" variant="outline">
                  <StarIcon /> Set Special Effects
                </Button>
                <Button size="3" variant="outline">
                  <PlayIcon /> Test Game
                </Button>

                <Separator size="4" />

                <Button
                  size="3"
                  style={{ background: "linear-gradient(135deg, var(--sky-9), var(--blue-9))" }}
                  disabled={!currentAccount}
                  onClick={() => handleCreateGame(selectedTemplate)}
                >
                  {!currentAccount ? "Connect Wallet" : "Publish Game"}
                </Button>
              </Flex>
            </Box>
          </Grid>
        </Card>
      )}

      {/* Community Games Showcase */}
      <Card style={{ ...cardStyle, padding: "24px" }}>
        <Flex justify="between" align="center" mb="5">
          <Box>
            <Heading size="5" style={{ color: "white" }} mb="1">Community Showcase</Heading>
            <Text size="3" color="gray">
              Games created by the Leviathan community
            </Text>
          </Box>
          <Box style={{ textAlign: "right" }}>
            <Text size="2" color="gray">
              {gameStats.data ? `${gameStats.data.totalGames} published games` : "Loading..."}
            </Text>
            <Text size="2" style={{ color: "var(--sky-9)" }}>
              {gameStats.data ? `${gameStats.data.totalPlays} total plays` : ""}
            </Text>
          </Box>
        </Flex>

        {isLoading ? (
          <Box style={{ textAlign: "center", padding: "40px" }}>
            <Text size="3" color="gray">Loading community games...</Text>
          </Box>
        ) : (
          <Grid columns="3" gap="5">
            {publishedGames.data?.slice(0, 6).map((game, index) => (
              <Card
                key={game.id}
                style={{
                  ...cardStyle,
                  padding: "20px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 32px rgba(56, 189, 248, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 8px 32px rgba(56, 189, 248, 0.1)";
                }}
              >
                <Flex justify="between" align="center" mb="3">
                  <Badge
                    size="1"
                    color={index === 0 ? "yellow" : index === 1 ? "purple" : "blue"}
                  >
                    {index === 0 ? "⭐ Featured" : index === 1 ? "🔥 Hot" : "✨ New"}
                  </Badge>
                  <Flex align="center" gap="1">
                    <PersonIcon width="12" height="12" color="var(--gray-10)" />
                    <Text size="1" color="gray">{game.totalPlays}</Text>
                  </Flex>
                </Flex>

                <Heading size="4" style={{ color: "white" }} mb="2">{game.title}</Heading>
                <Text size="2" color="gray" mb="3" style={{ minHeight: "40px" }}>
                  {game.description}
                </Text>

                <Flex justify="between" align="center" mb="3">
                  <Text size="2" style={{ color: "var(--sky-9)" }}>
                    {game.category}
                  </Text>
                  <Text size="2" color="gray">
                    {game.joinFee} SUI
                  </Text>
                </Flex>

                <Button
                  size="2"
                  variant="outline"
                  style={{ width: "100%" }}
                  disabled={!currentAccount}
                  onClick={() => alert(`Playing ${game.title}... (Game engine integration coming soon!)`)}
                >
                  <PlayIcon width="14" height="14" />
                  {currentAccount ? "Play Now" : "Connect Wallet"}
                </Button>
              </Card>
            )) || (
              <Box style={{ textAlign: "center", gridColumn: "1 / -1", padding: "40px" }}>
                <CubeIcon width="48" height="48" color="var(--gray-8)" style={{ marginBottom: "16px" }} />
                <Text size="3" color="gray">No community games yet</Text>
                <Text size="2" color="gray">Be the first to publish a game!</Text>
              </Box>
            )}
          </Grid>
        )}
      </Card>

      {/* Call to Action */}
      <Card style={{ ...cardStyle, padding: "32px", textAlign: "center" }}>
        <Heading size="6" style={{ color: "white" }} mb="3">Ready to Create?</Heading>
        <Text size="4" color="gray" mb="6">
          Join thousands of creators building the future of Web3 gaming
        </Text>
        <Flex gap="4" justify="center">
          <Button
            size="4"
            style={{ background: "linear-gradient(135deg, var(--sky-9), var(--blue-9))" }}
            onClick={() => setSelectedTemplate("board")}
          >
            <PlusIcon /> Start Building
          </Button>
          <Button size="4" variant="outline">
            View Documentation
          </Button>
        </Flex>
      </Card>
    </Flex>
  );
}