/// Match Settlement - Handles escrow and settlement for game matches
module leviathan::match_settlement {
    use sui::object::{Self, ID, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::event;
    use sui::clock::{Self, Clock};
    use std::string::{String};
    use std::vector;

    /// Error codes
    const E_INVALID_STAKE: u64 = 1;
    const E_MATCH_NOT_FOUND: u64 = 2;
    const E_UNAUTHORIZED: u64 = 3;
    const E_MATCH_ALREADY_SETTLED: u64 = 4;
    const E_MATCH_NOT_FINISHED: u64 = 5;
    const E_INVALID_PLAYER_COUNT: u64 = 6;
    const E_TIMEOUT_NOT_REACHED: u64 = 7;

    /// Match escrow object that holds stakes for a game match
    public struct MatchEscrow has key {
        id: UID,
        game_id: String,
        players: vector<address>,
        stake_per_player: u64,
        total_balance: Balance<SUI>,
        is_settled: bool,
        winner: Option<address>,
        created_at: u64,
        timeout_ms: u64, // Timeout for automatic settlement
    }

    /// Admin capability for emergency functions
    public struct AdminCap has key, store {
        id: UID,
    }

    /// Events
    public struct MatchCreated has copy, drop {
        escrow_id: ID,
        game_id: String,
        players: vector<address>,
        stake_per_player: u64,
        total_pot: u64,
        timeout_ms: u64,
        timestamp: u64,
    }

    public struct MatchSettled has copy, drop {
        escrow_id: ID,
        game_id: String,
        winner: address,
        prize_amount: u64,
        platform_fee: u64,
        timestamp: u64,
    }

    public struct MatchCancelled has copy, drop {
        escrow_id: ID,
        game_id: String,
        reason: String,
        timestamp: u64,
    }

    /// Initialize the Match Settlement module
    fun init(ctx: &mut TxContext) {
        let admin_cap = AdminCap {
            id: object::new(ctx),
        };

        transfer::public_transfer(admin_cap, tx_context::sender(ctx));
    }

    /// Create a new match escrow
    public entry fun create_match(
        game_id: String,
        players: vector<address>,
        stakes: vector<Coin<SUI>>,
        timeout_hours: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let player_count = vector::length(&players);
        let stake_count = vector::length(&stakes);

        assert!(player_count >= 2 && player_count <= 4, E_INVALID_PLAYER_COUNT);
        assert!(player_count == stake_count, E_INVALID_STAKE);

        // Validate all stakes are equal
        let first_stake_amount = coin::value(vector::borrow(&stakes, 0));
        let mut i = 1;
        while (i < stake_count) {
            let stake_amount = coin::value(vector::borrow(&stakes, i));
            assert!(stake_amount == first_stake_amount, E_INVALID_STAKE);
            i = i + 1;
        };

        // Combine all stakes
        let mut total_balance = balance::zero<SUI>();
        while (!vector::is_empty(&stakes)) {
            let stake = vector::pop_back(&mut stakes);
            balance::join(&mut total_balance, coin::into_balance(stake));
        };
        vector::destroy_empty(stakes);

        let total_pot = balance::value(&total_balance);
        let timeout_ms = clock::timestamp_ms(clock) + (timeout_hours * 60 * 60 * 1000);

        // Create match escrow
        let escrow = MatchEscrow {
            id: object::new(ctx),
            game_id,
            players,
            stake_per_player: first_stake_amount,
            total_balance,
            is_settled: false,
            winner: option::none(),
            created_at: clock::timestamp_ms(clock),
            timeout_ms,
        };

        let escrow_id = object::id(&escrow);

        // Emit event
        event::emit(MatchCreated {
            escrow_id,
            game_id: escrow.game_id,
            players: escrow.players,
            stake_per_player: first_stake_amount,
            total_pot,
            timeout_ms,
            timestamp: clock::timestamp_ms(clock),
        });

        // Share the escrow object
        transfer::share_object(escrow);
    }

    /// Settle a match with a winner (called by authorized game server or oracle)
    public entry fun settle_match(
        escrow: &mut MatchEscrow,
        winner: address,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(!escrow.is_settled, E_MATCH_ALREADY_SETTLED);
        assert!(vector::contains(&escrow.players, &winner), E_UNAUTHORIZED);

        // Calculate platform fee (2.5% of total pot)
        let total_pot = balance::value(&escrow.total_balance);
        let platform_fee = total_pot * 25 / 1000; // 2.5%
        let prize_amount = total_pot - platform_fee;

        // Extract platform fee
        let fee_balance = balance::split(&mut escrow.total_balance, platform_fee);
        let fee_coin = coin::from_balance(fee_balance, ctx);

        // Transfer platform fee to admin (in production, this would go to treasury)
        transfer::public_transfer(fee_coin, tx_context::sender(ctx));

        // Transfer prize to winner
        let prize_balance = balance::withdraw_all(&mut escrow.total_balance);
        let prize_coin = coin::from_balance(prize_balance, ctx);
        transfer::public_transfer(prize_coin, winner);

        // Mark as settled
        escrow.is_settled = true;
        escrow.winner = option::some(winner);

        // Emit event
        event::emit(MatchSettled {
            escrow_id: object::id(escrow),
            game_id: escrow.game_id,
            winner,
            prize_amount,
            platform_fee,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    /// Cancel a match and refund stakes (for timeouts or disputes)
    public entry fun cancel_match(
        escrow: &mut MatchEscrow,
        reason: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(!escrow.is_settled, E_MATCH_ALREADY_SETTLED);

        // Check if timeout has been reached (allow anyone to cancel after timeout)
        let current_time = clock::timestamp_ms(clock);
        if (current_time < escrow.timeout_ms) {
            // Before timeout, only players can cancel
            assert!(vector::contains(&escrow.players, &tx_context::sender(ctx)), E_UNAUTHORIZED);
        };

        // Refund stakes to players
        let stake_amount = escrow.stake_per_player;
        let player_count = vector::length(&escrow.players);
        let mut i = 0;

        while (i < player_count) {
            let player = *vector::borrow(&escrow.players, i);
            let refund_balance = balance::split(&mut escrow.total_balance, stake_amount);
            let refund_coin = coin::from_balance(refund_balance, ctx);
            transfer::public_transfer(refund_coin, player);
            i = i + 1;
        };

        // Mark as settled (cancelled)
        escrow.is_settled = true;

        // Emit event
        event::emit(MatchCancelled {
            escrow_id: object::id(escrow),
            game_id: escrow.game_id,
            reason,
            timestamp: current_time,
        });
    }

    /// Admin emergency function to settle a disputed match
    public entry fun admin_settle_match(
        _: &AdminCap,
        escrow: &mut MatchEscrow,
        winner: Option<address>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(!escrow.is_settled, E_MATCH_ALREADY_SETTLED);

        if (option::is_some(&winner)) {
            let winner_addr = option::extract(&mut winner);
            settle_match(escrow, winner_addr, clock, ctx);
        } else {
            // No winner - refund to all players
            cancel_match(escrow, string::utf8(b"admin_intervention"), clock, ctx);
        }
    }

    /// View functions
    public fun get_match_info(escrow: &MatchEscrow): (String, vector<address>, u64, bool, Option<address>) {
        (
            escrow.game_id,
            escrow.players,
            escrow.stake_per_player,
            escrow.is_settled,
            escrow.winner
        )
    }

    public fun get_total_pot(escrow: &MatchEscrow): u64 {
        balance::value(&escrow.total_balance)
    }

    public fun is_timed_out(escrow: &MatchEscrow, clock: &Clock): bool {
        clock::timestamp_ms(clock) >= escrow.timeout_ms
    }

    public fun get_timeout(escrow: &MatchEscrow): u64 {
        escrow.timeout_ms
    }

    /// Test-only functions
    #[test_only]
    public fun test_init(ctx: &mut TxContext) {
        init(ctx)
    }
}