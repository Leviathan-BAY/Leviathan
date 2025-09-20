/// hSUI Token and Pool Management System
/// 다중 풀 생성 및 관리, TreasuryCap 통합
module leviathan::hsui {
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::table::{Self, Table};
    use sui::event;
    use std::string::{Self, String};

    /// Error codes
    const E_INSUFFICIENT_BALANCE: u64 = 1;
    #[allow(unused_const)]
    const E_NOT_ADMIN: u64 = 2;
    const E_ZERO_AMOUNT: u64 = 3;
    const E_INVALID_SLIPPAGE: u64 = 4;
    #[allow(unused_const)]
    const E_POOL_NOT_FOUND: u64 = 5;
    const E_UNAUTHORIZED: u64 = 6;
    const E_POOL_PAUSED: u64 = 7;
    const E_INVALID_FEE: u64 = 8;
    const E_POOL_EXISTS: u64 = 9;

    /// hSUI witness type (token type)
    public struct HSUI has drop {}

    /// Admin capability resource
    public struct AdminCap has key, store {
        id: UID,
        treasury_cap: TreasuryCap<HSUI>,  // TreasuryCap을 AdminCap에 통합
    }

    /// 개별 풀 구조체
    public struct Pool has key, store {
        id: UID,
        name: String,
        description: String,
        creator: address,

        // 풀 자산
        sui_balance: Balance<SUI>,
        total_hsui_minted: u64,

        // 풀 설정
        exchange_rate: u64,              // SUI -> hSUI 교환 비율 (basis points)
        fee_rate: u64,                   // 수수료 (basis points, 10000 = 100%)
        is_active: bool,                 // 풀 활성화 상태
        is_public: bool,                 // 공개 풀인지 (누구나 사용 가능)

        // 사용자 잔액 추적
        user_deposits: Table<address, u64>, // 사용자별 SUI 예치량
        user_hsui_minted: Table<address, u64>, // 사용자별 hSUI 발행량

        // 통계
        total_transactions: u64,
        created_at: u64,
        last_updated: u64,
    }

    /// 풀 레지스트리 (모든 풀 관리)
    public struct PoolRegistry has key {
        id: UID,
        pools: Table<String, ID>,        // pool_name -> pool_id
        pool_count: u64,
        admin: address,
    }

    /// 풀 팩토리 (새 풀 생성용)
    public struct PoolFactory has key {
        id: UID,
        admin_cap_id: ID,                // AdminCap 참조
        creation_fee: u64,               // 풀 생성 수수료
        min_initial_deposit: u64,        // 최소 초기 예치금
    }

    /// Events
    public struct PoolCreated has copy, drop {
        pool_id: ID,
        name: String,
        creator: address,
        initial_deposit: u64,
        timestamp: u64,
    }

    public struct Deposited has copy, drop {
        pool_id: ID,
        user: address,
        sui_amount: u64,
        hsui_minted: u64,
        exchange_rate: u64,
        timestamp: u64,
    }

    public struct Withdrawn has copy, drop {
        pool_id: ID,
        user: address,
        hsui_burned: u64,
        sui_returned: u64,
        fee_charged: u64,
        timestamp: u64,
    }

    public struct PoolUpdated has copy, drop {
        pool_id: ID,
        field_name: String,
        new_value: u64,
        timestamp: u64,
    }

    /// 모듈 초기화 (배포 시 한 번 실행)
    fun init(witness: HSUI, ctx: &mut TxContext) {
        // hSUI 토큰 생성
        let (treasury_cap, metadata) = coin::create_currency(
            witness,
            9, // decimals
            b"hSUI",
            b"Hermit SUI",
            b"Liquid staking token for SUI with multi-pool support",
            option::none(),
            ctx
        );

        // Admin capability 생성 (TreasuryCap 포함)
        let admin_cap = AdminCap {
            id: object::new(ctx),
            treasury_cap,
        };

        let admin_cap_id = object::id(&admin_cap);

        // Pool Registry 생성
        let registry = PoolRegistry {
            id: object::new(ctx),
            pools: table::new(ctx),
            pool_count: 0,
            admin: tx_context::sender(ctx),
        };

        // Pool Factory 생성
        let factory = PoolFactory {
            id: object::new(ctx),
            admin_cap_id,
            creation_fee: 100_000_000, // 0.1 SUI
            min_initial_deposit: 1_000_000_000, // 1 SUI
        };

        // 객체들 전송
        transfer::public_transfer(admin_cap, tx_context::sender(ctx));
        transfer::share_object(registry);
        transfer::share_object(factory);
        transfer::public_freeze_object(metadata);
    }

    /// 새로운 풀 생성
    public entry fun create_pool(
        registry: &mut PoolRegistry,
        factory: &PoolFactory,
        admin_cap: &mut AdminCap,
        name: vector<u8>,
        description: vector<u8>,
        exchange_rate: u64,
        fee_rate: u64,
        is_public: bool,
        initial_deposit: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        // 권한 확인
        assert!(object::id(admin_cap) == factory.admin_cap_id, E_UNAUTHORIZED);

        // 유효성 검사
        let deposit_value = coin::value(&initial_deposit);
        assert!(deposit_value >= factory.min_initial_deposit, E_INSUFFICIENT_BALANCE);
        assert!(fee_rate <= 1000, E_INVALID_FEE); // 최대 10% 수수료
        assert!(exchange_rate > 0, E_INVALID_SLIPPAGE);

        let name_str = string::utf8(name);

        // 풀 이름 중복 확인
        assert!(!table::contains(&registry.pools, name_str), E_POOL_EXISTS);

        // 초기 hSUI 발행
        let hsui_to_mint = deposit_value * exchange_rate / 10000;
        let hsui_coin = coin::mint(&mut admin_cap.treasury_cap, hsui_to_mint, ctx);

        // 새 풀 생성
        let mut pool = Pool {
            id: object::new(ctx),
            name: name_str,
            description: string::utf8(description),
            creator: tx_context::sender(ctx),
            sui_balance: coin::into_balance(initial_deposit),
            total_hsui_minted: hsui_to_mint,
            exchange_rate,
            fee_rate,
            is_active: true,
            is_public,
            user_deposits: table::new(ctx),
            user_hsui_minted: table::new(ctx),
            total_transactions: 0,
            created_at: tx_context::epoch_timestamp_ms(ctx),
            last_updated: tx_context::epoch_timestamp_ms(ctx),
        };

        let pool_id = object::id(&pool);

        // 생성자 데이터 기록
        table::add(&mut pool.user_deposits, tx_context::sender(ctx), deposit_value);
        table::add(&mut pool.user_hsui_minted, tx_context::sender(ctx), hsui_to_mint);

        // 레지스트리에 등록
        table::add(&mut registry.pools, name_str, pool_id);
        registry.pool_count = registry.pool_count + 1;

        // hSUI를 생성자에게 전송
        transfer::public_transfer(hsui_coin, tx_context::sender(ctx));

        // 풀을 공유 객체로 만들기
        transfer::share_object(pool);

        // 이벤트 발행
        event::emit(PoolCreated {
            pool_id,
            name: name_str,
            creator: tx_context::sender(ctx),
            initial_deposit: deposit_value,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    /// SUI 예치하여 hSUI 받기 (스테이킹)
    public entry fun deposit_to_pool(
        pool: &mut Pool,
        admin_cap: &mut AdminCap,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        // 풀 상태 확인
        assert!(pool.is_active, E_POOL_PAUSED);

        // 공개 풀이 아닌 경우 창작자만 사용 가능
        if (!pool.is_public) {
            assert!(tx_context::sender(ctx) == pool.creator, E_UNAUTHORIZED);
        };

        let deposit_amount = coin::value(&payment);
        assert!(deposit_amount > 0, E_ZERO_AMOUNT);

        let user = tx_context::sender(ctx);

        // hSUI 발행량 계산
        let hsui_to_mint = deposit_amount * pool.exchange_rate / 10000;

        // SUI를 풀에 추가
        balance::join(&mut pool.sui_balance, coin::into_balance(payment));

        // hSUI 발행
        let hsui_coin = coin::mint(&mut admin_cap.treasury_cap, hsui_to_mint, ctx);

        // 사용자 데이터 업데이트
        if (table::contains(&pool.user_deposits, user)) {
            let current_deposit = table::borrow_mut(&mut pool.user_deposits, user);
            *current_deposit = *current_deposit + deposit_amount;

            let current_hsui = table::borrow_mut(&mut pool.user_hsui_minted, user);
            *current_hsui = *current_hsui + hsui_to_mint;
        } else {
            table::add(&mut pool.user_deposits, user, deposit_amount);
            table::add(&mut pool.user_hsui_minted, user, hsui_to_mint);
        };

        // 풀 통계 업데이트
        pool.total_hsui_minted = pool.total_hsui_minted + hsui_to_mint;
        pool.total_transactions = pool.total_transactions + 1;
        pool.last_updated = tx_context::epoch_timestamp_ms(ctx);

        // hSUI를 사용자에게 전송
        transfer::public_transfer(hsui_coin, user);

        // 이벤트 발행
        event::emit(Deposited {
            pool_id: object::id(pool),
            user,
            sui_amount: deposit_amount,
            hsui_minted: hsui_to_mint,
            exchange_rate: pool.exchange_rate,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    /// hSUI 소각하여 SUI 받기 (언스테이킹)
    public entry fun withdraw_from_pool(
        pool: &mut Pool,
        admin_cap: &mut AdminCap,
        hsui_coin: Coin<HSUI>,
        ctx: &mut TxContext
    ) {
        // 풀 상태 확인
        assert!(pool.is_active, E_POOL_PAUSED);

        let hsui_amount = coin::value(&hsui_coin);
        assert!(hsui_amount > 0, E_ZERO_AMOUNT);

        let user = tx_context::sender(ctx);

        // SUI 반환량 계산 (교환 비율 + 수수료 적용)
        let base_sui_amount = hsui_amount * 10000 / pool.exchange_rate;
        let fee_amount = base_sui_amount * pool.fee_rate / 10000;
        let sui_to_return = base_sui_amount - fee_amount;

        // 풀에 충분한 SUI가 있는지 확인
        assert!(balance::value(&pool.sui_balance) >= sui_to_return, E_INSUFFICIENT_BALANCE);

        // hSUI 소각
        coin::burn(&mut admin_cap.treasury_cap, hsui_coin);

        // 사용자 데이터 업데이트
        if (table::contains(&pool.user_hsui_minted, user)) {
            let current_hsui = table::borrow_mut(&mut pool.user_hsui_minted, user);
            if (*current_hsui >= hsui_amount) {
                *current_hsui = *current_hsui - hsui_amount;
            };
        };

        // SUI 출금
        let sui_balance = balance::split(&mut pool.sui_balance, sui_to_return);
        let sui_coin = coin::from_balance(sui_balance, ctx);

        // 풀 통계 업데이트
        pool.total_hsui_minted = pool.total_hsui_minted - hsui_amount;
        pool.total_transactions = pool.total_transactions + 1;
        pool.last_updated = tx_context::epoch_timestamp_ms(ctx);

        // SUI를 사용자에게 전송
        transfer::public_transfer(sui_coin, user);

        // 이벤트 발행
        event::emit(Withdrawn {
            pool_id: object::id(pool),
            user,
            hsui_burned: hsui_amount,
            sui_returned: sui_to_return,
            fee_charged: fee_amount,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    /// 풀 설정 업데이트 (관리자만)
    public entry fun update_pool_settings(
        pool: &mut Pool,
        _admin_cap: &AdminCap,
        new_exchange_rate: Option<u64>,
        new_fee_rate: Option<u64>,
        new_active_status: Option<bool>,
        ctx: &mut TxContext
    ) {
        // 권한 확인 (풀 창작자 또는 시스템 관리자)
        assert!(
            tx_context::sender(ctx) == pool.creator,
            E_UNAUTHORIZED
        );

        // 교환 비율 업데이트
        if (option::is_some(&new_exchange_rate)) {
            let rate = *option::borrow(&new_exchange_rate);
            assert!(rate > 0, E_INVALID_SLIPPAGE);
            pool.exchange_rate = rate;

            event::emit(PoolUpdated {
                pool_id: object::id(pool),
                field_name: string::utf8(b"exchange_rate"),
                new_value: rate,
                timestamp: tx_context::epoch_timestamp_ms(ctx),
            });
        };

        // 수수료 업데이트
        if (option::is_some(&new_fee_rate)) {
            let fee = *option::borrow(&new_fee_rate);
            assert!(fee <= 1000, E_INVALID_FEE); // 최대 10%
            pool.fee_rate = fee;

            event::emit(PoolUpdated {
                pool_id: object::id(pool),
                field_name: string::utf8(b"fee_rate"),
                new_value: fee,
                timestamp: tx_context::epoch_timestamp_ms(ctx),
            });
        };

        // 활성화 상태 업데이트
        if (option::is_some(&new_active_status)) {
            pool.is_active = *option::borrow(&new_active_status);

            event::emit(PoolUpdated {
                pool_id: object::id(pool),
                field_name: string::utf8(b"is_active"),
                new_value: if (pool.is_active) { 1 } else { 0 },
                timestamp: tx_context::epoch_timestamp_ms(ctx),
            });
        };

        pool.last_updated = tx_context::epoch_timestamp_ms(ctx);
    }

    /// 풀에서 수수료 수익 인출 (풀 창작자만)
    public entry fun withdraw_pool_fees(
        pool: &mut Pool,
        amount: u64,
        ctx: &mut TxContext
    ) {
        // 권한 확인
        assert!(tx_context::sender(ctx) == pool.creator, E_UNAUTHORIZED);
        assert!(amount > 0, E_ZERO_AMOUNT);

        // 풀에 충분한 잔액 확인
        assert!(balance::value(&pool.sui_balance) >= amount, E_INSUFFICIENT_BALANCE);

        // 수수료 인출
        let fee_balance = balance::split(&mut pool.sui_balance, amount);
        let fee_coin = coin::from_balance(fee_balance, ctx);

        transfer::public_transfer(fee_coin, tx_context::sender(ctx));
    }

    /// Emergency: 관리자가 특정 풀 비활성화
    public entry fun emergency_pause_pool(
        pool: &mut Pool,
        _admin_cap: &AdminCap,
        _ctx: &mut TxContext
    ) {
        pool.is_active = false;
    }

    /// View functions
    public fun get_pool_info(pool: &Pool): (String, String, address, u64, u64, u64, u64, bool, bool) {
        (
            pool.name,
            pool.description,
            pool.creator,
            balance::value(&pool.sui_balance),
            pool.total_hsui_minted,
            pool.exchange_rate,
            pool.fee_rate,
            pool.is_active,
            pool.is_public
        )
    }

    public fun get_user_pool_balance(pool: &Pool, user: address): (u64, u64) {
        let deposits = if (table::contains(&pool.user_deposits, user)) {
            *table::borrow(&pool.user_deposits, user)
        } else {
            0
        };

        let hsui_minted = if (table::contains(&pool.user_hsui_minted, user)) {
            *table::borrow(&pool.user_hsui_minted, user)
        } else {
            0
        };

        (deposits, hsui_minted)
    }

    public fun get_pool_stats(pool: &Pool): (u64, u64, u64) {
        (
            pool.total_transactions,
            pool.created_at,
            pool.last_updated
        )
    }

    public fun get_registry_info(registry: &PoolRegistry): (u64, address) {
        (registry.pool_count, registry.admin)
    }

    public fun calculate_hsui_output(pool: &Pool, sui_amount: u64): u64 {
        sui_amount * pool.exchange_rate / 10000
    }

    public fun calculate_sui_output(pool: &Pool, hsui_amount: u64): (u64, u64) {
        let base_amount = hsui_amount * 10000 / pool.exchange_rate;
        let fee = base_amount * pool.fee_rate / 10000;
        (base_amount - fee, fee)
    }

    /// Test-only functions
    #[test_only]
    public fun test_init(ctx: &mut TxContext) {
        init(HSUI {}, ctx);
    }
}