# IFrame and Messages

There is iframe with player, which communicates with main page window via messages.

mainPage → [frames] → player
player → [progress] → mainPage
player → [viewerOptions] → mainPage

extension resend viewerOptions and progress from mainPage to player iFrame. 
So we can handle all these messages in the player iframe.

The order of `frames` and `viewerOptions` may vary. IDE and Replay page has different order.

## viewerOptions

viewerOptions need to get gameName. Some games has no gameName. Some other games has common gameName = CodinGame.

Sometimes when you open IDE by pushing SOLVE button on game page, this message is not received :(
Refresh page solves the problem.

## frames

contains frames with stdout, stderr etc.
Some frames are 'keyFrames'. Usually one step in player moves to the next keyFrame.
But some games (TheGreatEscape) step every frame.

stderr is present only for your own bot from IDE.

## progress

Every step in player post this message. It contains index of keyFrame to show.
Extension uses this message to repaint overlays.

Sometimes when you open IDE by pushing SOLVE button on game page, this message is not received :(
Refresh page solves the problem.