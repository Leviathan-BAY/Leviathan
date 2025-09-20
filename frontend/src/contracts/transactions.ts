// Transaction utilities for Leviathan platform contracts
import { Transaction } from "@mysten/sui/transactions";
import { CONTRACT_ADDRESSES, CONTRACT_FUNCTIONS, PACKAGE_ID } from "./constants";

// Hermit Finance Transactions
export class HermitFinanceTransactions {
  static depositSui(amount: bigint): Transaction {
    const tx = new Transaction();

    const [coin] = tx.splitCoins(tx.gas, [amount]);

    tx.moveCall({
      target: `${PACKAGE_ID}::hermit_finance::${CONTRACT_FUNCTIONS.DEPOSIT_SUI}`,
      arguments: [
        tx.object(CONTRACT_ADDRESSES.HERMIT_FINANCE),
        coin
      ]
    });

    return tx;
  }

  static withdrawHSui(hSuiAmount: bigint): Transaction {
    const tx = new Transaction();

    // This would require the user's hSui coin objects
    tx.moveCall({
      target: `${PACKAGE_ID}::hermit_finance::${CONTRACT_FUNCTIONS.WITHDRAW_HSUI}`,
      arguments: [
        tx.object(CONTRACT_ADDRESSES.HERMIT_FINANCE),
        tx.pure.u64(hSuiAmount)
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
      target: `${PACKAGE_ID}::board_game_maker::${CONTRACT_FUNCTIONS.START_GAME}`,
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
      target: `${PACKAGE_ID}::board_game_maker::${CONTRACT_FUNCTIONS.JOIN_GAME}`,
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
      target: `${PACKAGE_ID}::board_game_maker::${CONTRACT_FUNCTIONS.ROLL_DICE_AND_MOVE}`,
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

// Card Game Maker Transactions (for future card/token system)
// TODO: Create card_game_maker.move and update module references
export class CardGameMakerTransactions {
  static createGameComponents(
    title: string,
    handMaxSlots: number,
    privateAreaSlots: number
  ): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::board_game_maker::${CONTRACT_FUNCTIONS.CREATE_GAME_COMPONENTS}`,
      arguments: [
        tx.pure(Array.from(new TextEncoder().encode(title))),
        tx.pure.u8(handMaxSlots),
        tx.pure.u8(privateAreaSlots)
      ]
    });

    return tx;
  }

  static configureSharedBoardCell(
    gameComponentsId: string,
    position: number,
    cellType: number,
    backgroundImageUrl: string,
    specialEffects: string[]
  ): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::game_maker::${CONTRACT_FUNCTIONS.CONFIGURE_SHARED_BOARD_CELL}`,
      arguments: [
        tx.object(gameComponentsId),
        tx.pure.u8(position),
        tx.pure.u8(cellType),
        tx.pure(Array.from(new TextEncoder().encode(backgroundImageUrl))),
        tx.pure(specialEffects.map(effect => Array.from(new TextEncoder().encode(effect))))
      ]
    });

    return tx;
  }

  static createCard(
    gameComponentsId: string,
    cardId: number,
    frontImageUrl: string,
    backImageUrl: string,
    symbol: string,
    number: number
  ): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::game_maker::${CONTRACT_FUNCTIONS.CREATE_CARD}`,
      arguments: [
        tx.object(gameComponentsId),
        tx.pure.u64(cardId),
        tx.pure(Array.from(new TextEncoder().encode(frontImageUrl))),
        tx.pure(Array.from(new TextEncoder().encode(backImageUrl))),
        tx.pure(Array.from(new TextEncoder().encode(symbol))),
        tx.pure.u8(number)
      ]
    });

    return tx;
  }

  static createToken(
    gameComponentsId: string,
    tokenId: number,
    frontImageUrl: string,
    backImageUrl: string,
    boundCounter?: string
  ): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::game_maker::${CONTRACT_FUNCTIONS.CREATE_TOKEN}`,
      arguments: [
        tx.object(gameComponentsId),
        tx.pure.u64(tokenId),
        tx.pure(Array.from(new TextEncoder().encode(frontImageUrl))),
        tx.pure(Array.from(new TextEncoder().encode(backImageUrl))),
        tx.pure(Array.from(new TextEncoder().encode(boundCounter || "")))
      ]
    });

    return tx;
  }

  static createCounter(
    gameComponentsId: string,
    name: string,
    initialValue: number,
    maxValue: number,
    displayType: number
  ): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::game_maker::${CONTRACT_FUNCTIONS.CREATE_COUNTER}`,
      arguments: [
        tx.object(gameComponentsId),
        tx.pure(Array.from(new TextEncoder().encode(name))),
        tx.pure.u64(initialValue),
        tx.pure.u64(maxValue),
        tx.pure.u8(displayType)
      ]
    });

    return tx;
  }

  static flipCard(gameComponentsId: string, cardId: number): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::game_maker::${CONTRACT_FUNCTIONS.FLIP_CARD}`,
      arguments: [
        tx.object(gameComponentsId),
        tx.pure.u64(cardId)
      ]
    });

    return tx;
  }

  static setWalrusReference(gameComponentsId: string, blobId: string): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::game_maker::${CONTRACT_FUNCTIONS.SET_WALRUS_REFERENCE}`,
      arguments: [
        tx.object(gameComponentsId),
        tx.pure(Array.from(new TextEncoder().encode(blobId)))
      ]
    });

    return tx;
  }
}

// Game Launchpad Transactions
export class GameLaunchpadTransactions {
  static publishGame(
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
        tx.object(CONTRACT_ADDRESSES.GAME_LAUNCHPAD),
        tx.object(hSuiPayment),
        tx.pure(Array.from(new TextEncoder().encode(title))),
        tx.pure(Array.from(new TextEncoder().encode(description))),
        tx.pure(Array.from(new TextEncoder().encode(category))),
        tx.pure(Array.from(new TextEncoder().encode(walrusObjectId))),
        tx.pure(Array.from(new TextEncoder().encode(thumbnailUrl)))
      ]
    });

    return tx;
  }
}

// Game Engine Transactions
export class GameEngineTransactions {
  static createGameInstance(
    templateId: string,
    players: string[]
  ): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::game_engine::${CONTRACT_FUNCTIONS.CREATE_INSTANCE}`,
      arguments: [
        tx.object(templateId),
        tx.pure(players)
      ]
    });

    return tx;
  }

  static performAction(
    instanceId: string,
    actionKind: number,
    payload: number[]
  ): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::game_engine::${CONTRACT_FUNCTIONS.ACT}`,
      arguments: [
        tx.object(instanceId),
        tx.pure.address("0x0"), // actor address will be filled by wallet
        tx.pure.u8(actionKind),
        tx.pure(payload)
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