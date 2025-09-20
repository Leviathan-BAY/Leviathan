import { Flex, Box, Heading, Text, Card, Button, Grid, Badge, Separator, TextField, Select, TextArea, Switch, Slider } from "@radix-ui/themes";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { PlusIcon, Pencil2Icon, PlayIcon, PersonIcon, StackIcon, GearIcon, CheckIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// Card game configuration types
interface CardGameConfig {
  title: string;
  description: string;
  numPlayers: number;
  winCondition: 'highest_card' | 'closest_sum' | 'empty_hand';
  initialCardsInHand: number;
  initialCardsOnField: number;
  handVisibility: 'public' | 'private';
  fieldVisibility: 'public' | 'private';
  deckComposition: {
    suits: number;
    ranksPerSuit: number;
    jokers: number;
  };
  cardsDrawnPerTurn: number;
  cardsPlayedPerTurn: number;
  jokerRule: 'wildcard' | 'lowest' | 'highest' | 'none';
  allowedActions: string[];
  blackjackTarget?: number;
  turnLimit: number;
  launchFee: number;
}

const defaultConfig: CardGameConfig = {
  title: '',
  description: '',
  numPlayers: 2,
  winCondition: 'highest_card',
  initialCardsInHand: 7,
  initialCardsOnField: 0,
  handVisibility: 'private',
  fieldVisibility: 'public',
  deckComposition: {
    suits: 4,
    ranksPerSuit: 13,
    jokers: 2
  },
  cardsDrawnPerTurn: 1,
  cardsPlayedPerTurn: 1,
  jokerRule: 'wildcard',
  allowedActions: ['draw', 'play'],
  turnLimit: 50,
  launchFee: 0.1
};

export function CardGameLaunchpadPage() {
  const currentAccount = useCurrentAccount();
  const navigate = useNavigate();
  const [config, setConfig] = useState<CardGameConfig>(defaultConfig);
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);

  const cardStyle = {
    background: "rgba(30, 41, 59, 0.4)",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(148, 163, 184, 0.1)",
    borderRadius: "16px",
    transition: "all 0.3s ease",
  };

  const handleConfigChange = (field: keyof CardGameConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleDeckChange = (field: keyof CardGameConfig['deckComposition'], value: number) => {
    setConfig(prev => ({
      ...prev,
      deckComposition: { ...prev.deckComposition, [field]: value }
    }));
  };

  const toggleAction = (action: string) => {
    setConfig(prev => ({
      ...prev,
      allowedActions: prev.allowedActions.includes(action)
        ? prev.allowedActions.filter(a => a !== action)
        : [...prev.allowedActions, action]
    }));
  };

  const handleCreateGame = async () => {
    if (!currentAccount) {
      alert("Please connect your wallet first");
      return;
    }

    setIsCreating(true);
    try {
      // TODO: Implement actual contract call
      console.log("Creating card game with config:", config);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Mock delay
      alert("Card game template created successfully!");
      navigate('/splash-zone');
    } catch (error) {
      console.error("Failed to create card game:", error);
      alert("Failed to create card game template");
    } finally {
      setIsCreating(false);
    }
  };

  const renderStepIndicator = () => (
    <Flex gap="2" justify="center" mb="6">
      {[1, 2, 3, 4].map(step => (
        <Box key={step} style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          background: step <= currentStep ? "var(--purple-9)" : "rgba(147, 51, 234, 0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.3s ease"
        }} onClick={() => setCurrentStep(step)}>
          {step < currentStep ? (
            <CheckIcon color="white" width="16" height="16" />
          ) : (
            <Text size="2" style={{ color: "white", fontWeight: "bold" }}>{step}</Text>
          )}
        </Box>
      ))}
    </Flex>
  );

  const renderStep1 = () => (
    <Card style={{ ...cardStyle, padding: "24px" }}>
      <Heading size="5" style={{ color: "white" }} mb="4">
        <StackIcon style={{ marginRight: "8px" }} />
        Basic Game Information
      </Heading>

      <Grid columns="1" gap="4">
        <Box>
          <Text size="2" color="gray" mb="2">Game Title</Text>
          <TextField.Root
            size="3"
            placeholder="Enter game title"
            value={config.title}
            onChange={(e) => handleConfigChange('title', e.target.value)}
          />
        </Box>

        <Box>
          <Text size="2" color="gray" mb="2">Game Description</Text>
          <TextArea
            size="3"
            placeholder="Describe your card game rules and objectives"
            value={config.description}
            onChange={(e) => handleConfigChange('description', e.target.value)}
            rows={3}
          />
        </Box>

        <Grid columns="2" gap="4">
          <Box>
            <Text size="2" color="gray" mb="2">Number of Players</Text>
            <Select.Root
              value={config.numPlayers.toString()}
              onValueChange={(value) => handleConfigChange('numPlayers', parseInt(value))}
            >
              <Select.Trigger />
              <Select.Content>
                <Select.Item value="2">2 Players</Select.Item>
                <Select.Item value="3">3 Players</Select.Item>
                <Select.Item value="4">4 Players</Select.Item>
                <Select.Item value="5">5 Players</Select.Item>
                <Select.Item value="6">6 Players</Select.Item>
              </Select.Content>
            </Select.Root>
          </Box>

          <Box>
            <Text size="2" color="gray" mb="2">Win Condition</Text>
            <Select.Root
              value={config.winCondition}
              onValueChange={(value) => handleConfigChange('winCondition', value)}
            >
              <Select.Trigger />
              <Select.Content>
                <Select.Item value="highest_card">Highest Card</Select.Item>
                <Select.Item value="closest_sum">Closest to Target Sum</Select.Item>
                <Select.Item value="empty_hand">Empty Hand First</Select.Item>
              </Select.Content>
            </Select.Root>
          </Box>
        </Grid>

        {config.winCondition === 'closest_sum' && (
          <Box>
            <Text size="2" color="gray" mb="2">Target Number (Blackjack-style)</Text>
            <TextField.Root
              size="3"
              type="number"
              placeholder="21"
              value={config.blackjackTarget?.toString() || ''}
              onChange={(e) => handleConfigChange('blackjackTarget', parseInt(e.target.value) || 21)}
            />
          </Box>
        )}
      </Grid>
    </Card>
  );

  const renderStep2 = () => (
    <Card style={{ ...cardStyle, padding: "24px" }}>
      <Heading size="5" style={{ color: "white" }} mb="4">
        <GearIcon style={{ marginRight: "8px" }} />
        Game Setup & Cards
      </Heading>

      <Grid columns="2" gap="6">
        <Box>
          <Heading size="4" style={{ color: "white" }} mb="3">Initial Setup</Heading>
          <Grid columns="1" gap="3">
            <Box>
              <Text size="2" color="gray" mb="2">Cards in Hand</Text>
              <Slider
                value={[config.initialCardsInHand]}
                onValueChange={([value]) => handleConfigChange('initialCardsInHand', value)}
                min={1}
                max={15}
                step={1}
              />
              <Text size="1" color="gray">{config.initialCardsInHand} cards</Text>
            </Box>

            <Box>
              <Text size="2" color="gray" mb="2">Cards on Field</Text>
              <Slider
                value={[config.initialCardsOnField]}
                onValueChange={([value]) => handleConfigChange('initialCardsOnField', value)}
                min={0}
                max={10}
                step={1}
              />
              <Text size="1" color="gray">{config.initialCardsOnField} cards</Text>
            </Box>

            <Grid columns="2" gap="3">
              <Box>
                <Text size="2" color="gray" mb="2">Hand Visibility</Text>
                <Select.Root
                  value={config.handVisibility}
                  onValueChange={(value) => handleConfigChange('handVisibility', value)}
                >
                  <Select.Trigger />
                  <Select.Content>
                    <Select.Item value="private">Private</Select.Item>
                    <Select.Item value="public">Public</Select.Item>
                  </Select.Content>
                </Select.Root>
              </Box>

              <Box>
                <Text size="2" color="gray" mb="2">Field Visibility</Text>
                <Select.Root
                  value={config.fieldVisibility}
                  onValueChange={(value) => handleConfigChange('fieldVisibility', value)}
                >
                  <Select.Trigger />
                  <Select.Content>
                    <Select.Item value="public">Public</Select.Item>
                    <Select.Item value="private">Private</Select.Item>
                  </Select.Content>
                </Select.Root>
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Box>
          <Heading size="4" style={{ color: "white" }} mb="3">Deck Composition</Heading>
          <Grid columns="1" gap="3">
            <Box>
              <Text size="2" color="gray" mb="2">Number of Suits</Text>
              <Slider
                value={[config.deckComposition.suits]}
                onValueChange={([value]) => handleDeckChange('suits', value)}
                min={1}
                max={6}
                step={1}
              />
              <Text size="1" color="gray">{config.deckComposition.suits} suits</Text>
            </Box>

            <Box>
              <Text size="2" color="gray" mb="2">Ranks per Suit</Text>
              <Slider
                value={[config.deckComposition.ranksPerSuit]}
                onValueChange={([value]) => handleDeckChange('ranksPerSuit', value)}
                min={5}
                max={20}
                step={1}
              />
              <Text size="1" color="gray">{config.deckComposition.ranksPerSuit} ranks</Text>
            </Box>

            <Box>
              <Text size="2" color="gray" mb="2">Jokers</Text>
              <Slider
                value={[config.deckComposition.jokers]}
                onValueChange={([value]) => handleDeckChange('jokers', value)}
                min={0}
                max={6}
                step={1}
              />
              <Text size="1" color="gray">{config.deckComposition.jokers} jokers</Text>
            </Box>

            <Box style={{
              background: "rgba(147, 51, 234, 0.1)",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid rgba(147, 51, 234, 0.3)"
            }}>
              <Text size="2" style={{ color: "var(--purple-11)" }}>
                Total Cards: {config.deckComposition.suits * config.deckComposition.ranksPerSuit + config.deckComposition.jokers}
              </Text>
            </Box>
          </Grid>
        </Box>
      </Grid>
    </Card>
  );

  const renderStep3 = () => (
    <Card style={{ ...cardStyle, padding: "24px" }}>
      <Heading size="5" style={{ color: "white" }} mb="4">
        <PlayIcon style={{ marginRight: "8px" }} />
        Gameplay Rules
      </Heading>

      <Grid columns="2" gap="6">
        <Box>
          <Heading size="4" style={{ color: "white" }} mb="3">Turn Actions</Heading>
          <Grid columns="1" gap="3">
            <Box>
              <Text size="2" color="gray" mb="2">Cards Drawn per Turn</Text>
              <Slider
                value={[config.cardsDrawnPerTurn]}
                onValueChange={([value]) => handleConfigChange('cardsDrawnPerTurn', value)}
                min={0}
                max={5}
                step={1}
              />
              <Text size="1" color="gray">{config.cardsDrawnPerTurn} cards</Text>
            </Box>

            <Box>
              <Text size="2" color="gray" mb="2">Cards Played per Turn</Text>
              <Slider
                value={[config.cardsPlayedPerTurn]}
                onValueChange={([value]) => handleConfigChange('cardsPlayedPerTurn', value)}
                min={0}
                max={5}
                step={1}
              />
              <Text size="1" color="gray">{config.cardsPlayedPerTurn} cards</Text>
            </Box>

            <Box>
              <Text size="2" color="gray" mb="2">Turn Limit</Text>
              <Slider
                value={[config.turnLimit]}
                onValueChange={([value]) => handleConfigChange('turnLimit', value)}
                min={10}
                max={100}
                step={5}
              />
              <Text size="1" color="gray">{config.turnLimit} turns max</Text>
            </Box>
          </Grid>
        </Box>

        <Box>
          <Heading size="4" style={{ color: "white" }} mb="3">Special Rules</Heading>
          <Grid columns="1" gap="3">
            <Box>
              <Text size="2" color="gray" mb="2">Joker Rule</Text>
              <Select.Root
                value={config.jokerRule}
                onValueChange={(value) => handleConfigChange('jokerRule', value)}
              >
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value="wildcard">Wildcard (any value)</Select.Item>
                  <Select.Item value="lowest">Always lowest value</Select.Item>
                  <Select.Item value="highest">Always highest value</Select.Item>
                  <Select.Item value="none">No jokers</Select.Item>
                </Select.Content>
              </Select.Root>
            </Box>

            <Box>
              <Text size="2" color="gray" mb="3">Allowed Actions</Text>
              <Grid columns="2" gap="2">
                {['draw', 'play', 'pass', 'fold', 'discard', 'swap'].map(action => (
                  <Flex key={action} align="center" gap="2" style={{
                    padding: "8px",
                    background: config.allowedActions.includes(action) ? "rgba(147, 51, 234, 0.2)" : "rgba(148, 163, 184, 0.1)",
                    borderRadius: "6px",
                    cursor: "pointer",
                    border: `1px solid ${config.allowedActions.includes(action) ? "rgba(147, 51, 234, 0.5)" : "rgba(148, 163, 184, 0.3)"}`
                  }} onClick={() => toggleAction(action)}>
                    <Switch
                      checked={config.allowedActions.includes(action)}
                      onCheckedChange={() => toggleAction(action)}
                      size="1"
                    />
                    <Text size="2" style={{ textTransform: "capitalize" }}>{action}</Text>
                  </Flex>
                ))}
              </Grid>
            </Box>
          </Grid>
        </Box>
      </Grid>
    </Card>
  );

  const renderStep4 = () => (
    <Card style={{ ...cardStyle, padding: "24px" }}>
      <Heading size="5" style={{ color: "white" }} mb="4">
        ⭐
        Launch Configuration
      </Heading>

      <Grid columns="2" gap="6">
        <Box>
          <Heading size="4" style={{ color: "white" }} mb="3">Game Summary</Heading>
          <Box style={{
            background: "rgba(148, 163, 184, 0.1)",
            padding: "16px",
            borderRadius: "8px",
            border: "1px solid rgba(148, 163, 184, 0.3)"
          }}>
            <Text size="3" style={{ color: "white" }} weight="bold" mb="2">{config.title || "Untitled Game"}</Text>
            <Text size="2" color="gray" mb="3">{config.description || "No description provided"}</Text>

            <Grid columns="2" gap="2">
              <Text size="2" color="gray">Players: {config.numPlayers}</Text>
              <Text size="2" color="gray">Win: {config.winCondition.replace('_', ' ')}</Text>
              <Text size="2" color="gray">Hand: {config.initialCardsInHand} cards</Text>
              <Text size="2" color="gray">Deck: {config.deckComposition.suits * config.deckComposition.ranksPerSuit + config.deckComposition.jokers} cards</Text>
              <Text size="2" color="gray">Draw: {config.cardsDrawnPerTurn}/turn</Text>
              <Text size="2" color="gray">Play: {config.cardsPlayedPerTurn}/turn</Text>
            </Grid>
          </Box>
        </Box>

        <Box>
          <Heading size="4" style={{ color: "white" }} mb="3">Launch Settings</Heading>
          <Grid columns="1" gap="4">
            <Box>
              <Text size="2" color="gray" mb="2">Launch Fee (hSUI)</Text>
              <TextField.Root
                size="3"
                type="number"
                step="0.1"
                min="0.1"
                value={config.launchFee}
                onChange={(e) => handleConfigChange('launchFee', parseFloat(e.target.value))}
              />
              <Text size="1" color="gray">Fee to prevent spam and ensure quality</Text>
            </Box>

            <Box style={{
              background: "rgba(14, 165, 233, 0.1)",
              padding: "16px",
              borderRadius: "8px",
              border: "1px solid rgba(14, 165, 233, 0.3)"
            }}>
              <Heading size="3" style={{ color: "var(--sky-11)" }} mb="2">Ready to Launch!</Heading>
              <Text size="2" color="gray" mb="4">
                Your card game template will be deployed to the blockchain and available for players to join.
              </Text>

              <Button
                size="3"
                style={{
                  background: "linear-gradient(135deg, var(--purple-9), var(--violet-9))",
                  width: "100%"
                }}
                onClick={handleCreateGame}
                disabled={!currentAccount || isCreating || !config.title}
              >
                {isCreating ? "Creating..." : !currentAccount ? "Connect Wallet" : "Deploy Game Template"}
              </Button>
            </Box>
          </Grid>
        </Box>
      </Grid>
    </Card>
  );

  return (
    <Flex direction="column" gap="6">
      {/* Header */}
      <Flex align="center" gap="4" style={{ textAlign: "center" }} justify="center">
        <StackIcon width="64" height="64" color="var(--purple-9)" />
        <Box>
          <Heading size="8" style={{ color: "white" }}>Card Game Creator</Heading>
          <Text size="4" color="gray">
            Design custom card games with advanced rule configurations
          </Text>
        </Box>
      </Flex>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Step Content */}
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
      {currentStep === 4 && renderStep4()}

      {/* Navigation */}
      <Flex justify="between" gap="4">
        <Button
          size="3"
          variant="outline"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
        >
          Previous
        </Button>

        <Flex gap="2">
          <Button
            size="3"
            variant="outline"
            onClick={() => navigate('/humpback-launchpad')}
          >
            Cancel
          </Button>

          {currentStep < 4 ? (
            <Button
              size="3"
              style={{ background: "linear-gradient(135deg, var(--purple-9), var(--violet-9))" }}
              onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
            >
              Next
            </Button>
          ) : (
            <Button
              size="3"
              style={{ background: "linear-gradient(135deg, var(--green-9), var(--emerald-9))" }}
              onClick={() => navigate('/splash-zone')}
            >
              View in Splash Zone
            </Button>
          )}
        </Flex>
      </Flex>
    </Flex>
  );
}