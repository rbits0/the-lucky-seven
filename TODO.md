## Board

- [x] Disable dragging of cards when not necessary
- [ ] Display card images
- [ ] Display different image if flipped
- [ ] Seperate card position from rest of image
- [ ] Undo button
- [ ] Success and failure screens

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

Attack
- [ ] Click on player card to select it
- [ ] Click on adjacent enemy card to attack with player, rotate player
- [ ] Check not down before attacking (except mouse)
- [ ] Remove enemy once health reaches 0
- [ ] Don't allow attacking flares
- [ ] Allow the natural to attack diagonally
- [ ] Increase anvil/hammer strength when pacifist adjacent
- [ ] Decrease enemy strength when joker adjacent
- [ ] Seperate numbers from card images in order to display that properly
    - Maybe have the modified number be a different colour?
- [ ] Highlight cards it can attack?
- [ ] Unrotate cards before counter-attack phase
- [ ] Revert enemy health before counter-attack phase
- [ ] Check for failure before counter-attack phase
- [ ] Check for success before counter-attack phase

Counter-Attack
- [ ] Remove all players adjacent to enemy cards
- [ ] Don't remove players adjacent to machine gun if they are up
- [ ] Remove all up players in tank's row
- [ ] Remove flares and tanks before encounter phase