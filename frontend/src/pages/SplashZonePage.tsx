import { Flex, Box, Heading, Text, Card, Button, Grid, Badge, Avatar, Separator, Tabs, TextField, Select } from "@radix-ui/themes";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { useBoardGameTemplates, useGameRegistry } from "../contracts/hooks";
import { GAME_LIMITS } from "../contracts/constants";
import { useDiscord } from "../hooks/useDiscord";
import { MatchmakingModal } from "../components/MatchmakingModal";
import { gameInstanceManager } from "../utils/gameInstanceManager";
import { boardGameInstanceManager } from "../utils/boardGameInstanceManager";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PlayIcon, PlusIcon, MagnifyingGlassIcon, StackIcon } from "@radix-ui/react-icons";
import { REGISTRY_ID } from "../contracts/constants";

export function SplashZonePage() {
  const currentAccount = useCurrentAccount();
  const navigate = useNavigate();
  const { data: publishedGames, isLoading } = useBoardGameTemplates();
  const { isAuthenticated: isDiscordConnected, getDisplayName, getAvatarUrl } = useDiscord();
  const client = useSuiClient();

  // Game registry hooks - now properly fetching from registry
  const {
    registeredGames,
    waitingInstances,
    createGameInstance,
    joinGameInstance,
    registryStats
  } = useGameRegistry();
  const [matchmakingOpen, setMatchmakingOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<{id: string, title: string, maxPlayers: number} | null>(null);

  // Card game state
  const [cardGameTemplates, setCardGameTemplates] = useState<any[]>([]);
  const [cardGameInstances, setCardGameInstances] = useState<any[]>([]);

  // Board game state
  const [boardGameInstances, setBoardGameInstances] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Load card game and board game data
  useEffect(() => {
    const cardTemplates = gameInstanceManager.getAllTemplates();
    const cardInstances = gameInstanceManager.getWaitingInstances();
    const boardInstances = boardGameInstanceManager.getWaitingInstances();

    setCardGameTemplates(cardTemplates);
    setCardGameInstances(cardInstances);
    setBoardGameInstances(boardInstances);
  }, []);

  // Combined game stats including registry data
  const gameStats = {
    data: {
      totalGames: (registeredGames.data?.length || 0) + cardGameTemplates.length,
      totalPlays: cardGameTemplates.reduce((sum, template) => sum + template.totalGames, 0),
      totalValueStaked: cardGameTemplates.reduce((sum, template) => sum + template.totalStaked, 0),
      activeGames: (waitingInstances.data?.length || 0) + cardGameInstances.length + boardGameInstances.length
    }
  };

  const getGameById = (gameId: string) => {
    return publishedGames?.find(game => game.id === gameId);
  };

  const cardStyle = {
    background: "rgba(30, 41, 59, 0.4)",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(148, 163, 184, 0.1)",
    borderRadius: "16px",
    padding: "24px",
    cursor: "pointer",
    transition: "all 0.3s ease",
  };

  const handlePlayBoardGame = async (gameId: string) => {
    if (!currentAccount) {
      alert("Please connect your Sui wallet first to play games!");
      return;
    }

    try {
      // Find the game from registry
      const game = registeredGames.data?.find(g => g.id === gameId);
      if (!game) {
        alert("Game not found");
        return;
      }

      const stakeAmount = game.template?.stake_amount ?
        Number(game.template.stake_amount) / 1000000000 : 1; // Convert from mist to SUI

      // Create game instance on-chain using the package_id as template
      const result = await createGameInstance.mutateAsync({
        templateId: game.package_id,
        maxPlayers: game.template?.pieces_per_player || 2,
        stakeAmount
      });

      // Create local instance for navigation
      const instance = boardGameInstanceManager.createInstance(
        game.package_id,
        currentAccount.address,
        getDisplayName() || `Player ${currentAccount.address.slice(0, 6)}`
      );

      if (instance) {
        // Simulate payment confirmation for local state
        boardGameInstanceManager.confirmPayment(instance.id, currentAccount.address);
        navigate(`/board-game-lobby/${instance.id}`);
      } else {
        alert("Failed to create local game instance");
      }
    } catch (error) {
      console.error("Failed to create game instance:", error);
      alert("Failed to create game instance. Please try again.");
    }
  };

  const handleJoinBoardInstance = async (instanceId: string) => {
    if (!currentAccount) {
      alert("Please connect your Sui wallet first to play games!");
      return;
    }

    try {
      // Find the waiting instance to get stake amount
      const waitingInstance = waitingInstances.data?.find(instance => instance.instance_id === instanceId);
      if (!waitingInstance) {
        alert("Game instance not found");
        return;
      }

      const stakeAmount = waitingInstance.stake_amount / 1000000000; // Convert from mist to SUI

      // Join game instance on-chain
      const result = await joinGameInstance.mutateAsync({
        instanceId,
        stakeAmount
      });

      // Navigate to appropriate game page based on template
      const template = registeredGames.data?.find(game => game.package_id === waitingInstance.template_id);
      if (template?.game_type === 0) {
        // Card game
        navigate(`/card-game/${instanceId}`);
      } else {
        // Board game - try local instance first, fallback to board play
        const joinResult = boardGameInstanceManager.joinInstance(
          instanceId,
          currentAccount.address,
          getDisplayName() || `Player ${currentAccount.address.slice(0, 6)}`
        );

        if (joinResult.success) {
          boardGameInstanceManager.confirmPayment(instanceId, currentAccount.address);
          navigate(`/board-game-lobby/${instanceId}`);
        } else {
          // Use a new board play page for registry games
          navigate(`/board-play/${instanceId}`);
        }
      }
    } catch (error) {
      console.error("Failed to join game instance:", error);
      alert("Failed to join game instance. Please try again.");
    }
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
        title: game.name,
        maxPlayers: game.piecesPerPlayer * 4 // Estimate max players from pieces per player
      });
      setMatchmakingOpen(true);
    }
  };

  const handlePlayCardGame = (templateId: string) => {
    if (!currentAccount) {
      alert("Please connect your Sui wallet first to play games!");
      return;
    }

    const template = cardGameTemplates.find(t => t.id === templateId);
    if (!template) return;

    // Create new instance
    const instance = gameInstanceManager.createInstance(templateId, currentAccount.address, 1.0); // 1 SUI entry fee
    if (instance) {
      // Join the instance
      const joinResult = gameInstanceManager.joinInstance(
        instance.id,
        currentAccount.address,
        getDisplayName() || `Player ${currentAccount.address.slice(0, 6)}`
      );

      if (joinResult.success) {
        // Simulate payment confirmation (in real app, this would be a blockchain transaction)
        gameInstanceManager.confirmPayment(instance.id, currentAccount.address);
        navigate(`/card-game/${instance.id}`);
      } else {
        alert(joinResult.error);
      }
    }
  };

  const handlePlayRegistryCardGame = async (gameId: string) => {
    if (!currentAccount) {
      alert("Please connect your Sui wallet first to play games!");
      return;
    }

    try {
      // Find the card game from registry
      const game = registeredGames.data?.find(g => g.id === gameId && g.game_type === 0);
      if (!game) {
        alert("Card game not found");
        return;
      }

      const stakeAmount = game.template?.stake_amount ?
        Number(game.template.stake_amount) / 1000000000 : 1; // Convert from mist to SUI

      // Create game instance on-chain using the package_id as template
      const result = await createGameInstance.mutateAsync({
        templateId: game.package_id,
        maxPlayers: 2, // Default for card games
        stakeAmount
      });

      // Navigate to card game lobby
      navigate(`/card-game-lobby/${game.package_id}`);
    } catch (error) {
      console.error("Failed to create card game instance:", error);
      alert("Failed to create card game instance. Please try again.");
    }
  };

  const handleJoinCardInstance = (instanceId: string) => {
    if (!currentAccount) {
      alert("Please connect your Sui wallet first to play games!");
      return;
    }

    const joinResult = gameInstanceManager.joinInstance(
      instanceId,
      currentAccount.address,
      getDisplayName() || `Player ${currentAccount.address.slice(0, 6)}`
    );

    if (joinResult.success) {
      // Simulate payment confirmation
      gameInstanceManager.confirmPayment(instanceId, currentAccount.address);
      navigate(`/card-game/${instanceId}`);
    } else {
      alert(joinResult.error);
    }
  };

  // Filter and search logic
  const getFilteredGames = () => {
    let allGames: any[] = [];

    // Add registered games from the registry (both card and board)
    if (registeredGames.data) {
      const registryGames = registeredGames.data
        .filter(game => filterType === "all" ||
          (filterType === "card" && game.game_type === 0) ||
          (filterType === "board" && game.game_type === 1))
        .map(game => ({
          id: game.id,
          package_id: game.package_id,
          type: game.game_type === 0 ? "card" : "board",
          gameType: game.game_type === 0 ? "Card Game" : "Board Game",
          name: game.template?.name || "Unknown Game",
          description: game.template?.description || "No description",
          stakeAmount: game.template?.stake_amount || 0,
          totalGames: 0, // TODO: Add game statistics
          piecesPerPlayer: game.template?.pieces_per_player || 2,
          creator: game.creator,
          created_at: game.created_at
        }));
      allGames = [...allGames, ...registryGames];
    }

    // Add card game templates (local/mock data)
    if (filterType === "all" || filterType === "card") {
      const cardGames = cardGameTemplates.map(template => ({
        ...template,
        type: "card",
        gameType: "Card Game",
        name: template.config.title,
        description: template.config.description,
        stakeAmount: template.config.launchFee * 1000000000, // Convert to mist
        totalGames: template.totalGames,
        piecesPerPlayer: template.config.numPlayers
      }));
      allGames = [...allGames, ...cardGames];
    }

    // Apply search filter
    if (searchTerm) {
      allGames = allGames.filter(game =>
        game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return allGames;
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
      {registeredGames.data && registeredGames.data.length > 0 && (
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
                {registeredGames.data[0].template?.name || "Unknown Game"}
              </Heading>
              <Text size="4" color="gray" style={{ marginBottom: "16px" }}>
                {registeredGames.data[0].template?.description || "No description"}
              </Text>
              <Flex gap="4" align="center">
                <Badge color="cyan">
                  {registeredGames.data[0].game_type === 0 ? "Card Game" : "Board Game"}
                </Badge>
                <Text size="3" color="gray">
                  0 games
                </Text>
                <Text size="3" color="gray">
                  Fee: {((registeredGames.data[0].template?.stake_amount || 0) / 1000000000).toFixed(2)} SUI
                </Text>
              </Flex>
            </Box>
            <Button
              size="4"
              disabled={!currentAccount}
              onClick={() => {
                if (registeredGames.data[0].game_type === 0) {
                  // Card game
                  handlePlayRegistryCardGame(registeredGames.data[0].id);
                } else {
                  // Board game
                  handlePlayBoardGame(registeredGames.data[0].id);
                }
              }}
              style={{
                background: currentAccount ? "var(--leviathan-sky-blue)" : "var(--gray-6)",
                color: "white",
                padding: "16px 32px",
                fontSize: "16px",
                opacity: currentAccount ? 1 : 0.6
              }}
            >
              {!currentAccount ? "Connect Wallet" : "Create Game"}
            </Button>
          </Flex>
        </Card>
      )}

      {/* Games Section */}
      <Box>
        <Flex justify="between" align="center" mb="6">
          <Heading size="6" style={{ color: "white" }}>
            Browse Games
          </Heading>
          <Flex gap="3" align="center">
            <TextField.Root
              size="2"
              placeholder="Search games..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "200px" }}
            >
              <TextField.Slot>
                <MagnifyingGlassIcon height="16" width="16" />
              </TextField.Slot>
            </TextField.Root>

            <Select.Root value={filterType} onValueChange={setFilterType}>
              <Select.Trigger />
              <Select.Content>
                <Select.Item value="all">All Games</Select.Item>
                <Select.Item value="board">Board Games</Select.Item>
                <Select.Item value="card">Card Games</Select.Item>
              </Select.Content>
            </Select.Root>
          </Flex>
        </Flex>

        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Trigger value="all">All Games</Tabs.Trigger>
            <Tabs.Trigger value="templates">Game Templates</Tabs.Trigger>
            <Tabs.Trigger value="instances">Join Game</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="all">
            {isLoading ? (
              <Text size="3" color="gray">Loading games...</Text>
            ) : (
              <Grid columns="3" gap="6">
                {getFilteredGames().map((game) => (
                  <Card
                    key={`${game.type}-${game.id}`}
                    style={{
                      ...cardStyle,
                      transition: "all 0.3s ease",
                    }}
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
                  >
                    <Box
                      style={{
                        width: "100%",
                        height: "120px",
                        background: game.type === "card"
                          ? "linear-gradient(135deg, var(--purple-9), var(--violet-9))"
                          : "linear-gradient(135deg, var(--leviathan-teal), var(--leviathan-indigo))",
                        borderRadius: "12px",
                        marginBottom: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "48px",
                      }}
                    >
                      {game.type === "card" ? <StackIcon width="48" height="48" color="white" /> : <Text size="8" style={{ fontSize: "48px", color: "white" }}>🎲</Text>}
                    </Box>

                    <Heading size="4" style={{ color: "white", marginBottom: "8px" }}>
                      {game.name}
                    </Heading>

                    <Text size="3" color="gray" style={{ marginBottom: "12px", minHeight: "40px" }}>
                      {game.description}
                    </Text>

                    <Flex justify="between" align="center" style={{ marginBottom: "12px" }}>
                      <Badge color={game.type === "card" ? "purple" : "blue"}>
                        {game.gameType}
                      </Badge>
                      <Text size="2" color="gray">
                        {game.totalGames} games
                      </Text>
                    </Flex>

                    <Flex justify="between" align="center" style={{ marginBottom: "16px" }}>
                      <Text size="2" color="gray">
                        Fee: {(game.stakeAmount / 1000000000).toFixed(2)} SUI
                      </Text>
                      <Text size="2" color="gray">
                        Max: {game.piecesPerPlayer} players
                      </Text>
                    </Flex>

                    <Button
                      size="3"
                      disabled={!currentAccount}
                      style={{
                        width: "100%",
                        background: currentAccount ? (game.type === "card" ? "var(--purple-9)" : "var(--leviathan-ocean)") : "var(--gray-6)",
                        color: "white",
                        border: "none",
                        opacity: currentAccount ? 1 : 0.6,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (game.type === "card") {
                          if (game.package_id) {
                            // This is a registry card game
                            handlePlayRegistryCardGame(game.id);
                          } else {
                            // This is a local template
                            handlePlayCardGame(game.id);
                          }
                        } else {
                          // Board game
                          handlePlayBoardGame(game.id);
                        }
                      }}
                    >
                      <PlayIcon />
                      {!currentAccount ? "Connect Wallet" : "Create Game"}
                    </Button>
                  </Card>
                ))}

                {getFilteredGames().length === 0 && (
                  <Card style={cardStyle}>
                    <Box style={{ textAlign: "center", padding: "40px" }}>
                      <Text size="6" style={{ fontSize: "48px", marginBottom: "16px" }}>
                        🎮
                      </Text>
                      <Heading size="5" style={{ color: "white", marginBottom: "12px" }}>
                        No Games Found
                      </Heading>
                      <Text size="3" color="gray">
                        Try adjusting your search or filter criteria
                      </Text>
                    </Box>
                  </Card>
                )}
              </Grid>
            )}
          </Tabs.Content>

          <Tabs.Content value="templates">
            <Grid columns="3" gap="6">
              {cardGameTemplates.map((template) => (
                <Card key={template.id} style={cardStyle}>
                  <Box
                    style={{
                      width: "100%",
                      height: "120px",
                      background: "linear-gradient(135deg, var(--purple-9), var(--violet-9))",
                      borderRadius: "12px",
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <StackIcon width="48" height="48" color="white" />
                  </Box>

                  <Heading size="4" style={{ color: "white", marginBottom: "8px" }}>
                    {template.config.title}
                  </Heading>

                  <Text size="3" color="gray" style={{ marginBottom: "12px", minHeight: "40px" }}>
                    {template.config.description}
                  </Text>

                  <Grid columns="2" gap="2" mb="3">
                    <Text size="2" color="gray">Players: {template.config.numPlayers}</Text>
                    <Text size="2" color="gray">Win: {template.config.winCondition.replace('_', ' ')}</Text>
                    <Text size="2" color="gray">Hand: {template.config.initialCardsInHand}</Text>
                    <Text size="2" color="gray">Deck: {template.config.deckComposition.suits * template.config.deckComposition.ranksPerSuit + template.config.deckComposition.jokers}</Text>
                  </Grid>

                  <Button
                    size="3"
                    disabled={!currentAccount}
                    style={{
                      width: "100%",
                      background: currentAccount ? "var(--purple-9)" : "var(--gray-6)",
                      color: "white",
                    }}
                    onClick={() => handlePlayCardGame(template.id)}
                  >
                    <PlusIcon />
                    {!currentAccount ? "Connect Wallet" : "Start New Game"}
                  </Button>
                </Card>
              ))}

              {cardGameTemplates.length === 0 && (
                <Card style={cardStyle}>
                  <Box style={{ textAlign: "center", padding: "40px" }}>
                    <StackIcon width="48" height="48" color="var(--gray-8)" style={{ marginBottom: "16px" }} />
                    <Heading size="5" style={{ color: "white", marginBottom: "12px" }}>
                      No Card Game Templates
                    </Heading>
                    <Text size="3" color="gray" mb="4">
                      Create the first card game template!
                    </Text>
                    <Button
                      size="3"
                      style={{ background: "var(--purple-9)" }}
                      onClick={() => navigate('/card-game-launchpad')}
                    >
                      <PlusIcon /> Create Template
                    </Button>
                  </Box>
                </Card>
              )}
            </Grid>
          </Tabs.Content>

          <Tabs.Content value="instances">
            <Grid columns="3" gap="6">
              {/* Card Game Instances */}
              {cardGameInstances.map((instance) => (
                <Card key={`card-${instance.id}`} style={cardStyle}>
                  <Box
                    style={{
                      width: "100%",
                      height: "120px",
                      background: "linear-gradient(135deg, var(--purple-9), var(--violet-9))",
                      borderRadius: "12px",
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative"
                    }}
                  >
                    <StackIcon width="48" height="48" color="white" />
                    <Badge
                      size="1"
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        background: "rgba(147, 51, 234, 0.9)"
                      }}
                    >
                      Card Game
                    </Badge>
                  </Box>

                  <Heading size="4" style={{ color: "white", marginBottom: "8px" }}>
                    {gameInstanceManager.getTemplate(instance.templateId)?.config.title || "Unknown Game"}
                  </Heading>

                  <Text size="3" color="gray" style={{ marginBottom: "12px", minHeight: "40px" }}>
                    Entry Fee: {instance.entryFee} SUI
                  </Text>

                  <Flex justify="between" align="center" style={{ marginBottom: "16px" }}>
                    <Text size="2" color="gray">
                      Players: {instance.currentPlayers}/{instance.maxPlayers}
                    </Text>
                    <Text size="2" style={{ color: "var(--purple-11)" }}>
                      {instance.prizePool.toFixed(2)} SUI Pool
                    </Text>
                  </Flex>

                  <Button
                    size="3"
                    disabled={!currentAccount || instance.currentPlayers >= instance.maxPlayers}
                    style={{
                      width: "100%",
                      background: currentAccount && instance.currentPlayers < instance.maxPlayers ? "var(--purple-9)" : "var(--gray-6)",
                      color: "white",
                    }}
                    onClick={() => handleJoinCardInstance(instance.id)}
                  >
                    <PlayIcon />
                    {!currentAccount ? "Connect Wallet" :
                     instance.currentPlayers >= instance.maxPlayers ? "Game Full" : "Join Game"}
                  </Button>
                </Card>
              ))}

              {/* Registry Waiting Instances */}
              {(waitingInstances.data || []).map((instance) => {
                const template = registeredGames.data?.find(game => game.template_id === instance.template_id);
                return (
                  <Card key={`registry-${instance.instance_id}`} style={cardStyle}>
                    <Box
                      style={{
                        width: "100%",
                        height: "120px",
                        background: "linear-gradient(135deg, var(--blue-9), var(--sky-9))",
                        borderRadius: "12px",
                        marginBottom: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative"
                      }}
                    >
                      <Text size="8" style={{ fontSize: "48px", color: "white" }}>🎲</Text>
                      <Badge
                        size="1"
                        style={{
                          position: "absolute",
                          top: "8px",
                          right: "8px",
                          background: "rgba(59, 130, 246, 0.9)"
                        }}
                      >
                        On-Chain Game
                      </Badge>
                    </Box>

                    <Heading size="4" style={{ color: "white", marginBottom: "8px" }}>
                      {template?.name || "Unknown Game"}
                    </Heading>

                    <Text size="3" color="gray" style={{ marginBottom: "12px", minHeight: "40px" }}>
                      Stake: {(instance.stake_amount / 1000000000).toFixed(2)} SUI
                    </Text>

                    <Flex justify="between" align="center" style={{ marginBottom: "16px" }}>
                      <Text size="2" color="gray">
                        Players: {instance.current_players}/{instance.max_players}
                      </Text>
                      <Text size="2" style={{ color: "var(--blue-11)" }}>
                        {new Date(instance.created_at).toLocaleTimeString()}
                      </Text>
                    </Flex>

                    <Button
                      size="3"
                      disabled={!currentAccount || !instance.is_joinable || instance.current_players >= instance.max_players}
                      style={{
                        width: "100%",
                        background: currentAccount && instance.is_joinable && instance.current_players < instance.max_players ? "var(--blue-9)" : "var(--gray-6)",
                        color: "white",
                      }}
                      onClick={() => handleJoinBoardInstance(instance.instance_id)}
                    >
                      <PlayIcon />
                      {!currentAccount ? "Connect Wallet" :
                       !instance.is_joinable ? "Not Joinable" :
                       instance.current_players >= instance.max_players ? "Game Full" : "Join Game"}
                    </Button>
                  </Card>
                );
              })}

              {/* Board Game Instances (Legacy) */}
              {boardGameInstances.map((instance) => (
                <Card key={`board-${instance.templateId}-${instance.id}`} style={cardStyle}>
                  <Box
                    style={{
                      width: "100%",
                      height: "120px",
                      background: "linear-gradient(135deg, var(--green-9), var(--emerald-9))",
                      borderRadius: "12px",
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative"
                    }}
                  >
                    <Text size="8" style={{ fontSize: "48px", color: "white" }}>🎲</Text>
                    <Badge
                      size="1"
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        background: "rgba(34, 197, 94, 0.9)"
                      }}
                    >
                      Board Game
                    </Badge>
                  </Box>

                  <Heading size="4" style={{ color: "white", marginBottom: "8px" }}>
                    {boardGameInstanceManager.getTemplate(instance.templateId)?.name || "Unknown Game"}
                  </Heading>

                  <Text size="3" color="gray" style={{ marginBottom: "12px", minHeight: "40px" }}>
                    Entry Fee: {instance.entryFee.toFixed(2)} SUI
                  </Text>

                  <Flex justify="between" align="center" style={{ marginBottom: "16px" }}>
                    <Text size="2" color="gray">
                      Players: {instance.currentPlayers}/{instance.maxPlayers}
                    </Text>
                    <Text size="2" style={{ color: "var(--green-11)" }}>
                      {instance.prizePool.toFixed(2)} SUI Pool
                    </Text>
                  </Flex>

                  <Button
                    size="3"
                    disabled={!currentAccount || instance.currentPlayers >= instance.maxPlayers}
                    style={{
                      width: "100%",
                      background: currentAccount && instance.currentPlayers < instance.maxPlayers ? "var(--green-9)" : "var(--gray-6)",
                      color: "white",
                    }}
                    onClick={() => handleJoinBoardInstance(instance.id)}
                  >
                    <PlayIcon />
                    {!currentAccount ? "Connect Wallet" :
                     instance.currentPlayers >= instance.maxPlayers ? "Game Full" : "Join Game"}
                  </Button>
                </Card>
              ))}

              {cardGameInstances.length === 0 && boardGameInstances.length === 0 && (
                <Card style={cardStyle}>
                  <Box style={{ textAlign: "center", padding: "40px" }}>
                    <PlayIcon width="48" height="48" color="var(--gray-8)" style={{ marginBottom: "16px" }} />
                    <Heading size="5" style={{ color: "white", marginBottom: "12px" }}>
                      No Active Games
                    </Heading>
                    <Text size="3" color="gray">
                      Start a new game from the templates tab!
                    </Text>
                  </Box>
                </Card>
              )}
            </Grid>
          </Tabs.Content>
        </Tabs.Root>
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
              2. Design your game with our {GAME_LIMITS.BOARD_SIZE}×{GAME_LIMITS.BOARD_SIZE} board system<br/>
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