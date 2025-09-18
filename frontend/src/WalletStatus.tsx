import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { Flex, Text } from "@radix-ui/themes";

export function WalletStatus() {
  const account = useCurrentAccount();

  return (
    <Flex align="center" gap="3">
      {account ? (
        <Text size="2" style={{ color: "rgba(255,255,255,0.8)" }}>
          {`${account.address.slice(0, 6)}...${account.address.slice(-4)}`}
        </Text>
      ) : null}
      <ConnectButton />
    </Flex>
  );
}
