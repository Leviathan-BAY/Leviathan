module leviathan::card_poker_game_launcher {
  use std::string::String;
  use sui::object::{new, id};
  use sui::event;
  use sui::coin::{Self as coin, Coin};
  use sui::sui::SUI;
  use sui::random;

  use leviathan::card_poker_game_maker::{Self, CardPokerTemplate};

  public struct PokerGameInstance has key, store {
      id: UID,
      template_id: ID,
      players: vector<address>,
      deck: vector<u8>,
      hands: vector<vector<u8>>,
      pot: Coin<SUI>,
      started: bool,
      ended: bool,
      winners: vector<address>,
  }

  public struct GameCreated has copy, drop {
      game_id: ID,
      template_id: ID
  }

  public struct GameEnded has copy, drop {
      game_id: ID,
      winners: vector<address>
  }

  /// =======================
  /// === GAME CREATION ====
  /// =======================
  public entry fun create_game_instance(
      template: &CardPokerTemplate,
      ctx: &mut tx_context::TxContext
  ) {
      let inst = PokerGameInstance {
          id: new(ctx),
          template_id: id(template),
          players: vector::empty<address>(),
          deck: vector::empty<u8>(),
          hands: vector::empty<vector<u8>>(),
          pot: coin::zero<SUI>(ctx),
          started: false,
          ended: false,
          winners: vector::empty<address>()
      };
      event::emit(GameCreated {
          game_id: id(&inst),
          template_id: id(template)
      });
      transfer::share_object(inst)
  }

  /// =======================
  /// === PLAYER JOIN =======
  /// =======================
  public entry fun join_game(
      inst: &mut PokerGameInstance,
      mut stake: Coin<SUI>,
      ctx: &mut tx_context::TxContext
  ) {
      assert!(!inst.started && !inst.ended, 10);
      vector::push_back(&mut inst.players, tx_context::sender(ctx));
      coin::join(&mut inst.pot, stake);
  }

  /// =======================
  /// === START GAME ========
  /// =======================
  public entry fun start_game(
      inst: &mut PokerGameInstance,
      template: &CardPokerTemplate,
      r: &random::Random,
      ctx: &mut tx_context::TxContext
  ) {
      assert!(!inst.started && !inst.ended, 20);
      inst.deck = new_deck(
          card_poker_game_maker::get_num_suits(template),
          card_poker_game_maker::get_ranks_per_suit(template)
      );
      shuffle(&mut inst.deck, r, ctx);
      inst.hands = deal_hands(
          &mut inst.deck,
          vector::length(&inst.players),
          card_poker_game_maker::get_cards_per_hand(template)
      );
      inst.started = true;
  }

  /// =======================
  /// === FINALIZE ==========
  /// =======================
  public entry fun finalize(
      inst: &mut PokerGameInstance,
      template: &CardPokerTemplate,
      _ctx: &mut tx_context::TxContext
  ) {
      assert!(inst.started && !inst.ended, 30);
      inst.winners = evaluate_all(
          &inst.players,
          &inst.hands,
          card_poker_game_maker::get_combination_size(template),
          card_poker_game_maker::get_victory_mode(template),
          card_poker_game_maker::get_ranks_per_suit(template)
      );
      inst.ended = true;
      event::emit(GameEnded {
          game_id: id(inst),
          winners: inst.winners
      });
  }

  /// =======================
  /// === HELPERS ===========
  /// =======================

  fun new_deck(num_suits: u8, ranks_per_suit: u8): vector<u8> {
      let mut deck = vector::empty<u8>();
      let mut s: u8 = 0u8;
      while (s < num_suits) {
          let mut r: u8 = 0u8;
          while (r < ranks_per_suit) {
              let card_id: u8 = s * ranks_per_suit + r;
              vector::push_back(&mut deck, card_id);
              r = r + 1;
          };
          s = s + 1;
      };
      deck
  }

  public fun shuffle(deck: &mut vector<u8>, r: &random::Random, ctx: &mut TxContext) {
      let mut g = random::new_generator(r, ctx);
      let mut i = vector::length(deck);

      while (i > 1) {
          let j = random::generate_u64_in_range(&mut g, 0, i - 1);

          let tmp = *vector::borrow(deck, i - 1);
          *vector::borrow_mut(deck, i - 1) = *vector::borrow(deck, j);
          *vector::borrow_mut(deck, j) = tmp;

          i = i - 1;
      }
  }

  fun deal_hands(deck: &mut vector<u8>, num_players: u64, cards_per_hand: u8): vector<vector<u8>> {
      let mut hands = vector::empty<vector<u8>>();
      let mut p = 0;
      while (p < num_players) {
          let mut h = vector::empty<u8>();
          let mut c = 0;
          while (c < (cards_per_hand as u64)) {
              let card = vector::pop_back(deck);
              vector::push_back(&mut h, card);
              c = c + 1;
          };
          vector::push_back(&mut hands, h);
          p = p + 1;
      };
      hands
  }

  fun evaluate_all(players: &vector<address>, hands: &vector<vector<u8>>, combination_size: u8, victory_mode: u8, ranks_per_suit: u8): vector<address> {
      let mut winners = vector::empty<address>();
      let mut best_score: u64 = 0;
      let n = vector::length(players);
      let mut i = 0;
      while (i < n) {
          let score = if (victory_mode == 0u8) {
              evaluate_hand(vector::borrow(hands, i), combination_size, ranks_per_suit)
          } else {
              highcard_sum(vector::borrow(hands, i), ranks_per_suit)
          };
          if (score > best_score) {
              best_score = score;
              winners = vector::empty<address>();
              vector::push_back(&mut winners, *vector::borrow(players, i));
          } else if (score == best_score) {
              vector::push_back(&mut winners, *vector::borrow(players, i));
          };
          i = i + 1;
      };
      winners
  }

  fun evaluate_hand(hand: &vector<u8>, _combination_size: u8, ranks_per_suit: u8): u64 {
      let n = vector::length(hand);
      let mut best: u64 = 0;

      // 브루트포스로 5장 조합 생성
      let mut i = 0;
      while (i < n - 4) {
          let mut j = i + 1;
          while (j < n - 3) {
              let mut k = j + 1;
              while (k < n - 2) {
                  let mut l = k + 1;
                  while (l < n - 1) {
                      let mut m = l + 1;
                      while (m < n) {
                          let score = score_five_cards(
                              *vector::borrow(hand, i),
                              *vector::borrow(hand, j),
                              *vector::borrow(hand, k),
                              *vector::borrow(hand, l),
                              *vector::borrow(hand, m),
                              ranks_per_suit,
                          );
                          if (score > best) best = score;
                          m = m + 1;
                      };
                      l = l + 1;
                  };
                  k = k + 1;
              };
              j = j + 1;
          };
          i = i + 1;
      };

      best
  }
  

  fun score_five_cards(a: u8, b: u8, c: u8, d: u8, e: u8, ranks_per_suit: u8): u64 {
      let mut cards = vector::empty<u8>();
      vector::push_back(&mut cards, a);
      vector::push_back(&mut cards, b);
      vector::push_back(&mut cards, c);
      vector::push_back(&mut cards, d);
      vector::push_back(&mut cards, e);

      // === 1. rank, suit 분리 ===
      let mut ranks = vector::empty<u8>();
      let mut suits = vector::empty<u8>();
      let mut i = 0;
      while (i < 5) {
          let id = *vector::borrow(&cards, i);
          let r = id % ranks_per_suit;
          let s = id / ranks_per_suit;
          vector::push_back(&mut ranks, r);
          vector::push_back(&mut suits, s);
          i = i + 1;
      };

      // === 2. ranks 정렬 (내림차순) ===
      sort_desc(&mut ranks);

      // === 3. Flush 체크 ===
      let first_suit = *vector::borrow(&suits, 0);
      let mut is_flush = true;
      let mut j = 1;
      while (j < 5) {
          if (*vector::borrow(&suits, j) != first_suit) {
              is_flush = false;
              break;
          };
          j = j + 1;
      };

      // === 4. Straight 체크 ===
      let mut is_straight = true;
      let mut k = 0;
      while (k < 4) {
          if (*vector::borrow(&ranks, k) != (*vector::borrow(&ranks, k+1) + 1)) {
              is_straight = false;
              break;
          };
          k = k + 1;
      };

      // === 5. 빈도수 카운트 (pair, set 판별) ===
      let mut counts = vector::empty<u8>();
      let mut unique_ranks = vector::empty<u8>();
      i = 0;
      while (i < 5) {
          let r = *vector::borrow(&ranks, i);
          let mut found = false;
          let mut idx = 0;
          while (idx < vector::length(&unique_ranks)) {
              if (*vector::borrow(&unique_ranks, idx) == r) {
                  let cnt_ref = vector::borrow_mut(&mut counts, idx);
                  *cnt_ref = *cnt_ref + 1;
                  found = true;
                  break;
              };
              idx = idx + 1;
          };
          if (!found) {
              vector::push_back(&mut unique_ranks, r);
              vector::push_back(&mut counts, 1);
          };
          i = i + 1;
      };

      // === 6. 핸드 랭크 결정 ===
      let mut hand_rank: u64 = 0;
      if (is_straight && is_flush) {
          hand_rank = 8;
      } else if (has_count(&counts, 4)) {
          hand_rank = 7;
      } else if (has_count(&counts, 3) && has_count(&counts, 2)) {
          hand_rank = 6;
      } else if (is_flush) {
          hand_rank = 5;
      } else if (is_straight) {
          hand_rank = 4;
      } else if (has_count(&counts, 3)) {
          hand_rank = 3;
      } else if (count_pairs(&counts) == 2) {
          hand_rank = 2;
      } else if (count_pairs(&counts) == 1) {
          hand_rank = 1;
      } else {
          hand_rank = 0;
      };

      // === 7. kicker 계산 ===
      let mut kicker: u64 = 0;
      i = 0;
      while (i < 5) {
          kicker = kicker * 16 + (*vector::borrow(&ranks, i) as u64);
          i = i + 1;
      };

      (hand_rank << 48) | kicker
  }

  fun has_count(counts: &vector<u8>, target: u8): bool {
      let mut i = 0;
      while (i < vector::length(counts)) {
          if (*vector::borrow(counts, i) == target) return true;
          i = i + 1;
      };
      false
  }

  fun count_pairs(counts: &vector<u8>): u8 {
      let mut c = 0;
      let mut i = 0;
      while (i < vector::length(counts)) {
          if (*vector::borrow(counts, i) == 2) c = c + 1;
          i = i + 1;
      };
      c
  }

  // 단순 버블 정렬 (내림차순)
  fun sort_desc(v: &mut vector<u8>) {
      let n = vector::length(v);
      let mut i = 0;
      while (i < n) {
          let mut j = 0;
          while (j + 1 < n - i) {
              let a = *vector::borrow(v, j);
              let b = *vector::borrow(v, j+1);
              if (a < b) {
                  *vector::borrow_mut(v, j) = b;
                  *vector::borrow_mut(v, j+1) = a;
              };
              j = j + 1;
          };
          i = i + 1;
      };
  }


  fun highcard_sum(hand: &vector<u8>,  ranks_per_suit: u8): u64 {
      let mut sum: u64 = 0;
      let mut i = 0;
      while (i < vector::length(hand)) {
          let rank = (*vector::borrow(hand, i)) % ranks_per_suit;
          sum = sum + (rank as u64);
          i = i + 1;
      };
      sum
  }
}
