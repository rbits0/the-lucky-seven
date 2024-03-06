## Board

- [x] Disable dragging of cards when not necessary
- [x] Display card images
- [x] Display different image if flipped
- [x] Seperate card position from rest of image
- [x] Undo button
- [x] Success and failure screens
- [ ] Add error messages for invalid actions (or make it more clear that it is invalid)
    - Flipping without adjacent player
        - Maybe grey out button instead
    - Moving diagonally between 2 enemies
    - Attacking non-adjacent enemy
- [ ] Display number of cards/turns remaining
- [x] Add Infantry 0 image
- [x] Grey out health on modified enemy cards
- [x] Make win/loss overlay generic (don't have duplicate code)
- [ ] Fix layout on vertical screens

## Phases

Setup
- [ ] Show which card was discarded?

Encounter
- [x] Flip/rotate players from mortars before maneuver
- [x] Remove mortars before maneuver phase

Maneuver
- [x] Check that card is adjacent or diagonally adjacent before swapping
- [x] Check that diagonal movement is not blocked by 2 enemy cards
- [x] Rotate card after moving
- [x] Check that card is not down or rotated before moving
- [x] Add exception for mouse
- [x] Add ability for athlete to do 2 moves (rotate 45 degrees?)
    - Note that athlete cannot move AND flip
- [x] Click on player card to select it
- [x] Flip down/flip up (if up player nearby)
    - Fix board not updating
- [x] Can't select card that is rotated
    - Automatically deselect card once rotated and on next phase
- [x] Unrotate all members before attack phase
- [x] Remove flares before attack phase
- [x] Don't swap with rotated card
- [x] Fix leader flipping
- [ ] Fix out-of-bounds check

Attack
- [x] Click on player card to select it
- [x] Click on adjacent enemy card to attack with player, rotate player
- [x] Don't allow selecting down card (except mouse)
- [x] Remove enemy once health reaches 0
- [x] Don't allow attacking tanks
- [x] Don't allow selecting joker or pacifist
- [x] Allow the natural to attack diagonally
- [x] Increase anvil/hammer strength when pacifist adjacent
- [x] Change colour of strength text when modified
- [x] Decrease enemy strength when joker adjacent
- [x] Don't decrease when joker is down
- [x] Don't increase strength when pacifist is down
- [ ] Seperate numbers from card images in order to display that properly
    - Maybe have the modified number be a different colour?
- [ ] Highlight cards it can attack?
- [x] Unrotate cards before counter-attack phase
- [x] Revert enemy health before counter-attack phase
- [x] Check for failure before counter-attack phase
- [x] Check for success before counter-attack phase

Counter-Attack
- [x] Remove all players adjacent to enemy cards
- [x] Update anvil/hammer strength
- [x] Don't remove players adjacent to machine gun if they are down
- [x] Remove all up players in tank's row
- [x] Remove tanks before encounter phase