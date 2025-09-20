// Transaction utilities for Leviathan platform contracts
import { Transaction } from "@mysten/sui/transactions";
import { CONTRACT_FUNCTIONS, PACKAGE_ID } from "./constants";

// Hermit Finance (hSUI) Transactions
export class HermitFinanceTransactions {
  static depositSui(vaultId: string, amount: bigint): Transaction {
    const tx = new Transaction();

    const [coin] = tx.splitCoins(tx.gas, [amount]);

    tx.moveCall({
      target: `${PACKAGE_ID}::hsui::${CONTRACT_FUNCTIONS.DEPOSIT_SUI}`,
      arguments: [
        tx.object(vaultId),
        coin
      ]
    });

    return tx;
  }

  static redeemHSui(vaultId: string, hSuiCoinId: string): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::hsui::${CONTRACT_FUNCTIONS.REDEEM_HSUI}`,
      arguments: [
        tx.object(vaultId),
        tx.object(hSuiCoinId)
      ]
    });

    return tx;
  }

  static updateExchangeRate(vaultId: string, adminCapId: string, newRate: number): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::hsui::${CONTRACT_FUNCTIONS.UPDATE_EXCHANGE_RATE}`,
      arguments: [
        tx.object(vaultId),
        tx.object(adminCapId),
        tx.pure.u64(newRate)
      ]
    });

    return tx;
  }

  static updateFeeRate(vaultId: string, adminCapId: string, newFeeRate: number): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::hsui::${CONTRACT_FUNCTIONS.UPDATE_FEE_RATE}`,
      arguments: [
        tx.object(vaultId),
        tx.object(adminCapId),
        tx.pure.u64(newFeeRate)
      ]
    });

    return tx;
  }
}

// Board Game Template Transactions (from game_maker.move)
export class BoardGameTemplateTransactions {
  static createGameTemplate(
    name: string,
    description: string,
    diceMin: number,
    diceMax: number,
    piecesPerPlayer: number,
    stakeAmount: bigint
  ): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::board_game_maker::${CONTRACT_FUNCTIONS.CREATE_GAME_TEMPLATE}`,
      arguments: [
        tx.pure.vector("u8", Array.from(new TextEncoder().encode(name))),
        tx.pure.vector("u8", Array.from(new TextEncoder().encode(description))),
        tx.pure.u8(diceMin),
        tx.pure.u8(diceMax),
        tx.pure.u8(piecesPerPlayer),
        tx.pure.u64(stakeAmount)
      ]
    });

    return tx;
  }

  static setBoardCell(
    templateId: string,
    position: number,
    cellType: number
  ): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::board_game_maker::${CONTRACT_FUNCTIONS.SET_BOARD_CELL}`,
      arguments: [
        tx.object(templateId),
        tx.pure.u8(position),
        tx.pure.u8(cellType)
      ]
    });

    return tx;
  }

  static setMultipleCells(
    templateId: string,
    positions: number[],
    cellTypes: number[]
  ): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::board_game_maker::${CONTRACT_FUNCTIONS.SET_MULTIPLE_CELLS}`,
      arguments: [
        tx.object(templateId),
        tx.pure.vector("u8", positions),
        tx.pure.vector("u8", cellTypes)
      ]
    });

    return tx;
  }

  static setStartPositions(
    templateId: string,
    positions: number[]
  ): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::board_game_maker::${CONTRACT_FUNCTIONS.SET_START_POSITIONS}`,
      arguments: [
        tx.object(templateId),
        tx.pure.vector("u8", positions)
      ]
    });

    return tx;
  }

  static setFinishPositions(
    templateId: string,
    positions: number[]
  ): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::board_game_maker::${CONTRACT_FUNCTIONS.SET_FINISH_POSITIONS}`,
      arguments: [
        tx.object(templateId),
        tx.pure.vector("u8", positions)
      ]
    });

    return tx;
  }

  static startGame(
    templateId: string,
    stakeAmount: bigint
  ): Transaction {
    const tx = new Transaction();

    const [coin] = tx.splitCoins(tx.gas, [stakeAmount]);

    tx.moveCall({
      target: `${PACKAGE_ID}::board_game_launcher::${CONTRACT_FUNCTIONS.START_GAME}`,
      arguments: [
        tx.object(templateId),
        coin
      ]
    });

    return tx;
  }

  static joinGame(
    gameInstanceId: string,
    templateId: string,
    stakeAmount: bigint
  ): Transaction {
    const tx = new Transaction();

    const [coin] = tx.splitCoins(tx.gas, [stakeAmount]);

    tx.moveCall({
      target: `${PACKAGE_ID}::board_game_launcher::${CONTRACT_FUNCTIONS.JOIN_GAME}`,
      arguments: [
        tx.object(gameInstanceId),
        tx.object(templateId),
        coin
      ]
    });

    return tx;
  }

  static rollDiceAndMove(
    gameInstanceId: string,
    templateId: string,
    pieceIndex: number,
    randomObjectId: string
  ): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::board_game_launcher::${CONTRACT_FUNCTIONS.ROLL_DICE_AND_MOVE}`,
      arguments: [
        tx.object(gameInstanceId),
        tx.object(templateId),
        tx.pure.u8(pieceIndex),
        tx.object(randomObjectId)
      ]
    });

    return tx;
  }

}

// Game Launchpad Transactions
export class GameLaunchpadTransactions {
  static publishGame(
    launchpadId: string,
    hSuiPayment: string, // hSui coin object ID
    title: string,
    description: string,
    category: string,
    walrusObjectId: string,
    thumbnailUrl: string
  ): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::game_launchpad::${CONTRACT_FUNCTIONS.PUBLISH_GAME}`,
      arguments: [
        tx.object(launchpadId),
        tx.object(hSuiPayment),
        tx.pure.vector("u8", Array.from(new TextEncoder().encode(title))),
        tx.pure.vector("u8", Array.from(new TextEncoder().encode(description))),
        tx.pure.vector("u8", Array.from(new TextEncoder().encode(category))),
        tx.pure.vector("u8", Array.from(new TextEncoder().encode(walrusObjectId))),
        tx.pure.vector("u8", Array.from(new TextEncoder().encode(thumbnailUrl)))
      ]
    });

    return tx;
  }
}

// Utility functions
export const TransactionUtils = {
  // Convert string to bytes for Move calls
  stringToBytes: (str: string): number[] => Array.from(new TextEncoder().encode(str)),

  // Convert MIST to SUI (1 SUI = 1_000_000_000 MIST)
  suiToMist: (sui: number): bigint => BigInt(Math.floor(sui * 1_000_000_000)),

  // Convert MIST to SUI
  mistToSui: (mist: bigint): number => Number(mist) / 1_000_000_000,

  // Validate object ID format
  isValidObjectId: (id: string): boolean => {
    return /^0x[a-fA-F0-9]{64}$/.test(id);
  }
};

