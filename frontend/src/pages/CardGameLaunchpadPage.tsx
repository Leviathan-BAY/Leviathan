import React, { useState, useCallback, useEffect } from 'react';
import { Box, Flex, Card, Text, Button, TextField, Select, Separator, Badge, Grid, Heading, TextArea } from '@radix-ui/themes';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { CardGameEngine, GameRules } from '../engine/CardGameEngine';

interface CardGameTemplate {
  id: string;
  name: string;
  description: string;
  gameType: 'poker' | 'blackjack' | 'uno' | 'custom';
  rules: GameRules;
  minPlayers: number;
  maxPlayers: number;
  stakeAmount: number;
  gameDurationLimit: number;
  totalGamesPlayed: number;
  isActive: boolean;
  creator: string;
  createdAt: number;
}

interface GameInstance {
  id: string;
  templateId: string;
  players: string[];
  state: 'waiting' | 'playing' | 'finished';
  totalStake: number;
  seed: number;
  createdAt: number;
}

// Mock data for development
const MOCK_CARD_TEMPLATES: CardGameTemplate[] = [
  {
    id: "template_1",
    name: "Classic Poker",
    description: "Traditional 5-card poker with betting rounds",
    gameType: "poker",
    rules: CardGameEngine.createSimplePokerRules(),
    minPlayers: 2,
    maxPlayers: 4,
    stakeAmount: 0.5,
    gameDurationLimit: 1800000, // 30 minutes
    totalGamesPlayed: 23,
    isActive: true,
    creator: "0x123abc...",
    createdAt: Date.now() - 86400000
  },
  {
    id: "template_2",
    name: "Speed Blackjack",
    description: "Fast-paced blackjack with quick rounds",
    gameType: "blackjack",
    rules: CardGameEngine.createBlackjackRules(),
    minPlayers: 2,
    maxPlayers: 6,
    stakeAmount: 0.2,
    gameDurationLimit: 900000, // 15 minutes
    totalGamesPlayed: 45,
    isActive: true,
    creator: "0x456def...",
    createdAt: Date.now() - 172800000
  },
  {
    id: "template_3",
    name: "Lightning UNO",
    description: "Classic UNO with special power cards",
    gameType: "uno",
    rules: CardGameEngine.createUnoRules(),
    minPlayers: 3,
    maxPlayers: 8,
    stakeAmount: 0.1,
    gameDurationLimit: 1200000, // 20 minutes
    totalGamesPlayed: 67,
    isActive: true,
    creator: "0x789ghi...",
    createdAt: Date.now() - 259200000
  }
];

const MOCK_GAME_INSTANCES: GameInstance[] = [
  {
    id: "instance_1",
    templateId: "template_1",
    players: ["0x123abc...", "0x456def..."],
    state: "waiting",
    totalStake: 1.0,
    seed: 12345,
    createdAt: Date.now() - 300000
  },
  {
    id: "instance_2",
    templateId: "template_2",
    players: ["0x789ghi..."],
    state: "waiting",
    totalStake: 0.2,
    seed: 67890,
    createdAt: Date.now() - 600000
  }
];

const CardGameLaunchpadPage: React.FC = () => {
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const [activeTab, setActiveTab] = useState<'browse' | 'create' | 'instances'>('browse');
  const [templates, setTemplates] = useState<CardGameTemplate[]>(MOCK_CARD_TEMPLATES);
  const [instances, setInstances] = useState<GameInstance[]>(MOCK_GAME_INSTANCES);
  const [isDeploying, setIsDeploying] = useState(false);

  // Template creation form state
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    gameType: 'poker' as const,
    minPlayers: 2,
    maxPlayers: 4,
    stakeAmount: 0.1,
    gameDurationLimit: 30,
    customRules: ''
  });

  const isConnected = !!account;

  const createTemplate = useCallback(async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!newTemplate.name.trim()) {
      alert('Please enter a template name');
      return;
    }

    setIsDeploying(true);

    try {
      // Create rules based on game type
      let rules: GameRules;
      switch (newTemplate.gameType) {
        case 'poker':
          rules = CardGameEngine.createSimplePokerRules();
          break;
        case 'blackjack':
          rules = CardGameEngine.createBlackjackRules();
          break;
        case 'uno':
          rules = CardGameEngine.createUnoRules();
          break;
        default:
          rules = CardGameEngine.createSimplePokerRules();
      }

      // Update rules with form values
      rules.minPlayers = newTemplate.minPlayers;
      rules.maxPlayers = newTemplate.maxPlayers;

      // Parse custom rules if provided
      if (newTemplate.customRules.trim()) {
        try {
          const customRulesData = JSON.parse(newTemplate.customRules);
          rules = { ...rules, ...customRulesData };
        } catch (e) {
          console.warn('Invalid custom rules JSON, using defaults');
        }
      }

      // Create transaction for template creation
      const rulesJson = JSON.stringify(rules);
      const winConditionsJson = JSON.stringify(rules.winConditions);

      console.log('Creating card game template with rules:', rules);

      // TODO: Implement actual contract call
      // const tx = CardGameTransactions.createCardGameTemplate(
      //   newTemplate.name,
      //   newTemplate.description,
      //   getGameTypeCode(newTemplate.gameType),
      //   Array.from(new TextEncoder().encode(rulesJson)),
      //   newTemplate.minPlayers,
      //   newTemplate.maxPlayers,
      //   TransactionUtils.suiToMist(newTemplate.stakeAmount),
      //   newTemplate.gameDurationLimit * 60 * 1000,
      //   Array.from(new TextEncoder().encode(winConditionsJson))
      // );

      // For now, add to mock data
      const mockTemplate: CardGameTemplate = {
        id: `template_${Date.now()}`,
        name: newTemplate.name,
        description: newTemplate.description,
        gameType: newTemplate.gameType,
        rules,
        minPlayers: newTemplate.minPlayers,
        maxPlayers: newTemplate.maxPlayers,
        stakeAmount: newTemplate.stakeAmount,
        gameDurationLimit: newTemplate.gameDurationLimit * 60 * 1000,
        totalGamesPlayed: 0,
        isActive: true,
        creator: account?.address || '',
        createdAt: Date.now()
      };

      setTemplates(prev => [mockTemplate, ...prev]);

      // Reset form
      setNewTemplate({
        name: '',
        description: '',
        gameType: 'poker',
        minPlayers: 2,
        maxPlayers: 4,
        stakeAmount: 0.1,
        gameDurationLimit: 30,
        customRules: ''
      });

      setActiveTab('browse');
      alert('Card game template created successfully!');

    } catch (error) {
      console.error('Error creating template:', error);
      alert('Failed to create template. Please try again.');
    } finally {
      setIsDeploying(false);
    }
  }, [isConnected, account, newTemplate]);

  const createGameInstance = useCallback(async (template: CardGameTemplate) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      console.log('Creating game instance for template:', template.name);

      // TODO: Implement actual contract call
      // const tx = CardGameTransactions.createGameInstance(
      //   template.id,
      //   TransactionUtils.suiToMist(template.stakeAmount)
      // );

      // For now, add to mock data
      const mockInstance: GameInstance = {
        id: `instance_${Date.now()}`,
        templateId: template.id,
        players: [account?.address || ''],
        state: 'waiting',
        totalStake: template.stakeAmount,
        seed: Math.floor(Math.random() * 1000000),
        createdAt: Date.now()
      };

      setInstances(prev => [mockInstance, ...prev]);
      setActiveTab('instances');
      alert('Game room created! Waiting for other players to join.');

    } catch (error) {
      console.error('Error creating game instance:', error);
      alert('Failed to create game. Please try again.');
    }
  }, [isConnected, account]);

  const joinGameInstance = useCallback(async (instance: GameInstance) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    const template = templates.find(t => t.id === instance.templateId);
    if (!template) {
      alert('Template not found');
      return;
    }

    try {
      console.log('Joining game instance:', instance.id);

      // TODO: Implement actual contract call
      // const tx = CardGameTransactions.joinGameInstance(
      //   instance.id,
      //   template.id,
      //   TransactionUtils.suiToMist(template.stakeAmount)
      // );

      // For now, update mock data
      setInstances(prev => prev.map(inst =>
        inst.id === instance.id
          ? {
              ...inst,
              players: [...inst.players, account?.address || ''],
              totalStake: inst.totalStake + template.stakeAmount
            }
          : inst
      ));

      alert('Successfully joined the game!');

    } catch (error) {
      console.error('Error joining game:', error);
      alert('Failed to join game. Please try again.');
    }
  }, [isConnected, account, templates]);

  const getGameTypeCode = (gameType: string): number => {
    switch (gameType) {
      case 'poker': return 0;
      case 'blackjack': return 1;
      case 'uno': return 2;
      default: return 3;
    }
  };

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    return `${minutes} min`;
  };

  const formatTimeAgo = (timestamp: number): string => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor(diff / 60000);

    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  return (
    <Box p="6" style={{ minHeight: '100vh' }}>
      <Flex direction="column" gap="6" align="center">

        {/* Header */}
        <Flex direction="column" align="center" gap="3">
          <img
            src="/images/Humpbacklogo.png"
            alt="Humpback Card Games"
            style={{ height: '80px', objectFit: 'contain' }}
          />
          <Heading size="8" align="center" style={{
            background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Card Game Launchpad
          </Heading>
          <Text size="4" align="center" color="gray">
            Create and play custom card games with blockchain-verified results
          </Text>
        </Flex>

        {/* Navigation Tabs */}
        <Flex gap="3">
          <Button
            variant={activeTab === 'browse' ? 'solid' : 'soft'}
            onClick={() => setActiveTab('browse')}
            size="3"
          >
            Browse Games
          </Button>
          <Button
            variant={activeTab === 'create' ? 'solid' : 'soft'}
            onClick={() => setActiveTab('create')}
            size="3"
          >
            Create Template
          </Button>
          <Button
            variant={activeTab === 'instances' ? 'solid' : 'soft'}
            onClick={() => setActiveTab('instances')}
            size="3"
          >
            Game Rooms
          </Button>
        </Flex>

        {/* Browse Games Tab */}
        {activeTab === 'browse' && (
          <Box style={{ width: '100%', maxWidth: '1200px' }}>
            <Heading size="6" mb="4">Available Card Game Templates</Heading>

            <Grid columns={{ initial: '1', sm: '2', lg: '3' }} gap="4">
              {templates.map((template) => (
                <Card key={template.id} size="3" style={{
                  background: 'rgba(30, 41, 59, 0.4)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                }}>
                  <Flex direction="column" gap="3">
                    <Flex justify="between" align="start">
                      <Box>
                        <Text size="5" weight="bold">{template.name}</Text>
                        <Flex gap="2" mt="1">
                          <Badge variant="soft" color="blue">
                            {template.gameType}
                          </Badge>
                          <Badge variant="soft" color="green">
                            {template.totalGamesPlayed} games
                          </Badge>
                        </Flex>
                      </Box>
                    </Flex>

                    <Text size="3" color="gray">
                      {template.description}
                    </Text>

                    <Flex direction="column" gap="2">
                      <Flex justify="between">
                        <Text size="2" color="gray">Players</Text>
                        <Text size="2">{template.minPlayers}-{template.maxPlayers}</Text>
                      </Flex>
                      <Flex justify="between">
                        <Text size="2" color="gray">Stake</Text>
                        <Text size="2">{template.stakeAmount} SUI</Text>
                      </Flex>
                      <Flex justify="between">
                        <Text size="2" color="gray">Duration</Text>
                        <Text size="2">{formatDuration(template.gameDurationLimit)}</Text>
                      </Flex>
                      <Flex justify="between">
                        <Text size="2" color="gray">Created</Text>
                        <Text size="2">{formatTimeAgo(template.createdAt)}</Text>
                      </Flex>
                    </Flex>

                    <Button
                      onClick={() => createGameInstance(template)}
                      disabled={!isConnected}
                      style={{
                        background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)',
                        border: 'none'
                      }}
                    >
                      {isConnected ? 'Create Game Room' : 'Connect Wallet'}
                    </Button>
                  </Flex>
                </Card>
              ))}
            </Grid>
          </Box>
        )}

        {/* Create Template Tab */}
        {activeTab === 'create' && (
          <Box style={{ width: '100%', maxWidth: '600px' }}>
            <Heading size="6" mb="4">Create Card Game Template</Heading>

            <Card size="4" style={{
              background: 'rgba(30, 41, 59, 0.4)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
            }}>
              <Flex direction="column" gap="4">

                <Box>
                  <Text size="3" weight="bold" mb="2">Template Name</Text>
                  <TextField.Root
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter template name"
                    size="3"
                  />
                </Box>

                <Box>
                  <Text size="3" weight="bold" mb="2">Description</Text>
                  <TextArea
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your card game..."
                    rows={3}
                  />
                </Box>

                <Box>
                  <Text size="3" weight="bold" mb="2">Game Type</Text>
                  <Select.Root
                    value={newTemplate.gameType}
                    onValueChange={(value: any) => setNewTemplate(prev => ({ ...prev, gameType: value }))}
                  >
                    <Select.Trigger />
                    <Select.Content>
                      <Select.Item value="poker">Poker</Select.Item>
                      <Select.Item value="blackjack">Blackjack</Select.Item>
                      <Select.Item value="uno">UNO</Select.Item>
                      <Select.Item value="custom">Custom</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Box>

                <Flex gap="4">
                  <Box style={{ flex: 1 }}>
                    <Text size="3" weight="bold" mb="2">Min Players</Text>
                    <TextField.Root
                      type="number"
                      value={newTemplate.minPlayers.toString()}
                      onChange={(e) => setNewTemplate(prev => ({
                        ...prev,
                        minPlayers: Math.max(2, parseInt(e.target.value) || 2)
                      }))}
                      min="2"
                      max="8"
                    />
                  </Box>
                  <Box style={{ flex: 1 }}>
                    <Text size="3" weight="bold" mb="2">Max Players</Text>
                    <TextField.Root
                      type="number"
                      value={newTemplate.maxPlayers.toString()}
                      onChange={(e) => setNewTemplate(prev => ({
                        ...prev,
                        maxPlayers: Math.min(8, parseInt(e.target.value) || 4)
                      }))}
                      min="2"
                      max="8"
                    />
                  </Box>
                </Flex>

                <Flex gap="4">
                  <Box style={{ flex: 1 }}>
                    <Text size="3" weight="bold" mb="2">Stake Amount (SUI)</Text>
                    <TextField.Root
                      type="number"
                      step="0.1"
                      value={newTemplate.stakeAmount.toString()}
                      onChange={(e) => setNewTemplate(prev => ({
                        ...prev,
                        stakeAmount: Math.max(0.1, parseFloat(e.target.value) || 0.1)
                      }))}
                      min="0.1"
                    />
                  </Box>
                  <Box style={{ flex: 1 }}>
                    <Text size="3" weight="bold" mb="2">Duration (minutes)</Text>
                    <TextField.Root
                      type="number"
                      value={newTemplate.gameDurationLimit.toString()}
                      onChange={(e) => setNewTemplate(prev => ({
                        ...prev,
                        gameDurationLimit: Math.max(5, parseInt(e.target.value) || 30)
                      }))}
                      min="5"
                    />
                  </Box>
                </Flex>

                <Box>
                  <Text size="3" weight="bold" mb="2">Custom Rules (Optional JSON)</Text>
                  <TextArea
                    value={newTemplate.customRules}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, customRules: e.target.value }))}
                    placeholder='{"winConditions": [{"type": "score", "target": 100, "comparison": "greater"}]}'
                    rows={4}
                  />
                  <Text size="2" color="gray" mt="1">
                    Advanced: Override default rules with custom JSON configuration
                  </Text>
                </Box>

                <Separator />

                <Button
                  onClick={createTemplate}
                  disabled={!isConnected || isDeploying}
                  size="3"
                  style={{
                    background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)',
                    border: 'none'
                  }}
                >
                  {isDeploying ? 'Creating...' : isConnected ? 'Create Template' : 'Connect Wallet'}
                </Button>
              </Flex>
            </Card>
          </Box>
        )}

        {/* Game Instances Tab */}
        {activeTab === 'instances' && (
          <Box style={{ width: '100%', maxWidth: '1200px' }}>
            <Heading size="6" mb="4">Active Game Rooms</Heading>

            {instances.length === 0 ? (
              <Card size="3" style={{
                background: 'rgba(30, 41, 59, 0.4)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                textAlign: 'center'
              }}>
                <Text size="4" color="gray">
                  No active game rooms. Create one from the Browse Games tab!
                </Text>
              </Card>
            ) : (
              <Grid columns={{ initial: '1', md: '2' }} gap="4">
                {instances.map((instance) => {
                  const template = templates.find(t => t.id === instance.templateId);
                  const isPlayerInGame = instance.players.includes(account?.address || '');
                  const canJoin = !isPlayerInGame &&
                                instance.state === 'waiting' &&
                                instance.players.length < (template?.maxPlayers || 4);

                  return (
                    <Card key={instance.id} size="3" style={{
                      background: 'rgba(30, 41, 59, 0.4)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid rgba(56, 189, 248, 0.2)',
                    }}>
                      <Flex direction="column" gap="3">
                        <Flex justify="between" align="start">
                          <Box>
                            <Text size="4" weight="bold">{template?.name || 'Unknown Game'}</Text>
                            <Flex gap="2" mt="1">
                              <Badge
                                variant="soft"
                                color={instance.state === 'waiting' ? 'yellow' :
                                       instance.state === 'playing' ? 'green' : 'gray'}
                              >
                                {instance.state}
                              </Badge>
                              <Badge variant="soft" color="blue">
                                {instance.players.length}/{template?.maxPlayers} players
                              </Badge>
                            </Flex>
                          </Box>
                        </Flex>

                        <Flex direction="column" gap="2">
                          <Flex justify="between">
                            <Text size="2" color="gray">Total Stake</Text>
                            <Text size="2">{instance.totalStake} SUI</Text>
                          </Flex>
                          <Flex justify="between">
                            <Text size="2" color="gray">Game Seed</Text>
                            <Text size="2">#{instance.seed}</Text>
                          </Flex>
                          <Flex justify="between">
                            <Text size="2" color="gray">Created</Text>
                            <Text size="2">{formatTimeAgo(instance.createdAt)}</Text>
                          </Flex>
                        </Flex>

                        <Box>
                          <Text size="2" color="gray" mb="1">Players:</Text>
                          <Flex direction="column" gap="1">
                            {instance.players.map((player, index) => (
                              <Text key={index} size="2">
                                {player.slice(0, 6)}...{player.slice(-4)}
                                {player === account?.address && ' (You)'}
                              </Text>
                            ))}
                          </Flex>
                        </Box>

                        {canJoin && (
                          <Button
                            onClick={() => joinGameInstance(instance)}
                            disabled={!isConnected}
                            style={{
                              background: 'linear-gradient(135deg, #22D3EE, #06B6D4)',
                              border: 'none'
                            }}
                          >
                            Join Game ({template?.stakeAmount} SUI)
                          </Button>
                        )}

                        {isPlayerInGame && instance.state === 'waiting' && (
                          <Button disabled variant="soft">
                            Waiting for Players...
                          </Button>
                        )}

                        {isPlayerInGame && instance.state === 'playing' && (
                          <Button
                            style={{
                              background: 'linear-gradient(135deg, #22D3EE, #06B6D4)',
                              border: 'none'
                            }}
                            onClick={() => {
                              // TODO: Navigate to game play page
                              alert('Game engine integration coming soon!');
                            }}
                          >
                            Enter Game
                          </Button>
                        )}
                      </Flex>
                    </Card>
                  );
                })}
              </Grid>
            )}
          </Box>
        )}
      </Flex>
    </Box>
  );
};

export default CardGameLaunchpadPage;