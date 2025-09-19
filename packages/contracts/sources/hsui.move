module leviathan::hsui {
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::table::{Self, Table};

    // ===== Error codes =====
    const EInsufficientBalance: u64 = 0;
    const ENotAdmin: u64 = 1;
    const EZeroAmount: u64 = 2;
    const EInvalidSlippage: u64 = 3;

    // ===== Structs =====

    /// The hSUI token witness type
    public struct HSUI has drop {}

    /// Admin capability for managing the protocol
    public struct AdminCap has key, store {
        id: UID,
    }

    /// Global configuration for the hSUI protocol
    public struct Config has key {
        id: UID,
        /// Protocol fee in basis points (e.g., 500 = 5%)
        fee_bps: u64,
        /// Treasury cap for minting/burning hSUI
        treasury_cap: TreasuryCap<HSUI>,
    }

    /// Pool for managing SUI <-> hSUI conversions
    public struct Pool has key {
        id: UID,
        /// Total SUI staked in the pool
        sui_balance: Balance<SUI>,
        /// Total hSUI supply (for tracking purposes)
        total_hsui_supply: u64,
    }

    // ===== Functions =====

    /// Module initializer - creates the hSUI coin and initial objects
    fun init(witness: HSUI, ctx: &mut TxContext) {
        // Create the hSUI coin
        let (treasury_cap, metadata) = coin::create_currency<HSUI>(
            witness,
            9, // decimals
            b"hSUI",
            b"Hermit SUI",
            b"Liquid staking token for SUI with delta-neutral strategy",
            option::none(),
            ctx
        );

        // Transfer metadata to sender
        transfer::public_freeze_object(metadata);

        // Create admin capability
        let admin_cap = AdminCap {
            id: object::new(ctx),
        };

        // Create config
        let config = Config {
            id: object::new(ctx),
            fee_bps: 500, // 5% default fee
            treasury_cap,
        };

        // Create pool
        let pool = Pool {
            id: object::new(ctx),
            sui_balance: balance::zero(),
            total_hsui_supply: 0,
        };

        // Transfer objects to sender
        transfer::transfer(admin_cap, tx_context::sender(ctx));
        transfer::share_object(config);
        transfer::share_object(pool);
    }

    /// Stake SUI and receive hSUI (1:1 ratio for MVP)
    public entry fun stake(
        pool: &mut Pool,
        config: &mut Config,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let amount = coin::value(&payment);
        assert!(amount > 0, EZeroAmount);

        let sender = tx_context::sender(ctx);

        // Add SUI to pool balance
        let sui_balance = coin::into_balance(payment);
        balance::join(&mut pool.sui_balance, sui_balance);

        // Mint hSUI tokens (1:1 ratio for MVP)
        let hsui_amount = amount;
        let hsui_coin = coin::mint(&mut config.treasury_cap, hsui_amount, ctx);

        // Update total supply tracking
        pool.total_hsui_supply = pool.total_hsui_supply + hsui_amount;

        // Transfer hSUI coin to user
        transfer::public_transfer(hsui_coin, sender);
    }

    /// Unstake hSUI and receive SUI (with 0.1% slippage for demonstration)
    public entry fun unstake(
        pool: &mut Pool,
        config: &mut Config,
        hsui_coin: Coin<HSUI>,
        ctx: &mut TxContext
    ) {
        let hsui_amount = coin::value(&hsui_coin);
        assert!(hsui_amount > 0, EZeroAmount);

        let sender = tx_context::sender(ctx);

        // Calculate SUI to return (with 0.1% slippage)
        let sui_to_return = (hsui_amount as u128) * 999 / 1000;
        let sui_amount = (sui_to_return as u64);

        // Check pool has sufficient SUI
        assert!(balance::value(&pool.sui_balance) >= sui_amount, EInsufficientBalance);

        // Burn the hSUI coin
        coin::burn(&mut config.treasury_cap, hsui_coin);

        // Update total supply tracking
        pool.total_hsui_supply = pool.total_hsui_supply - hsui_amount;

        // Transfer SUI back to user
        let sui_balance = balance::split(&mut pool.sui_balance, sui_amount);
        let sui_coin = coin::from_balance(sui_balance, ctx);
        transfer::public_transfer(sui_coin, sender);
    }

    /// Get pool statistics
    public fun get_pool_stats(pool: &Pool): (u64, u64) {
        (
            balance::value(&pool.sui_balance), // Total SUI in pool
            pool.total_hsui_supply            // Total hSUI supply
        )
    }

    /// Get current exchange rate (SUI per hSUI)
    public fun get_exchange_rate(pool: &Pool): (u64, u64) {
        if (pool.total_hsui_supply == 0) {
            (1, 1) // 1:1 when no supply
        } else {
            let sui_amount = balance::value(&pool.sui_balance);
            (sui_amount, pool.total_hsui_supply)
        }
    }

    /// Admin function to update fee
    public entry fun set_fee(
        _: &AdminCap,
        config: &mut Config,
        new_fee_bps: u64,
    ) {
        assert!(new_fee_bps <= 10000, EInvalidSlippage); // Max 100%
        config.fee_bps = new_fee_bps;
    }

    /// Admin function to mint hSUI (for testing or special cases)
    public entry fun admin_mint(
        _: &AdminCap,
        config: &mut Config,
        pool: &mut Pool,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let hsui_coin = coin::mint(&mut config.treasury_cap, amount, ctx);

        // Update total supply tracking
        pool.total_hsui_supply = pool.total_hsui_supply + amount;

        transfer::public_transfer(hsui_coin, recipient);
    }

    /// Admin function to burn hSUI
    public entry fun admin_burn(
        _: &AdminCap,
        config: &mut Config,
        pool: &mut Pool,
        hsui_coin: Coin<HSUI>
    ) {
        let amount = coin::value(&hsui_coin);
        coin::burn(&mut config.treasury_cap, hsui_coin);

        // Update total supply tracking
        pool.total_hsui_supply = pool.total_hsui_supply - amount;
    }

    // ===== View functions =====

    /// Get config information
    public fun get_config(config: &Config): u64 {
        config.fee_bps
    }

    /// Check if address has admin capability (for testing)
    public fun has_admin_cap(cap: &AdminCap): bool {
        true // Simple existence check
    }
}