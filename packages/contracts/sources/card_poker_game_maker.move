module leviathan::card_poker_game_maker {
  use std::string::String;
  use sui::object::{new, id};
  use sui::event;
  use sui::coin::{Self as coin, Coin};
  use sui::sui::SUI;
  use sui::random;

  public struct CardPokerTemplate has key, store {
      id: UID,
      creator: address,
      name: String,
      description: String,
      meta_uri: String,

      num_suits: u8,
      ranks_per_suit: u8,
      cards_per_hand: u8,
      combination_size: u8,
      victory_mode: u8,

      stake_amount: u64,
      launch_fee: u64,

      created_at: u64,
      is_active: bool,
  }

  public entry fun create_card_poker_template(
      name: String,
      description: String,
      meta_uri: String,
      num_suits: u8,
      ranks_per_suit: u8,
      cards_per_hand: u8,
      combination_size: u8,
      victory_mode: u8,
      stake_amount: u64,
      launch_fee: u64,
      ctx: &mut TxContext
  ) {
      assert!(combination_size > 0u8 && combination_size <= cards_per_hand, 1);
      let template = CardPokerTemplate {
          id: new(ctx),
          creator: tx_context::sender(ctx),
          name,
          description,
          meta_uri,
          num_suits,
          ranks_per_suit,
          cards_per_hand,
          combination_size,
          victory_mode,
          stake_amount,
          launch_fee,
          created_at: tx_context::epoch_timestamp_ms(ctx),
          is_active: true,
      };
      event::emit(TemplateCreated {
          template_id: id(&template),
          creator: template.creator,
          timestamp: template.created_at
      });
      transfer::share_object(template)
  }

  public struct TemplateCreated has copy, drop {
      template_id: ID,
      creator: address,
      timestamp: u64
  }

  /// Public getter functions for card_poker_game_launcher module
  public fun is_template_active(template: &CardPokerTemplate): bool {
      template.is_active
  }

  public fun get_template_stake_amount(template: &CardPokerTemplate): u64 {
      template.stake_amount
  }

  public fun get_num_suits(template: &CardPokerTemplate): u8 {
      template.num_suits
  }

  public fun get_ranks_per_suit(template: &CardPokerTemplate): u8 {
      template.ranks_per_suit
  }

  public fun get_cards_per_hand(template: &CardPokerTemplate): u8 {
      template.cards_per_hand
  }

  public fun get_combination_size(template: &CardPokerTemplate): u8 {
      template.combination_size
  }

  public fun get_victory_mode(template: &CardPokerTemplate): u8 {
      template.victory_mode
  }

  /// View functions
  public fun get_template_info(template: &CardPokerTemplate): (String, String, u8, u8, u8, u8, u8, u64) {
      (template.name, template.description, template.num_suits, template.ranks_per_suit,
       template.cards_per_hand, template.combination_size, template.victory_mode, template.stake_amount)
  }

  public fun get_template_creator(template: &CardPokerTemplate): address {
      template.creator
  }
}