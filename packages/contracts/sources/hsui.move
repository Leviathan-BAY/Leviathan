/// Simple hSUI Token - SUI to hSUI Swap System
/// 단순한 SUI ↔ hSUI 스왑 시스템
module leviathan::hsui {
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::event;

    /// Error codes
    const E_INSUFFICIENT_BALANCE: u64 = 1;
    const E_ZERO_AMOUNT: u64 = 2;
    const E_UNAUTHORIZED: u64 = 3;

    /// hSUI witness type (token type)
    public struct HSUI has drop {}

    /// Admin capability
    public struct AdminCap has key, store {
        id: UID,
    }

    /// Global hSUI vault for swapping
    public struct HSuiVault has key {
        id: UID,
        treasury_cap: TreasuryCap<HSUI>,
        sui_balance: Balance<SUI>,        // SUI reserves
        hsui_supply: u64,                 // Total hSUI minted
        exchange_rate: u64,               // Exchange rate (basis points, 10000 = 1:1)
        fee_rate: u64,                    // Fee rate (basis points, 100 = 1%)
        total_deposits: u64,              // Total SUI deposited
        total_withdrawals: u64,           // Total SUI withdrawn
    }

    /// Events
    public struct SuiDeposited has copy, drop {
        user: address,
        sui_amount: u64,
        hsui_minted: u64,
        exchange_rate: u64,
        timestamp: u64,
    }

    public struct HSuiRedeemed has copy, drop {
        user: address,
        hsui_burned: u64,
        sui_returned: u64,
        fee_charged: u64,
        timestamp: u64,
    }

    /// Module initialization
    fun init(witness: HSUI, ctx: &mut TxContext) {
        // Create hSUI currency
        let (treasury_cap, metadata) = coin::create_currency(
            witness,
            9, // decimals
            b"hSUI",
            b"Hermit SUI",
            b"Liquid staking token for SUI",
            option::none(),
            ctx
        );

        // Create admin capability
        let admin_cap = AdminCap {
            id: object::new(ctx),
        };

        // Create global vault
        let vault = HSuiVault {
            id: object::new(ctx),
            treasury_cap,
            sui_balance: balance::zero(),
            hsui_supply: 0,
            exchange_rate: 10000,  // 1:1 initial rate
            fee_rate: 50,          // 0.5% fee
            total_deposits: 0,
            total_withdrawals: 0,
        };

        // Transfer admin cap to deployer
        transfer::public_transfer(admin_cap, tx_context::sender(ctx));

        // Share vault object
        transfer::share_object(vault);

        // Freeze metadata
        transfer::public_freeze_object(metadata);
    }

    /// Deposit SUI and get hSUI
    public entry fun deposit_sui(
        vault: &mut HSuiVault,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let sui_amount = coin::value(&payment);
        assert!(sui_amount > 0, E_ZERO_AMOUNT);

        // Calculate hSUI to mint based on exchange rate
        let hsui_to_mint = sui_amount * vault.exchange_rate / 10000;

        // Add SUI to vault
        balance::join(&mut vault.sui_balance, coin::into_balance(payment));

        // Mint hSUI
        let hsui_coin = coin::mint(&mut vault.treasury_cap, hsui_to_mint, ctx);

        // Update vault statistics
        vault.hsui_supply = vault.hsui_supply + hsui_to_mint;
        vault.total_deposits = vault.total_deposits + sui_amount;

        let user = tx_context::sender(ctx);

        // Transfer hSUI to user
        transfer::public_transfer(hsui_coin, user);

        // Emit event
        event::emit(SuiDeposited {
            user,
            sui_amount,
            hsui_minted: hsui_to_mint,
            exchange_rate: vault.exchange_rate,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    /// Redeem hSUI for SUI
    public entry fun redeem_hsui(
        vault: &mut HSuiVault,
        hsui_coin: Coin<HSUI>,
        ctx: &mut TxContext
    ) {
        let hsui_amount = coin::value(&hsui_coin);
        assert!(hsui_amount > 0, E_ZERO_AMOUNT);

        // Calculate SUI to return
        let base_sui_amount = hsui_amount * 10000 / vault.exchange_rate;
        let fee_amount = base_sui_amount * vault.fee_rate / 10000;
        let sui_to_return = base_sui_amount - fee_amount;

        // Check if vault has enough SUI
        assert!(balance::value(&vault.sui_balance) >= sui_to_return, E_INSUFFICIENT_BALANCE);

        // Burn hSUI
        coin::burn(&mut vault.treasury_cap, hsui_coin);

        // Withdraw SUI from vault
        let sui_balance = balance::split(&mut vault.sui_balance, sui_to_return);
        let sui_coin = coin::from_balance(sui_balance, ctx);

        // Update vault statistics
        vault.hsui_supply = vault.hsui_supply - hsui_amount;
        vault.total_withdrawals = vault.total_withdrawals + sui_to_return;

        let user = tx_context::sender(ctx);

        // Transfer SUI to user
        transfer::public_transfer(sui_coin, user);

        // Emit event
        event::emit(HSuiRedeemed {
            user,
            hsui_burned: hsui_amount,
            sui_returned: sui_to_return,
            fee_charged: fee_amount,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    /// Update exchange rate (admin only)
    public entry fun update_exchange_rate(
        vault: &mut HSuiVault,
        _admin_cap: &AdminCap,
        new_rate: u64,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) != @0x0, E_UNAUTHORIZED);
        assert!(new_rate > 0, E_ZERO_AMOUNT);

        vault.exchange_rate = new_rate;
    }

    /// Update fee rate (admin only)
    public entry fun update_fee_rate(
        vault: &mut HSuiVault,
        _admin_cap: &AdminCap,
        new_fee_rate: u64,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) != @0x0, E_UNAUTHORIZED);
        assert!(new_fee_rate <= 1000, E_ZERO_AMOUNT); // Max 10%

        vault.fee_rate = new_fee_rate;
    }

    /// Withdraw accumulated fees (admin only)
    public entry fun withdraw_fees(
        vault: &mut HSuiVault,
        _admin_cap: &AdminCap,
        amount: u64,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) != @0x0, E_UNAUTHORIZED);
        assert!(amount > 0, E_ZERO_AMOUNT);
        assert!(balance::value(&vault.sui_balance) >= amount, E_INSUFFICIENT_BALANCE);

        let fee_balance = balance::split(&mut vault.sui_balance, amount);
        let fee_coin = coin::from_balance(fee_balance, ctx);

        transfer::public_transfer(fee_coin, tx_context::sender(ctx));
    }

    /// View functions
    public fun get_vault_info(vault: &HSuiVault): (u64, u64, u64, u64, u64, u64) {
        (
            balance::value(&vault.sui_balance),  // SUI balance
            vault.hsui_supply,                   // hSUI supply
            vault.exchange_rate,                 // Exchange rate
            vault.fee_rate,                      // Fee rate
            vault.total_deposits,                // Total deposits
            vault.total_withdrawals              // Total withdrawals
        )
    }

    public fun calculate_hsui_output(vault: &HSuiVault, sui_amount: u64): u64 {
        sui_amount * vault.exchange_rate / 10000
    }

    public fun calculate_sui_output(vault: &HSuiVault, hsui_amount: u64): (u64, u64) {
        let base_amount = hsui_amount * 10000 / vault.exchange_rate;
        let fee = base_amount * vault.fee_rate / 10000;
        (base_amount - fee, fee)
    }

    public fun get_exchange_rate(vault: &HSuiVault): u64 {
        vault.exchange_rate
    }

    /// Test-only functions
    #[test_only]
    public fun test_init(ctx: &mut TxContext) {
        init(HSUI {}, ctx);
    }
}