import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { Flex, Text, Separator } from "@radix-ui/themes";
import { DiscordAuth } from "./components/DiscordAuth";

export function WalletStatus() {
  const account = useCurrentAccount();

  return (
    <Flex align="center" gap="3">
      {/* Discord Authentication */}
      <DiscordAuth size="2" variant="outline" />

      <Separator orientation="vertical" size="2" style={{ height: "24px" }} />

      {/* Wallet Connection */}
      {account ? (
        <Text size="2" style={{ color: "rgba(255,255,255,0.8)" }}>
          {`${account.address.slice(0, 6)}...${account.address.slice(-4)}`}
        </Text>
      ) : null}
      <ConnectButton />
    </Flex>
  );
}
