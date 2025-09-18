/// Hermit Finance - Delta Neutral Strategy for hSui Token
/// This module implements the core hSui token and vault system
module leviathan::hermit_finance {
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::event;
    use sui::tx_context::{Self, TxContext};
    use sui::object::{Self, UID};
    use sui::transfer;

    /// Error codes
    const E_INSUFFICIENT_BALANCE: u64 = 1;
    const E_ZERO_AMOUNT: u64 = 2;
    const E_VAULT_PAUSED: u64 = 3;
    const E_UNAUTHORIZED: u64 = 4;

    /// The hSui token type
    public struct HSUI has drop {}

    /// Admin capability for managing the vault
    public struct AdminCap has key, store {
        id: UID,
    }

    /// Main vault structure that holds SUI and manages hSui minting
    public struct Vault has key {
        id: UID,
        sui_balance: Balance<SUI>,
        total_hsui_supply: u64,
        is_paused: bool,
        // Future: Add fields for delta neutral strategy
        // staking_allocation: u64,
        // futures_allocation: u64,
    }

    /// Events
    public struct DepositEvent has copy, drop {
        user: address,
        sui_amount: u64,
        hsui_minted: u64,
        timestamp: u64,
    }

    public struct WithdrawEvent has copy, drop {
        user: address,
        hsui_burned: u64,
        sui_amount: u64,
        timestamp: u64,
    }

    /// Initialize the Hermit Finance module
    fun init(witness: HSUI, ctx: &mut TxContext) {
        // Create the treasury cap for hSui
        let (treasury, metadata) = coin::create_currency(
            witness,
            9, // decimals
            b"hSUI",
            b"Hermit SUI",
            b"Stable value token backed by delta neutral SUI position",
            option::none(),
            ctx
        );

        // Create admin capability
        let admin_cap = AdminCap {
            id: object::new(ctx),
        };

        // Create the main vault
        let vault = Vault {
            id: object::new(ctx),
            sui_balance: balance::zero(),
            total_hsui_supply: 0,
            is_paused: false,
        };

        // Transfer objects
        transfer::public_transfer(treasury, tx_context::sender(ctx));
        transfer::public_transfer(admin_cap, tx_context::sender(ctx));
        transfer::public_freeze_object(metadata);
        transfer::share_object(vault);
    }

    /// Deposit SUI and mint hSui tokens (1:1 ratio for MVP)
    public entry fun deposit(
        vault: &mut Vault,
        treasury: &mut TreasuryCap<HSUI>,
        sui_coin: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        assert!(!vault.is_paused, E_VAULT_PAUSED);

        let sui_amount = coin::value(&sui_coin);
        assert!(sui_amount > 0, E_ZERO_AMOUNT);

        // Add SUI to vault balance
        let sui_balance = coin::into_balance(sui_coin);
        balance::join(&mut vault.sui_balance, sui_balance);

        // Mint hSui tokens (1:1 ratio for MVP)
        let hsui_coin = coin::mint(treasury, sui_amount, ctx);
        vault.total_hsui_supply = vault.total_hsui_supply + sui_amount;

        // Emit event
        event::emit(DepositEvent {
            user: tx_context::sender(ctx),
            sui_amount,
            hsui_minted: sui_amount,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });

        // Transfer hSui to user
        transfer::public_transfer(hsui_coin, tx_context::sender(ctx));
    }

    /// Withdraw SUI by burning hSui tokens
    public entry fun withdraw(
        vault: &mut Vault,
        treasury: &mut TreasuryCap<HSUI>,
        hsui_coin: Coin<HSUI>,
        ctx: &mut TxContext
    ) {
        assert!(!vault.is_paused, E_VAULT_PAUSED);

        let hsui_amount = coin::value(&hsui_coin);
        assert!(hsui_amount > 0, E_ZERO_AMOUNT);
        assert!(balance::value(&vault.sui_balance) >= hsui_amount, E_INSUFFICIENT_BALANCE);

        // Burn hSui tokens
        coin::burn(treasury, hsui_coin);
        vault.total_hsui_supply = vault.total_hsui_supply - hsui_amount;

        // Withdraw SUI from vault (1:1 ratio for MVP)
        let sui_balance = balance::split(&mut vault.sui_balance, hsui_amount);
        let sui_coin = coin::from_balance(sui_balance, ctx);

        // Emit event
        event::emit(WithdrawEvent {
            user: tx_context::sender(ctx),
            hsui_burned: hsui_amount,
            sui_amount: hsui_amount,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });

        // Transfer SUI to user
        transfer::public_transfer(sui_coin, tx_context::sender(ctx));
    }

    /// Admin function to pause/unpause the vault
    public entry fun set_pause_status(
        _: &AdminCap,
        vault: &mut Vault,
        paused: bool,
    ) {
        vault.is_paused = paused;
    }

    /// View functions
    public fun vault_sui_balance(vault: &Vault): u64 {
        balance::value(&vault.sui_balance)
    }

    public fun vault_hsui_supply(vault: &Vault): u64 {
        vault.total_hsui_supply
    }

    public fun vault_is_paused(vault: &Vault): bool {
        vault.is_paused
    }

    /// Test-only functions
    #[test_only]
    public fun test_init(ctx: &mut TxContext) {
        init(HSUI {}, ctx)
    }
}