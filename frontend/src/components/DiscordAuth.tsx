import { Flex, Box, Text, Button, Avatar, Card, Badge, Separator } from "@radix-ui/themes";
import { PersonIcon, ExitIcon } from "@radix-ui/react-icons";
import { useDiscord } from "../hooks/useDiscord";

interface DiscordAuthProps {
  showFullProfile?: boolean;
  size?: "1" | "2" | "3" | "4";
  variant?: "solid" | "outline" | "ghost";
}

export function DiscordAuth({ showFullProfile = false, size = "2", variant = "outline" }: DiscordAuthProps) {
  const {
    isAuthenticated,
    isLoading,
    error,
    user,
    login,
    logout,
    getAvatarUrl,
    getDisplayName,
    getDiscordTag
  } = useDiscord();

  if (isLoading) {
    return (
      <Button size={size} variant={variant} disabled>
        Connecting...
      </Button>
    );
  }

  if (error) {
    return (
      <Button size={size} variant="outline" color="red" onClick={login}>
        Retry Discord Login
      </Button>
    );
  }

  if (!isAuthenticated) {
    return (
      <Button
        size={size}
        variant={variant}
        onClick={login}
        style={{
          background: variant === "solid" ? "#5865F2" : "transparent",
          color: variant === "solid" ? "white" : "#5865F2",
          border: variant !== "ghost" ? "1px solid #5865F2" : "none"
        }}
      >
        <PersonIcon />
        Connect Discord
      </Button>
    );
  }

  if (showFullProfile) {
    return (
      <Card style={{
        background: "rgba(88, 101, 242, 0.1)",
        border: "1px solid rgba(88, 101, 242, 0.3)",
        padding: "12px"
      }}>
        <Flex align="center" gap="3">
          <Avatar
            src={getAvatarUrl(64) || undefined}
            fallback={getDisplayName()?.charAt(0) || "?"}
            size="3"
          />
          <Box>
            <Flex align="center" gap="2" mb="1">
              <Text size="3" weight="bold" style={{ color: "white" }}>
                {getDisplayName()}
              </Text>
              <Badge size="1" color="violet">Discord</Badge>
            </Flex>
            <Text size="2" color="gray">
              {getDiscordTag()}
            </Text>
          </Box>
          <Button
            size="1"
            variant="ghost"
            color="red"
            onClick={logout}
            style={{ marginLeft: "auto" }}
          >
            <ExitIcon />
          </Button>
        </Flex>
      </Card>
    );
  }

  // Compact profile display
  return (
    <Flex align="center" gap="2">
      <Avatar
        src={getAvatarUrl(32) || undefined}
        fallback={getDisplayName()?.charAt(0) || "?"}
        size="2"
      />
      <Box>
        <Text size="2" weight="medium" style={{ color: "white" }}>
          {getDisplayName()}
        </Text>
      </Box>
      <Button
        size="1"
        variant="ghost"
        color="gray"
        onClick={logout}
      >
        <ExitIcon />
      </Button>
    </Flex>
  );
}