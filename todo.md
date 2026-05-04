# KNOWN BUGS:
- Perfect trap avoidance, if the snake knows it is trapped, try to stay alive and maybe tail will open up
    - currently, snake just gives up and dies opting to take blocked moves
- Fix PreV3 Looping on edges behaviour
    - I think I fixed this, I just tweaked the scoring in growth and emergency phases (may need more adjustments).
    - With the fix, the snake seems to ignore the safe-threshold and just sweeps the two vertical walls until it gets trapped?

(Honestly I just need to add more behind the scenes info to frontend so I can properly figure out what is going wrong)

# TODO:
- More up to date and detailed front-end information
- Run more testing to determine strange edge cases
- Make sure everything works in Battlesnake.com