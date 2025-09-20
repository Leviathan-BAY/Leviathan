import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { Flex, Text, Separator } from "@radix-ui/themes";
import { DiscordAuth } from "./components/DiscordAuth";
import { useHSui } from "./hooks/useHSui";

export function WalletStatus() {
  const account = useCurrentAccount();
  const { hsuiBalance, suiBalance, isLoading } = useHSui();

  return (
    <Flex align="center" gap="3">
      {/* Discord Authentication */}
      <DiscordAuth size="2" variant="outline" />

      <Separator orientation="vertical" size="2" style={{ height: "24px" }} />

      {/* Balance Display */}
      {account && (
        <Flex align="center" gap="2">
          <Flex direction="column" align="end" gap="0">
            <Text size="1" style={{ color: "rgba(255,255,255,0.9)", fontWeight: "500" }}>
              {isLoading ? "..." : `${hsuiBalance.toFixed(3)} hSUI`}
            </Text>
            <Text size="1" style={{ color: "rgba(255,255,255,0.6)" }}>
              {isLoading ? "..." : `${suiBalance.toFixed(3)} SUI`}
            </Text>
          </Flex>
          <Separator orientation="vertical" size="1" style={{ height: "20px" }} />
        </Flex>
      )}
      <ConnectButton />
    </Flex>
  );
}
