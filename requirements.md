# Requirements

## Description of a Game State
- Cards can be player card or enemy card.
- Each card has a different type.
    - There are 8 player card types.
- Each card type can have different behaviour.
- There can only be one of each player card type.
- Each card has a strength.
    - Player strength is its default attack power.
    - Enemy strength is its default health.
- Each player card has an effective strength.
    - Only used for hammer and anvil cards.
    - Defaults to the card's strength
- Player cards can be up or down.
- Player cards can be unrotated or rotated.
- Athlete card can be half-rotated instead.
- Each enemy card has health.
- The default health for enemy cards is the card's strength.
- Each enemy card has an associated column (1-6 for all enemies except Tank, which is 0)

- There is 6x4 board (plus 1 Tank column at the start).
- Each cell can contain:
    - Nothing
    - 1 card
    - 1 card with 1 other card on top
        - Only the mortar or the flare can be on top.
- The same card cannot be in the grid multiple times.
    - To clarify, the same card *type* can exist multiple times, just not the same card.
- The cells in the 6x4 board cannot contain tanks.
- The only card that the cells in the Tank column can contain are Tank cards.

- There is a variable length ordered deck of enemy cards.
- All cards in the deck have their default health.
- The same card cannot be in the deck multiple times.
- The same card cannot be in the grid and in the deck at the same time.

- There are 5 phases that the game can be in.
    - The phase names describe the event that happens when entering the phase, or the actions that can be taken during the phase. They are:
        - Game Start
        - Encounter
        - Maneuver
        - Attack
        - Counter-Attack
- The game is always in exactly one phase.

- The game can be in progress, won, or lost.

- There is a history which is a variable length list of previous game states.
- The states in the history do not contain history themselves.
- The history has a limit of 3 states.
- The history does not include the current state.
- The history is empty by default.

## Phases
- When entering a phase, certain actions are carried out.
- The user can do certain actions depending on the current phase.
- The initial phase is Game Start

### Game Start
- When the game starts, player cards are dealt to the board according to these steps:
    - One of the row cards are assigned to each row in a random order
        - Each row card can only be assigned to one row
        - The row cards are:
            - 1, 2
            - 3, 4
            - 5, 6
            - 7, 8
    - One of the column card are assigned to each column in a random order
        - A card is not assigned to the Tank column
        - Each column card can only be assigned to one column
        - The column cards are
            - 1, 6
            - 2
            - 3, 7
            - 4
            - 5, 8
            - `-`
    - The 8 player cards are put in a list
    - Each player card is initially up, unrotated, and has their default effective strength.
    - The player cards are randomly shuffled.
    - The player cards are placed on the board according to the order in the shuffled cards. For the nth card:
        - The card is placed in the cell where its row card and column card both have the number n.
    - The card that is placed last is removed from the board.
    - All player cards surrounding the removed card are flipped down.
- When the game starts, all the enemy cards are put into the deck.
- The deck is then shuffled.