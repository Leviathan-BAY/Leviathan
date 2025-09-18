#[test_only]
module leviathan::hermit_finance_tests {
    use leviathan::hermit_finance::{Self, Vault, AdminCap, HSUI};
    use sui::test_scenario::{Self, next_tx, ctx};
    use sui::coin::{Self, TreasuryCap};
    use sui::sui::SUI;
    use sui::test_utils::assert_eq;

    const ADMIN: address = @0xAD;
    const USER: address = @0xAA;

    #[test]
    fun test_init() {
        let scenario = test_scenario::begin(ADMIN);
        {
            hermit_finance::test_init(ctx(&mut scenario));
        };

        next_tx(&mut scenario, ADMIN);
        {
            // Verify admin cap exists
            assert!(test_scenario::has_most_recent_for_sender<AdminCap>(&scenario));

            // Verify treasury cap exists
            assert!(test_scenario::has_most_recent_for_sender<TreasuryCap<HSUI>>(&scenario));

            // Verify vault is shared
            assert!(test_scenario::has_most_recent_shared<Vault>(&scenario));
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_deposit_and_withdraw() {
        let scenario = test_scenario::begin(ADMIN);
        let deposit_amount = 1000000000; // 1 SUI

        // Initialize
        {
            hermit_finance::test_init(ctx(&mut scenario));
        };

        // User deposits SUI
        next_tx(&mut scenario, USER);
        {
            let vault = test_scenario::take_shared<Vault>(&scenario);
            let treasury = test_scenario::take_from_sender<TreasuryCap<HSUI>>(&mut scenario);

            // Create SUI coin for deposit
            let sui_coin = coin::mint_for_testing<SUI>(deposit_amount, ctx(&mut scenario));

            // Deposit SUI
            hermit_finance::deposit(&mut vault, &mut treasury, sui_coin, ctx(&mut scenario));

            // Verify vault balance
            assert_eq(hermit_finance::vault_sui_balance(&vault), deposit_amount);
            assert_eq(hermit_finance::vault_hsui_supply(&vault), deposit_amount);

            test_scenario::return_shared(vault);
            test_scenario::return_to_sender(&mut scenario, treasury);
        };

        // Verify user received hSUI
        next_tx(&mut scenario, USER);
        {
            let hsui_coin = test_scenario::take_from_sender<coin::Coin<HSUI>>(&mut scenario);
            assert_eq(coin::value(&hsui_coin), deposit_amount);
            test_scenario::return_to_sender(&mut scenario, hsui_coin);
        };

        // User withdraws hSUI
        next_tx(&mut scenario, USER);
        {
            let vault = test_scenario::take_shared<Vault>(&scenario);
            let treasury = test_scenario::take_from_address<TreasuryCap<HSUI>>(&mut scenario, ADMIN);
            let hsui_coin = test_scenario::take_from_sender<coin::Coin<HSUI>>(&mut scenario);

            // Withdraw SUI
            hermit_finance::withdraw(&mut vault, &mut treasury, hsui_coin, ctx(&mut scenario));

            // Verify vault is empty
            assert_eq(hermit_finance::vault_sui_balance(&vault), 0);
            assert_eq(hermit_finance::vault_hsui_supply(&vault), 0);

            test_scenario::return_shared(vault);
            test_scenario::return_to_address(&mut scenario, treasury, ADMIN);
        };

        // Verify user received SUI back
        next_tx(&mut scenario, USER);
        {
            let sui_coin = test_scenario::take_from_sender<coin::Coin<SUI>>(&mut scenario);
            assert_eq(coin::value(&sui_coin), deposit_amount);
            test_scenario::return_to_sender(&mut scenario, sui_coin);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_pause_functionality() {
        let scenario = test_scenario::begin(ADMIN);

        // Initialize
        {
            hermit_finance::test_init(ctx(&mut scenario));
        };

        // Admin pauses vault
        next_tx(&mut scenario, ADMIN);
        {
            let vault = test_scenario::take_shared<Vault>(&scenario);
            let admin_cap = test_scenario::take_from_sender<AdminCap>(&mut scenario);

            hermit_finance::set_pause_status(&admin_cap, &mut vault, true);
            assert!(hermit_finance::vault_is_paused(&vault));

            test_scenario::return_shared(vault);
            test_scenario::return_to_sender(&mut scenario, admin_cap);
        };

        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = hermit_finance::E_ZERO_AMOUNT)]
    fun test_deposit_zero_amount_fails() {
        let scenario = test_scenario::begin(ADMIN);

        // Initialize
        {
            hermit_finance::test_init(ctx(&mut scenario));
        };

        // Try to deposit zero amount
        next_tx(&mut scenario, USER);
        {
            let vault = test_scenario::take_shared<Vault>(&scenario);
            let treasury = test_scenario::take_from_address<TreasuryCap<HSUI>>(&mut scenario, ADMIN);

            let zero_coin = coin::zero<SUI>(ctx(&mut scenario));
            hermit_finance::deposit(&mut vault, &mut treasury, zero_coin, ctx(&mut scenario));

            test_scenario::return_shared(vault);
            test_scenario::return_to_address(&mut scenario, treasury, ADMIN);
        };

        test_scenario::end(scenario);
    }
}