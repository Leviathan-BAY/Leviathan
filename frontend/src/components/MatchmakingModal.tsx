import { Flex, Box, Text, Button, Card, Avatar, Spinner, Dialog, Badge } from "@radix-ui/themes";
import { Cross2Icon, PlayIcon, PersonIcon } from "@radix-ui/react-icons";
import { useMatchmaking } from "../hooks/useMatchmaking";
import { useEffect, useState } from "react";

interface MatchmakingModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  gameTitle: string;
  maxPlayers?: number;
}

export function MatchmakingModal({
  isOpen,
  onClose,
  gameId,
  gameTitle,
  maxPlayers = 2
}: MatchmakingModalProps) {
  const {
    currentMatch,
    isSearching,
    error,
    findMatch,
    cancelMatch,
    leaveMatch,
    canSearch
  } = useMatchmaking();

  const [countdown, setCountdown] = useState<number | null>(null);

  // Start match countdown when match is ready
  useEffect(() => {
    if (currentMatch?.status === 'ready' && !countdown) {
      setCountdown(3);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev && prev > 1) {
            return prev - 1;
          } else {
            clearInterval(timer);
            return null;
          }
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentMatch?.status, countdown]);

  const handleFindMatch = async () => {
    if (!canSearch) return;
    try {
      await findMatch(gameId, maxPlayers);
    } catch (error) {
      console.error('Matchmaking error:', error);
    }
  };

  const handleCancel = () => {
    if (currentMatch) {
      leaveMatch();
    } else if (isSearching) {
      cancelMatch();
    }
    onClose();
  };

  const getStatusMessage = () => {
    if (error) return error;
    if (countdown) return `Starting in ${countdown}...`;
    if (currentMatch?.status === 'playing') return 'Game started!';
    if (currentMatch?.status === 'ready') return 'Match found! Get ready...';
    if (isSearching) return 'Looking for players...';
    return 'Ready to find a match?';
  };

  const getStatusColor = () => {
    if (error) return 'red';
    if (currentMatch?.status === 'ready' || countdown) return 'green';
    if (currentMatch?.status === 'playing') return 'blue';
    return 'gray';
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Content style={{ maxWidth: '450px' }}>
        <Dialog.Title asChild>
          <Flex justify="between" align="center" mb="4">
            <Text size="5" weight="bold">
              {gameTitle} - Matchmaking
            </Text>
            <Dialog.Close asChild>
              <Button variant="ghost" size="1">
                <Cross2Icon />
              </Button>
            </Dialog.Close>
          </Flex>
        </Dialog.Title>

        <Flex direction="column" gap="4">
          {/* Status Display */}
          <Card style={{
            background: `rgba(var(--${getStatusColor()}-3-rgb), 0.1)`,
            border: `1px solid rgba(var(--${getStatusColor()}-6-rgb), 0.3)`,
            padding: "16px",
            textAlign: "center"
          }}>
            {(isSearching || countdown) && (
              <Spinner size="2" style={{ marginBottom: "8px" }} />
            )}
            <Text size="3" style={{ color: "white" }}>
              {getStatusMessage()}
            </Text>
          </Card>

          {/* Players Display */}
          {currentMatch && (
            <Card style={{ padding: "16px" }}>
              <Text size="3" weight="medium" style={{ color: "white", marginBottom: "12px" }}>
                Players ({currentMatch.players.length}/{currentMatch.maxPlayers})
              </Text>
              <Flex direction="column" gap="3">
                {currentMatch.players.map((player, index) => (
                  <Flex key={player.discordId} align="center" gap="3">
                    <Avatar
                      src={player.avatarUrl || undefined}
                      fallback={player.displayName.charAt(0)}
                      size="2"
                    />
                    <Box>
                      <Text size="2" style={{ color: "white" }}>
                        {player.displayName}
                      </Text>
                      <Text size="1" color="gray">
                        {player.walletAddress.slice(0, 6)}...{player.walletAddress.slice(-4)}
                      </Text>
                    </Box>
                    {player.isReady && (
                      <Badge size="1" color="green" style={{ marginLeft: "auto" }}>
                        Ready
                      </Badge>
                    )}
                  </Flex>
                ))}

                {/* Empty slots */}
                {Array.from({ length: currentMatch.maxPlayers - currentMatch.players.length }).map((_, index) => (
                  <Flex key={`empty-${index}`} align="center" gap="3" style={{ opacity: 0.5 }}>
                    <Avatar fallback={<PersonIcon />} size="2" />
                    <Text size="2" color="gray">
                      Waiting for player...
                    </Text>
                  </Flex>
                ))}
              </Flex>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Card style={{
              background: "rgba(var(--red-3-rgb), 0.1)",
              border: "1px solid rgba(var(--red-6-rgb), 0.3)",
              padding: "12px"
            }}>
              <Text size="2" color="red">
                {error}
              </Text>
            </Card>
          )}

          {/* Action Buttons */}
          <Flex gap="3" justify="center">
            {!currentMatch && !isSearching && (
              <Button
                size="3"
                disabled={!canSearch}
                onClick={handleFindMatch}
                style={{
                  background: canSearch ? "linear-gradient(135deg, var(--sky-9), var(--blue-9))" : "var(--gray-6)"
                }}
              >
                <PlayIcon />
                Find Match
              </Button>
            )}

            {(isSearching || currentMatch) && currentMatch?.status !== 'playing' && (
              <Button
                size="3"
                variant="outline"
                color="red"
                onClick={handleCancel}
              >
                {isSearching ? "Cancel Search" : "Leave Match"}
              </Button>
            )}

            {currentMatch?.status === 'playing' && (
              <Button
                size="3"
                style={{ background: "linear-gradient(135deg, var(--green-9), var(--emerald-9))" }}
                onClick={() => {
                  alert(`🎮 Game Started!\n\nPlayers: ${currentMatch.players.map(p => p.displayName).join(', ')}\n\n⚠️ Game engine integration coming soon!`);
                  onClose();
                }}
              >
                <PlayIcon />
                Start Game
              </Button>
            )}

            {!canSearch && (
              <Text size="2" color="gray" style={{ textAlign: "center" }}>
                Connect both Discord and wallet to find matches
              </Text>
            )}
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}