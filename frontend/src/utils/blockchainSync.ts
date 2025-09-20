// Blockchain State Synchronization for Poker Games
// Handles reading on-chain game state and syncing with frontend

import { SuiClient } from "@mysten/sui/client";
import { PACKAGE_ID } from "../contracts/constants";

export interface OnChainGameTemplate {
  id: string;
  creator: string;
  name: string;
  description: string;
  metaUri: string;
  numSuits: number;
  ranksPerSuit: number;
  cardsPerHand: number;
  combinationSize: number;
  victoryMode: number;
  stakeAmount: string;
  launchFee: string;
  createdAt: string;
  isActive: boolean;
}

export interface OnChainGameInstance {
  id: string;
  templateId: string;
  players: string[];
  deck: number[];
  hands: number[][];
  pot: string;
  started: boolean;
  ended: boolean;
  winners: string[];
}

export class BlockchainSyncManager {
  private suiClient: SuiClient;
  private packageId: string;

  constructor(suiClient: SuiClient, packageId: string = PACKAGE_ID) {
    this.suiClient = suiClient;
    this.packageId = packageId;
  }

  // Fetch template data from blockchain
  async getGameTemplate(templateId: string): Promise<OnChainGameTemplate | null> {
    try {
      const object = await this.suiClient.getObject({
        id: templateId,
        options: {
          showContent: true,
          showType: true
        }
      });

      if (object.data?.content && 'fields' in object.data.content) {
        const fields = object.data.content.fields as any;

        return {
          id: templateId,
          creator: fields.creator,
          name: fields.name,
          description: fields.description,
          metaUri: fields.meta_uri,
          numSuits: parseInt(fields.num_suits),
          ranksPerSuit: parseInt(fields.ranks_per_suit),
          cardsPerHand: parseInt(fields.cards_per_hand),
          combinationSize: parseInt(fields.combination_size),
          victoryMode: parseInt(fields.victory_mode),
          stakeAmount: fields.stake_amount,
          launchFee: fields.launch_fee,
          createdAt: fields.created_at,
          isActive: fields.is_active
        };
      }

      return null;
    } catch (error) {
      console.error("Error fetching game template:", error);
      return null;
    }
  }

  // Fetch game instance data from blockchain
  async getGameInstance(instanceId: string): Promise<OnChainGameInstance | null> {
    try {
      const object = await this.suiClient.getObject({
        id: instanceId,
        options: {
          showContent: true,
          showType: true
        }
      });

      if (object.data?.content && 'fields' in object.data.content) {
        const fields = object.data.content.fields as any;

        return {
          id: instanceId,
          templateId: fields.template_id,
          players: fields.players || [],
          deck: fields.deck || [],
          hands: fields.hands || [],
          pot: fields.pot?.fields?.balance || "0",
          started: fields.started,
          ended: fields.ended,
          winners: fields.winners || []
        };
      }

      return null;
    } catch (error) {
      console.error("Error fetching game instance:", error);
      return null;
    }
  }

  // Get all templates created by a specific creator
  async getTemplatesByCreator(creatorAddress: string): Promise<OnChainGameTemplate[]> {
    try {
      // Query for objects owned by the creator
      const objects = await this.suiClient.getOwnedObjects({
        owner: creatorAddress,
        filter: {
          StructType: `${this.packageId}::card_poker_game::CardPokerTemplate`
        },
        options: {
          showContent: true,
          showType: true
        }
      });

      const templates: OnChainGameTemplate[] = [];

      for (const obj of objects.data) {
        if (obj.data?.content && 'fields' in obj.data.content) {
          const fields = obj.data.content.fields as any;
          const template: OnChainGameTemplate = {
            id: obj.data.objectId,
            creator: fields.creator,
            name: fields.name,
            description: fields.description,
            metaUri: fields.meta_uri,
            numSuits: parseInt(fields.num_suits),
            ranksPerSuit: parseInt(fields.ranks_per_suit),
            cardsPerHand: parseInt(fields.cards_per_hand),
            combinationSize: parseInt(fields.combination_size),
            victoryMode: parseInt(fields.victory_mode),
            stakeAmount: fields.stake_amount,
            launchFee: fields.launch_fee,
            createdAt: fields.created_at,
            isActive: fields.is_active
          };
          templates.push(template);
        }
      }

      return templates.sort((a, b) => parseInt(b.createdAt) - parseInt(a.createdAt));
    } catch (error) {
      console.error("Error fetching templates by creator:", error);
      return [];
    }
  }

  // Get all active game instances for a template
  async getInstancesForTemplate(templateId: string): Promise<OnChainGameInstance[]> {
    try {
      // This would require indexed queries or event listening
      // For now, we'll return empty array as this requires more complex querying
      console.warn("getInstancesForTemplate not fully implemented - requires event indexing");
      return [];
    } catch (error) {
      console.error("Error fetching instances for template:", error);
      return [];
    }
  }

  // Listen for game events
  async subscribeToGameEvents(
    templateId: string,
    onTemplateCreated?: (event: any) => void,
    onGameCreated?: (event: any) => void,
    onGameEnded?: (event: any) => void
  ): Promise<() => void> {
    try {
      // Subscribe to events from the package
      const unsubscribe = await this.suiClient.subscribeEvent({
        filter: {
          Package: this.packageId
        },
        onMessage: (event) => {
          console.log("Received event:", event);

          // Parse event type and call appropriate handler
          if (event.type.includes("TemplateCreated") && onTemplateCreated) {
            onTemplateCreated(event);
          } else if (event.type.includes("GameCreated") && onGameCreated) {
            onGameCreated(event);
          } else if (event.type.includes("GameEnded") && onGameEnded) {
            onGameEnded(event);
          }
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error("Error subscribing to game events:", error);
      return () => {}; // Return empty unsubscribe function
    }
  }

  // Check if a player has joined a specific game instance
  async hasPlayerJoined(instanceId: string, playerAddress: string): Promise<boolean> {
    try {
      const instance = await this.getGameInstance(instanceId);
      return instance?.players.includes(playerAddress) || false;
    } catch (error) {
      console.error("Error checking if player joined:", error);
      return false;
    }
  }

  // Get game statistics
  async getGameStats(templateId: string): Promise<{
    totalGames: number;
    totalStaked: string;
    activeGames: number;
  }> {
    try {
      // This would require aggregating data from events or maintaining counters
      // For now, return mock data
      return {
        totalGames: 0,
        totalStaked: "0",
        activeGames: 0
      };
    } catch (error) {
      console.error("Error fetching game stats:", error);
      return {
        totalGames: 0,
        totalStaked: "0",
        activeGames: 0
      };
    }
  }

  // Utility function to convert MIST to SUI
  mistToSui(mist: string): number {
    return parseInt(mist) / 1_000_000_000;
  }

  // Utility function to format addresses
  formatAddress(address: string, length: number = 8): string {
    if (address.length <= length + 2) return address;
    return `${address.slice(0, length)}...`;
  }

  // Validate object ID format
  isValidObjectId(id: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(id);
  }
}

// React hook for blockchain synchronization
export function useBlockchainSync(suiClient: SuiClient) {
  return new BlockchainSyncManager(suiClient);
}

// Utility function to create a blockchain sync manager
export function createBlockchainSync(suiClient: SuiClient): BlockchainSyncManager {
  return new BlockchainSyncManager(suiClient);
}