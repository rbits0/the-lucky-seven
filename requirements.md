# Requirements



## Terminology
- Adjacent refers only to adjacent in one axis, not diagonals, unless otherwise specified.



## Description of a Game State
- Cards can be player card or enemy card.
- Each card has a different type.
    - There are 8 player card types.
- Each card type can have different behaviour.
- There can only be one of each player card type.
- Each card has a strength.
    - Player strength is its default attack power.
    - Enemy strength is its default health.
    - Tanks, mortars, and flares do not have a strength (this can be represented as a strength of -1 in the application).
- Each player card has an effective strength.
    - Only used for hammer and anvil cards.
    - Defaults to the card's strength.
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
- (Low Priority) All randomness should be able to be set by a seed.
    - Given the same seed, the state after the game has started should be exactly the same.


### Encounter
- Exactly one enemy card is dealt for each row, from the top of the deck.
    - NOTE: Top of the deck may correspond to the end of the JavaScript list.
    - The enemy on the first row should be the top card, the second row the card below the top card, etc.
    - The enemy can only be placed in that row - it cannot be placed in any other row.
    - If the deck is empty, don't deal any enemies.
- If the card is a tank:
    - The card is placed in the tank column.
- If the card is a mortar or flare:
    - The card is placed in its associated column.
    - If there is already a card there, it is placed on top of the existing card.
    - If the card is a mortar, once the card is placed:
        - If the mortar is on a player card, the player card is flipped down AND rotated.
        - All adjacent player cards are flipped down.
        - The mortar is then discarded
        - NOTE: While this differs from the official rules, this action can be taken in the transition from Encounter to Maneuver phase instead, since the end result should be the same. This can be done to make it more clear to the player what is happening.
- If the card is an infantry or machine gun:
    - If there is no card in the associated column, it is placed there.
    - If there is a card there, it places in the closest empty cell to the associated column.
        - If there are multiple empty cells with the same distance to the cell, the cell closest to the center should be chosen.
        - eg. If the closest cells are column 1 and 3, the card should be placed in column 3.
        - The cells in the tank column are not valid empty cells for non-tank cards
    - If there is no empty cell in the row, but there is a player card in the row:
        - One of the player cards is chosen according to the same rules as for an empty cell (above).
        - If there is a player card in the associated column, that one is be chosen.
        - The player card is then discarded, and the enemy card is placed there.
    - If there is no empty cell in the row, and there is no player card in the row (ie. the row is full of enemies):
        - The card is discarded - no new card is placed in that row.

### Maneuver
- This phase involves user interaction.
- The user may click on a card that has an available action to select it.
    - If the card has no available action, the card cannot be clicked, and the card is unselected.
- Each player card that is not rotated *may* take one of the following actions (performed by the player):
    - Move to adjacent or diagonally adjacent empty cell, if the card is flipped up.
        - This is performed by dragging the card to the empty cell.
        - A player card may not move diagonally between two enemy cards adjacent to the player.
            - This includes flares that are on another card, even if it is on a player card.
            - This restriction does not apply to only adjacent player cards, or one player card and one enemy card.
        - Two player cards may be moved at the same time to swap their positions.
            - This rotates *both* cards.
        - Cells in the tank column do not count as valid empty cells for non-tank cards.
    - Flip.
        - This is performed on the selected player by pressing the flip button, if the selected card can flip.
        - If the selected player is flipped up, it will flip down.
        - If the player is flipped down but adjacent to a player that is flipped up.
            - This does not count as taking an action for the other player.
        - If no player is selected, or the player is flipped down but not adjacent to a player that is flipped up, this action cannot be performed.
            - The flip button is disabled.
- After a player card takes an action, the card is rotated so that it cannot take another action this turn.

- There are a number of exceptions to the above rules/additional behaviour, according to the specific behaviour of each card:

#### The Athlete
- Can move twice when moving
    - In the application, this can be represented as a "half-rotate" after the first move
    - This does not include flipping up or flipping down. It may not, for example, move and then flip down, or flip up and then move.
    - The Athlete may be used to flip up adjacent player cards each time it moves.
    - The Athlete may swap with a player card each time it moves.

#### The Leader
- Allows diagonally adjacent player cards to flip up (in addition to the regular behaviour of allowing adjacent player cards to flip up).
    - It still applies that this card must be flipped up.
- Can flip up without an adjacent player card.

#### The Mouse
- Can flip down after moving.
    - It is unclear whether this can only be done immediately after moving, or if it can be done at any point after moving. For the purpose of this application, we will assume that it can be done at any point after moving, as long as the game is still in the Maneuver phase.
    - NOTE: It can only flip down after *moving*, it is not about whether it is flipped down. For example, it can't flip up and then flip down. This may not be important, since this shouldn't allow any 
- Can move even if flipped down.

#### Flare
- The player card that the flare is on may not move.
    - This includes swapping.
    - It still applies that other player cards may not move here.
    - The player card may still flip up or down.
- This card is discarded at the end of the phase.


### Attack
- This phase involves user interaction.
- All enemy cards' health is reset to their strength at the start of this phase.
- All player cards are unrotated at the start of this phase.
- If a player card is flipped down, its effective strength is 0.
- Each player card that is up and unrotated *may* attack ONE adjacent enemy (performed by the player).
    - This is performed by clicking (selecting) the player card, then clicking the enemy card.
        - The card cannot be clicked if it cannot attack.
    - Attacking an enemy subtracts the effective strength of the player card from the enemy card's health.
    - If *after attacking an enemy* the enemy's health is 0, the enemy card is discarded.
    - After attacking, the player card is rotated to indicate that it has already attacked.
    - After attacking, the player card is unselected.
    - A card with an effective strength of 0 cannot attack.
- Enemies without a strength (such as tanks) cannot be attacked.

#### The Anvil AND The Hammer
- Has strength 2 instead of 1 when the pacifist is adjacent and up.
    - If the pacifist is adjacent to both the anvil and the hammer, they both will have a strength of 2.

#### The Joker
- Reduces the health of each adjacent enemy by 1.
    - This does not count as an attack.
    - Even if the joker reduces an enemy's health to 0, it cannot discard it, since an enemy card needs to be attacked to be discarded.

#### The Natural
- Can attack diagonally adjacent enemies.
    - The rule for diagonal movement does not apply here - it can still attack an enemy even if the enemy is diagonally between two enemies that are adjacent to the natural.

#### The Mouse
- Can attack even if flipped down.
    - Its effective strength is still 1, even if flipped down.


### Counter-Attack
- Do actions for enemy cards still remaining on the board.
- If there are no player cards on the board at the end of the phase, the game is lost.
- After this phase, return to the encounter phase.
- After this phase, if it is the last turn, determine whether the game is won or lost
    - Display a message telling the player whether they won or lost.
    - Have a button to start a new game.
        - Completely reset everything.
    - Have a button to view the board state.

#### Infantry
- Discard all adjacent player cards.

#### Machine Gun
- Discard all adjacent player cards that are flipped up.

#### Tank
- Discard all player cards in this row that are up.
- Then discard this card.



## Undo
- Pressing the undo button returns the game to the state before the user took their latest action.
    - Pressing it a second time returns to the state before the previous action, etc.
- Undo can only go 3 actions back.
- Changing phase counts as an action.



## Other
- The current phase is displayed at all times
- The number of turns left before the game ends is displayed at all times.