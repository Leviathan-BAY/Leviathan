import { Flex, Box, Heading, Text, Card, Button, Grid, Badge, Avatar, Separator } from "@radix-ui/themes";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { PersonIcon, ChatBubbleIcon, PlayIcon } from "@radix-ui/react-icons";
import { useGameLaunchpad } from "../contracts/hooks";
import { MOCK_GAMES } from "../contracts/constants";
import { useDiscord } from "../hooks/useDiscord";
import { DiscordAuth } from "../components/DiscordAuth";
import { MatchmakingModal } from "../components/MatchmakingModal";
import { useState } from "react";

export function SplashZonePage() {
  const currentAccount = useCurrentAccount();
  const { publishedGames, gameStats, getGameById, isLoading } = useGameLaunchpad();
  const { isAuthenticated: isDiscordConnected, getDisplayName, getAvatarUrl } = useDiscord();
  const [matchmakingOpen, setMatchmakingOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<{id: string, title: string, maxPlayers: number} | null>(null);

  const cardStyle = {
    background: "rgba(30, 41, 59, 0.4)",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(148, 163, 184, 0.1)",
    borderRadius: "16px",
    padding: "24px",
    cursor: "pointer",
    transition: "all 0.3s ease",
  };

  const handlePlayGame = (gameId: string) => {
    const game = getGameById(gameId);
    if (!currentAccount) {
      alert("Please connect your Sui wallet first to play games!");
      return;
    }
    if (!isDiscordConnected) {
      alert("Please connect your Discord account to play with other players!");
      return;
    }
    if (game) {
      setSelectedGame({
        id: gameId,
        title: game.title,
        maxPlayers: game.maxPlayers
      });
      setMatchmakingOpen(true);
    }
  };

  return (
    <Flex direction="column" gap="8" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
      {/* Header */}
      <Box style={{ textAlign: "center" }}>
        <Heading size="8" style={{ color: "white", marginBottom: "16px" }}>
          🌊 Splash Zone
        </Heading>
        <Text size="4" color="gray" style={{ marginBottom: "16px" }}>
          Discover and play amazing Web3 games created by the community
        </Text>

        {/* Player Connection Status */}
        <Card style={{
          background: "rgba(30, 41, 59, 0.6)",
          border: "1px solid rgba(148, 163, 184, 0.2)",
          borderRadius: "12px",
          padding: "16px",
          maxWidth: "600px",
          margin: "0 auto"
        }}>
          <Text size="3" style={{ color: "white", marginBottom: "12px" }}>
            Ready to Play?
          </Text>
          <Flex align="center" justify="center" gap="6">
            <Flex align="center" gap="2">
              <Text size="2" style={{ color: currentAccount ? "var(--green-9)" : "var(--orange-9)" }}>
                {currentAccount ? "✓" : "○"}
              </Text>
              <Text size="2" color="gray">Sui Wallet</Text>
            </Flex>
            <Separator orientation="vertical" size="1" style={{ height: "16px" }} />
            <Flex align="center" gap="2">
              <Text size="2" style={{ color: isDiscordConnected ? "var(--green-9)" : "var(--orange-9)" }}>
                {isDiscordConnected ? "✓" : "○"}
              </Text>
              <Text size="2" color="gray">Discord Profile</Text>
            </Flex>
            {isDiscordConnected && (
              <>
                <Separator orientation="vertical" size="1" style={{ height: "16px" }} />
                <Flex align="center" gap="2">
                  <Avatar
                    src={getAvatarUrl(24) || undefined}
                    fallback={getDisplayName()?.charAt(0) || "?"}
                    size="1"
                  />
                  <Text size="2" style={{ color: "white" }}>
                    {getDisplayName()}
                  </Text>
                </Flex>
              </>
            )}
          </Flex>
          {(!currentAccount || !isDiscordConnected) && (
            <Text size="2" color="gray" style={{ marginTop: "8px" }}>
              {!currentAccount && !isDiscordConnected
                ? "Connect both wallet and Discord to start playing"
                : !currentAccount
                ? "Connect your Sui wallet to continue"
                : "Connect your Discord profile to play with others"
              }
            </Text>
          )}
        </Card>
      </Box>

      {/* Stats Banner */}
      <Card
        style={{
          background: "linear-gradient(135deg, var(--leviathan-sky-blue), var(--leviathan-ocean))",
          borderRadius: "16px",
          padding: "24px",
          color: "white",
        }}
      >
        <Grid columns="4" gap="4">
          <Box style={{ textAlign: "center" }}>
            <Heading size="6" style={{ marginBottom: "8px" }}>
              {gameStats.data?.totalGames || 0}
            </Heading>
            <Text size="3">Games Published</Text>
          </Box>
          <Box style={{ textAlign: "center" }}>
            <Heading size="6" style={{ marginBottom: "8px" }}>
              {gameStats.data?.totalPlays || 0}
            </Heading>
            <Text size="3">Total Plays</Text>
          </Box>
          <Box style={{ textAlign: "center" }}>
            <Heading size="6" style={{ marginBottom: "8px" }}>
              {gameStats.data?.totalValueStaked || 0} SUI
            </Heading>
            <Text size="3">Value Staked</Text>
          </Box>
          <Box style={{ textAlign: "center" }}>
            <Heading size="6" style={{ marginBottom: "8px" }}>
              {gameStats.data?.activeGames || 0}
            </Heading>
            <Text size="3">Active Games</Text>
          </Box>
        </Grid>
      </Card>

      {/* Featured Game */}
      {publishedGames.data && publishedGames.data.length > 0 && (
        <Card
          style={{
            ...cardStyle,
            background: "linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(30, 58, 138, 0.1))",
            border: "1px solid rgba(56, 189, 248, 0.3)",
          }}
        >
          <Flex align="center" justify="between">
            <Box>
              <Badge
                color="blue"
                style={{
                  background: "rgba(56, 189, 248, 0.2)",
                  color: "var(--leviathan-sky-blue)",
                  marginBottom: "12px",
                }}
              >
                ⭐ Featured
              </Badge>
              <Heading size="7" style={{ color: "white", marginBottom: "12px" }}>
                {publishedGames.data[0].title}
              </Heading>
              <Text size="4" color="gray" style={{ marginBottom: "16px" }}>
                {publishedGames.data[0].description}
              </Text>
              <Flex gap="4" align="center">
                <Badge color="cyan">{publishedGames.data[0].category}</Badge>
                <Text size="3" color="gray">
                  {publishedGames.data[0].totalPlays} plays
                </Text>
                <Text size="3" color="gray">
                  Fee: {publishedGames.data[0].joinFee} MIST
                </Text>
              </Flex>
            </Box>
            <Button
              size="4"
              disabled={!currentAccount || !isDiscordConnected}
              onClick={() => handlePlayGame(publishedGames.data[0].id)}
              style={{
                background: (currentAccount && isDiscordConnected) ? "var(--leviathan-sky-blue)" : "var(--gray-6)",
                color: "white",
                padding: "16px 32px",
                fontSize: "16px",
                opacity: (currentAccount && isDiscordConnected) ? 1 : 0.6
              }}
            >
              {!currentAccount ? "Connect Wallet" :
               !isDiscordConnected ? "Connect Discord" : "Play Now"}
            </Button>
          </Flex>
        </Card>
      )}

      {/* Games Grid */}
      <Box>
        <Heading size="6" style={{ color: "white", marginBottom: "24px" }}>
          All Games
        </Heading>

        {isLoading ? (
          <Text size="3" color="gray">Loading games...</Text>
        ) : publishedGames.data && publishedGames.data.length > 0 ? (
          <Grid columns="3" gap="6">
            {publishedGames.data.map((game) => (
              <Card
                key={game.id}
                style={{
                  ...cardStyle,
                  transition: "all 0.3s ease",
                }}
                className="game-card"
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 20px 40px rgba(56, 189, 248, 0.15)";
                  e.currentTarget.style.border = "1px solid rgba(56, 189, 248, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.border = "1px solid rgba(148, 163, 184, 0.1)";
                }}
                onClick={() => handlePlayGame(game.id)}
              >
                {/* Game thumbnail placeholder */}
                <Box
                  style={{
                    width: "100%",
                    height: "120px",
                    background: "linear-gradient(135deg, var(--leviathan-teal), var(--leviathan-indigo))",
                    borderRadius: "12px",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "48px",
                  }}
                >
                  🎮
                </Box>

                <Heading size="4" style={{ color: "white", marginBottom: "8px" }}>
                  {game.title}
                </Heading>

                <Text size="3" color="gray" style={{ marginBottom: "12px", minHeight: "40px" }}>
                  {game.description}
                </Text>

                <Flex justify="between" align="center" style={{ marginBottom: "12px" }}>
                  <Badge color="gray">{game.category}</Badge>
                  <Text size="2" color="gray">
                    {game.totalPlays} plays
                  </Text>
                </Flex>

                <Flex justify="between" align="center" style={{ marginBottom: "16px" }}>
                  <Text size="2" color="gray">
                    Fee: {game.joinFee} MIST
                  </Text>
                  <Text size="2" color="gray">
                    Max: {game.maxPlayers} players
                  </Text>
                </Flex>

                <Button
                  size="3"
                  disabled={!currentAccount || !isDiscordConnected}
                  style={{
                    width: "100%",
                    background: (currentAccount && isDiscordConnected) ? "var(--leviathan-ocean)" : "var(--gray-6)",
                    color: "white",
                    border: "none",
                    opacity: (currentAccount && isDiscordConnected) ? 1 : 0.6,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayGame(game.id);
                  }}
                >
                  {!currentAccount ? "Connect Wallet" :
                   !isDiscordConnected ? "Connect Discord" : "Play Game"}
                </Button>
              </Card>
            ))}
          </Grid>
        ) : (
          <Card style={cardStyle}>
            <Box style={{ textAlign: "center", padding: "40px" }}>
              <Text size="6" style={{ fontSize: "48px", marginBottom: "16px" }}>
                🎮
              </Text>
              <Heading size="5" style={{ color: "white", marginBottom: "12px" }}>
                No Games Yet
              </Heading>
              <Text size="3" color="gray">
                Be the first to create and publish a game on Humpback Launchpad!
              </Text>
            </Box>
          </Card>
        )}
      </Box>

      {/* Instructions for users */}
      <Card style={cardStyle}>
        <Heading size="5" style={{ color: "white", marginBottom: "16px" }}>
          🚀 How to Get Started
        </Heading>
        <Grid columns="2" gap="6">
          <Box>
            <Heading size="4" style={{ color: "var(--leviathan-sky-blue)", marginBottom: "8px" }}>
              For Creators
            </Heading>
            <Text size="3" color="gray">
              1. Visit Humpback Launchpad<br/>
              2. Design your game with our 5×5 board system<br/>
              3. Test your game mechanics<br/>
              4. Publish to Splash Zone
            </Text>
          </Box>
          <Box>
            <Heading size="4" style={{ color: "var(--leviathan-ocean)", marginBottom: "8px" }}>
              For Players
            </Heading>
            <Text size="3" color="gray">
              1. Connect your Sui wallet<br/>
              2. Browse available games<br/>
              3. Pay entry fee in SUI<br/>
              4. Play and win rewards!
            </Text>
          </Box>
        </Grid>
      </Card>

      {/* Matchmaking Modal */}
      {selectedGame && (
        <MatchmakingModal
          isOpen={matchmakingOpen}
          onClose={() => {
            setMatchmakingOpen(false);
            setSelectedGame(null);
          }}
          gameId={selectedGame.id}
          gameTitle={selectedGame.title}
          maxPlayers={selectedGame.maxPlayers}
        />
      )}
    </Flex>
  );
}