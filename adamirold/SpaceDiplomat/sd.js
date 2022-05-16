<!--
/////////////////////
// BEGIN STARTUP CODE
/////////////////////

var DEBUG_INTERFACE = true;
var DEBUG_CODE = false;
var DEBUG_EVAL = true;

if (DEBUG_INTERFACE)
alert("startup code");

//
// SELECT THE CSS APPROPRIATE FOR THE USER'S DEVICE
//

function getOrientation()
{
  return(Math.abs(window.orientation) - 90 == 0 ? "landscape" : "portrait");
};
function getMobileWidth()
{
  return(getOrientation() == "landscape" ? screen.availHeight : screen.availWidth);
};
function getMobileHeight()
{
  return(getOrientation() == "landscape" ? screen.availWidth : screen.availHeight);
};
if (DEBUG_INTERFACE)
{
alert("Width = "+getMobileWidth()+", Height = "+getMobileHeight());
alert("screen.width = "+screen.width+", screen.height = "+screen.height);
}

if (DEBUG_INTERFACE)
alert("User Agent = '"+navigator.userAgent+"'");

// Device resolutions in pixels (horizontal mode)
// iPhone 1, 2G, 3G, 3GS; iPod Touch 1-3
// H:480 V:320
// iPhone 4, 4S; iPod Touch 4
// H:960 V:640
// iPhone 5, 5C, 5S, iPod Touch 5
// H:1136 V:640
// iPhone 6
// H:1334 V:750
// iPhone 6 Plus
// H:1920 V:1080
// iPad 1, 2
// H:1024 V:768
// iPad 3rd-gen, 4th-gen
// H:2048 V:1536
// iPad Mini
// H:1024 V:768

var device = -1;

if (navigator.userAgent.match(/iPad/i))
{
  device = 1;
  document.write("<link type=\"text\/css\" rel=\"stylesheet\" media=\"all\" href=\"ipad.css\" charset=\"utf-8\" \/>");
  document.write("<meta name=\"viewport\" content-width=768px, minimum-scale=1.0, maximum-scale=1.0 \/>");
if (DEBUG_INTERFACE)
alert("Loading ipad.css");
}
else if (navigator.userAgent.match(/iPhone/i))
{
  device = 2;
  if (navigator.userAgent.match(/Version\/1/i) ||
      navigator.userAgent.match(/Version\/2/i) ||
      navigator.userAgent.match(/Version\/3/i))
  {
    document.write("<link type=\"text\/css\" rel=\"stylesheet\" media=\"all\" href=\"iphone-320.css\" charset=\"utf-8\" \/>");
    document.write("<meta name=\"viewport\" content-width=320px, minimum-scale=1.0, maximum-scale=1.0 \/>");
if (DEBUG_INTERFACE)
alert("Loading iphone-320.css");
  }
  else if (screen.height == 480 || screen.height == 568) // iPhone 4, 4S, 5, 5S
  {
    document.write("<link type=\"text\/css\" rel=\"stylesheet\" media=\"all\" href=\"iphone-640.css\" charset=\"utf-8\" \/>");
    document.write("<meta name=\"viewport\" content-width=640px, minimum-scale=1.0, maximum-scale=1.0 \/>");
if (DEBUG_INTERFACE)
alert("Loading iphone-640.css");
  }
  else if (screen.height == 667) // iPhone 6
  {
    document.write("<link type=\"text\/css\" rel=\"stylesheet\" media=\"all\" href=\"iphone-750.css\" charset=\"utf-8\" \/>");
    document.write("<meta name=\"viewport\" content-width=750px, minimum-scale=1.0, maximum-scale=1.0 \/>");
if (DEBUG_INTERFACE)
alert("Loading iphone-750.css");
  }
  else if (screen.height == 736) // iPhone 6 Plus
  {
    document.write("<link type=\"text\/css\" rel=\"stylesheet\" media=\"all\" href=\"iphone-1080.css\" charset=\"utf-8\" \/>");
    document.write("<meta name=\"viewport\" content-width=1080px, minimum-scale=1.0, maximum-scale=1.0 \/>");
if (DEBUG_INTERFACE)
alert("Loading iphone-1080.css");
  }
  else // default iPhone
  {
    document.write("<link type=\"text\/css\" rel=\"stylesheet\" media=\"all\" href=\"iphone-640.css\" charset=\"utf-8\" \/>");
    document.write("<meta name=\"viewport\" content-width=640px, minimum-scale=1.0, maximum-scale=1.0 \/>");
if (DEBUG_INTERFACE)
alert("Loading iphone-640.css");
  }
}
else
{
  device = 0;
  document.write("<link type=\"text\/css\" rel=\"stylesheet\" href=\"normal.css\" \/>");
if (DEBUG_INTERFACE)
alert("Loading normal.css");
}

//
// INITIALIZE GAME VALUES
//

// Define player types
var PT_HUM = 0; // human player
var PT_AIP = 1; // AI player

// Define game states
var GS_NON = 0; // no winning condition met
var GS_HUM = 1; // human player has met win conditions
var GS_AIP = 2; // AI player has met win conditions

// Define game difficulty modes
var GD_EASY = 0; // human player gets a few special breaks
var GD_NORM = 1; // level playing field for everybody
var GD_HARD = 2; // AI players are wearing their clever pants

// Define civ data
var cInfo = new Array();

// Define player data
var pInfo = new Array();

// Define resource data
var tempWin = null; // Sssssss! Nasssty hackses!!
var crll = 0;
var civResList = new Array();
var prll = 0;
var playerResList = new Array();

// Define galaxy locations
var nBoxes = 64;          // number of valid cells on the prototype grid
// Each cell of the prototype grid contains the number of a civ (an index into the cInfo array).
// Although cell number == civ number in this initial code, this "extra" level of indirection will allow
// civs to merge -- multiple grid cells could point to the same civilization. It also allows some grid
// cells to contain -1, indicating that there is no advanced civilization in that part of the galaxy.
var cBoxes = new Array();

// Define starting locations for up to four players
var startLocs = new Array();
startLocs[0] = new Array( 0, 1, 2, 8, 9,10,16,17,18);
startLocs[1] = new Array( 5, 6, 7,13,14,15,21,22,23);
startLocs[2] = new Array(40,41,42,48,49,50,56,57,58);
startLocs[3] = new Array(45,46,47,53,54,55,61,62,63);

//
// INITIALIZE GAME VARIABLES
//

// Core variables
var humanWinCount = 0;
var AIWinCount = 0;
var moveNum = 0;
var numPlayers = 4;

var gameState = GS_NON;       // starting state is that there's no winner yet
var gameDifficulty = GD_NORM; // default difficulty is Normal
//var player = PT_HUM;          // default player is human

// Core settings
var firstgame = true;      // when the HTML is reloaded, this variable will be "true"
var soundEffects = false;  // default for sound is "off"
var automatic = false;     // when TRUE, will run the game 100 times to analyze relative AI strengths

// Initialize civ structure arrays
var gridNumGlobal = -1; // need global values so that child windows can see them (a filthy but functional hack)
var civNumGlobal = -1;
for (var i=0; i < cNames.length; i++)
{
  cInfo[i] = new Array(11);        // civ info array
  cInfo[i][0] = "";                // civ name
  cInfo[i][1] = "";                // civ type
  cInfo[i][2] = new Array;         // civ trait style (hi/lo)
  cInfo[i][3] = new Array();       // civ traits (up to eight)
  cInfo[i][4] = new Array();       // number of civ traits known to each player (index for human = 0, AI = 1-3)
  cInfo[i][5] = new Array();       // civ resources
  for (var j = 0; j < 100; j++)
    cInfo[i][5][j] = 0;            // indicate that all possible resources are not possessed
  cInfo[i][6] = new Array();       // civ deals
  for (var j = 0; j < 4; j++)
    cInfo[i][6][j] = new Array();  // status of all deals with each player (index for human = 0, AI = 1-3)
  cInfo[i][7] = 0;                 // number of deal proposals made this turn to this civ (max = 3)
  cInfo[i][8] = 4;                 // civ alignment -- with player 0-3, or "player 4" if not yet aligned through Political Union
  cInfo[i][9] = 0;                 // overall personality type for this civ
  cInfo[i][10] = new Array();      // neighbor has Non-Aggression Pact deal with player (index for human = 0, AI = 1-3)
  cInfo[i][11] = new Array();      // number of deal evaluations civ has made this turn (index for human = 0, AI = 1-3)
}

// Initialize player structure arrays
var civColors = new Array(0);
randomizeNumbers(civColors,0,4);
civColors[4] = 4; // make sure "non-aligned" alignment is considered for civ colors
for (var i = 0; i < 4; i++)
{
  pInfo[i] = new Array();
  pInfo[i][0] = -1;           // starting location for player = index number of galaxy cell
  pInfo[i][1] = -1;           // index of player's home civ
  pInfo[i][2] = 100;          // starting amount of credits
  pInfo[i][3] = civColors[i]; // identifying color for this player's civ
}

// These also need to be global so the child window functions can see them (hack, hack, hack)
var dealCloseType = 2;         // close types: 0 = "Cancel", 1 = "Propose", 2 = "other"
var bProposalAccepted = false;
var bProposalEvaluated = new Array(false,false,false,false,false,false,false,false,
                                   false,false,false,false,false,false,false,false,
                                   false,false,false,false,false,false,false,false,
                                   false,false,false,false,false,false,false,false,
                                   false,false,false,false,false,false,false,false,
                                   false,false,false,false,false,false,false,false,
                                   false,false,false,false,false,false,false,false,
                                   false,false,false,false,false,false,false,false);

var pctCreditsIndex = 0; // index of percentage of total credits for this player being risked (integers to avoid overflow)
var pctCreditsArray = new Array(0.0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0);
var playerPUCount = new Array(0,0,0,0);

var hp_button = null;
var ng_button = null;
var nt_button = null;

///////////////////
// END STARTUP CODE
///////////////////

//
// AUDIO FUNCTIONS
//
function playSound(soundfile)
{
  if (soundEffects == true)
    document.getElementById("dummy").innerHTML= "<embed src=\""+soundfile+"\" hidden=\"true\" autostart=\"true\" loop=\"false\" />";
}

function toggleSound(form)
{
  // Toggle the sound effects option
  if (form.sechoice.checked == false)
    soundEffects = false;
  else
    soundEffects = true;
}

function playSelect(form)
{
  // Toggle regular play or autoplay
  if (form.pschoice.checked == true)
    automatic = true;
  else
    automatic = false;
}

//
// GAMEPLAY FUNCTIONS
//
function start()
{
if (DEBUG_CODE)
alert("start()");
  // Start the game
  initButtons();

  if (automatic == true)
  {
    soundEffects = false;
    for (var i = 0; i < 100; i++)
    {
      newGame();
    }
  }
  else
    newGame();
}

function initButtons()
{
  hp_button = document.getElementById("hp_button");
  hp_button.style.background = '#d0d0d0';

  ng_button = document.getElementById("ng_button");
  ng_button.style.background = '#d0d0d0';

  nt_button = document.getElementById("nt_button");
  nt_button.style.background = '#d0d0d0';
}

function newGame()
{
if (DEBUG_CODE)
alert("newGame()");
  // Determine new game settings
  gameState = GS_NON;

  // Get new game options
  getGameOptions();

  // Reset galaxy
  resetGalaxy();

  // Randomly create civ info
  randomizeCivInfo();

  // Randomly assign civs to galaxy locations
  randomizeGalaxy();

  // Assign starting values for each player
  assignStartVals();

  // Assign starting tradable resources to all civs, including player's civ
  assignResources();

  // Assign starting deals for each player civ
  assignCivDeals();

  // Display initial player locations
  showInfluence();

  // Reset move number
  moveNum = 0;

  // Turn on "Next Turn" button when starting a new game
  nt_button.disabled = false;


//  while (gameState == GS_NON)
//    nextTurn();

}

function nextTurn()
{
  // End-of-turn processing
if (DEBUG_CODE)
alert("nextTurn()");

  nt_button.style.background = '#d0d0d0';

  // Reset the proposal flags
  bProposalAccepted = false;
  for (var i=0; i < nBoxes; i++)
    bProposalEvaluated[i] = false;

  // Reset proposal count value for all civs
  for (var i = 0; i < nBoxes; i++)
    cInfo[cBoxes[i]][7] = 0; // reset proposal counter for the civ at this grid location

  // End-of-turn processing for all NPC players
  doNonPlayerMoves();

  // Update influence map
  updateInfluence();

  // Accumulate credits for each player
  accumulateCredits();

  // Update galaxy influence map for all players
  showInfluence();

  // Check to see if the game has been won
  var winningPlayerNum = checkWin();
  if (gameState == GS_NON)
    moveNum++;
  else
    doEndGameInfo(winningPlayerNum);

if (DEBUG_CODE)
alert("Movenum="+moveNum);
}

function checkWin()
{
  var civNum = -1;
  var highPlayer = -1;
  var highCount = -1;

  for (var playerNum=0; playerNum < 4; playerNum++)
    playerPUCount[playerNum] = 0;

  for (var i=0; i < nBoxes; i++)
  {
    civNum = cBoxes[i];
    for (var playerNum=0; playerNum < 4; playerNum++)
    {
      if (cInfo[civNum][6][playerNum][7] == 1) // does playerNum have a Political Union with this civ?
      {
        playerPUCount[playerNum]++;
        break;
      }
    }
  }

  var PUcount = playerPUCount[0] + playerPUCount[1] + playerPUCount[2] + playerPUCount[3];
  if (PUcount == nBoxes)
  {
    // All civs now have a Political Union with someone. Count them up by player and see who has the most.
    for (var playerNum=0; playerNum < 4; playerNum++)
    {
      if (playerPUCount[playerNum] > highCount)
      {
        highCount = playerPUCount[playerNum];
        highPlayer = playerNum;
      }
    }

    if (highPlayer == 0)
      gameState = GS_HUM; // human player wins
    else
      gameState = GS_AIP; // AI player wins
  }

  return(highPlayer); // -1 if no winner yet; 0 if human player won; 1-3 if AI player won
}

function doEndGameInfo(winningPlayerNum)
{
  var civNum = pInfo[winningPlayerNum][1];
  var galPct = Math.floor(100 * playerPUCount[winningPlayerNum] / nBoxes);

  // Game is over, so turn off "Next Turn" button until the player starts a new game
  nt_button.disabled = true;

  // Display end-of-game message
  switch (winningPlayerNum)
  {
    case 0:
      alert("The "+traitTypes[cInfo[civNum][9]]+" genius of your people, the "+cNames[cInfo[civNum][0]]+" "+cTypes[cInfo[civNum][1]]+", now dominate "+galPct+"% of the galaxy. Congratulations!");
      break;
    case 1:
    case 2:
    case 3:
      alert("The highly "+traitTypes[cInfo[civNum][9]]+" "+cNames[cInfo[civNum][0]]+" "+cTypes[cInfo[civNum][1]]+" now control "+galPct+"% of the galaxy. Your civilization becomes a brief footnote in the history texts.");
      break;
    default:
      alert("Error: unknown player #"+winningPlayerNum+" has won the game.");
      break;
  }
}

function doNonPlayerMoves()
{
  // Perform gameplay actions for civs other than the player
  doNeutralCivMoves();
  doOpponentCivMoves();
}

function doNeutralCivMoves()
{
  // Perform gameplay actions for non-player civs not controlled by an AI opponent
}

function doOpponentCivMoves()
{
  // Perform gameplay actions for AI opponent civs

  var civNum = 0;
  var firstDealIndices = new Array(-1,-1,-1,-1);

  // Randomize order of non-human player moves each turn for fairness over time
  var playerNums = new Array(0);
  randomizeNumbers(playerNums,1,4);

  for (j=0; j < numPlayers-1; j++)
  {
    var playerNum = playerNums[j];

    // Choose civ to do a deal with
    // First, create a list of neighboring civs for this player
    var neighborList = getNeighborList(playerNum);

    // Decide which neighbor civ to try to make a deal with
    civNum = getTargetCiv(neighborList,playerNum);

    // Make sure there's a valid target civ
    if (civNum != -1)
    {
      // Find next available deal with this civ for each player
      firstDealIndices[playerNum] = getNextFreeDeal(civNum,playerNum);

      // Process new deal based on current highest deal number
      switch(firstDealIndices[playerNum])
      {
        case -1:
          break;
        case 0:
        case 1:
        case 2:
        case 4:
        case 5:
        case 6:
          switch(playerNum)
          {
            case 1:
              if (cInfo[civNum][6][2][7] != 1 && cInfo[civNum][6][3][7] != 1)
                cInfo[civNum][6][playerNum][firstDealIndices[playerNum]] = 1;
              break;
            case 2:
              if (cInfo[civNum][6][1][7] != 1 && cInfo[civNum][6][3][7] != 1)
                cInfo[civNum][6][playerNum][firstDealIndices[playerNum]] = 1;
              break;
            case 3:
              if (cInfo[civNum][6][1][7] != 1 && cInfo[civNum][6][2][7] != 1)
                cInfo[civNum][6][playerNum][firstDealIndices[playerNum]] = 1;
              break;
          }
          break;
        case 7:
          switch(playerNum)
          {
            case 1:
              if (cInfo[civNum][6][2][7] != 1 && cInfo[civNum][6][3][7] != 1)
              {
                cInfo[civNum][6][playerNum][7] = 1;
                cInfo[civNum][8] = playerNum; // show that civ is now aligned with player
                for (var k=0; k < 7; k++)
                {
                  cInfo[civNum][6][0][k] = 0;
                  cInfo[civNum][6][2][k] = 0;
                  cInfo[civNum][6][3][k] = 0;
                }
              }
              break;
            case 2:
              if (cInfo[civNum][6][1][7] != 1 && cInfo[civNum][6][3][7] != 1)
                cInfo[civNum][6][playerNum][7] = 1;
                cInfo[civNum][8] = playerNum; // show that civ is now aligned with player
                for (var k=0; k < 7; k++)
                {
                  cInfo[civNum][6][0][k] = 0;
                  cInfo[civNum][6][1][k] = 0;
                  cInfo[civNum][6][3][k] = 0;
                }
              break;
            case 3:
              if (cInfo[civNum][6][1][7] != 1 && cInfo[civNum][6][2][7] != 1)
                cInfo[civNum][6][playerNum][7] = 1;
                cInfo[civNum][8] = playerNum; // show that civ is now aligned with player
                for (var k=0; k < 7; k++)
                {
                  cInfo[civNum][6][0][k] = 0;
                  cInfo[civNum][6][1][k] = 0;
                  cInfo[civNum][6][2][k] = 0;
                }
              break;
          }
          break;
      }
    }
    else
    {
      // No valid civ (all neighbors have Political Union deals with some player), so skip this turn
    }
  }
}

function getTargetCiv(neighborList, playerNum)
{
  // Randomly select a civ from the neighbor list
  // Exclude player civs and any civ with whom any player already has a Political Union
  var tCiv = -1;
  var targetCivList = new Array();

  // Build list of civs this player can still do a deal with
  for (var i=0, j=0, nlen=neighborList.length; i < nlen; i++)
  {
    tCiv = neighborList[i];
    if (tCiv != pInfo[0][1] && tCiv != pInfo[1][1] && tCiv != pInfo[2][1] && tCiv != pInfo[3][1] &&
        cInfo[tCiv][6][0][7] != 1 && cInfo[tCiv][6][1][7] != 1 && cInfo[tCiv][6][2][7] != 1 && cInfo[tCiv][6][3][7] != 1)
      targetCivList[j++] = tCiv;
  }

  // If there's at least one valid civ, randomly choose one
  tCiv = -1;
  if (targetCivList.length > 0)
    tCiv = targetCivList[rand(0,targetCivList.length-1)];

  return(tCiv);
}

function getNeighborList(playerNum)
{
  var neighborArray = new Array();
  var neighborGrid = new Array(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);

  gridNum = pInfo[playerNum][0];
  neighborGrid[gridNum] = 1;
if (DEBUG_CODE)
alert("playerNum="+playerNum+", homeGrid="+gridNum);

  getNeighborListRecursive(playerNum,gridNum,neighborGrid);

  for (var i=0, j=0; i < nBoxes; i++)
  {
    if (neighborGrid[i] == 1)
      neighborArray[j++] = cBoxes[i];
  }

if (DEBUG_CODE)
{
for (var j=0; j < neighborArray.length; j++)
  alert("numNeighbors="+neighborArray.length+", neighborArray["+j+"]="+neighborArray[j]);
}

  return(neighborArray);
}

function getNeighborListRecursive(playerNum, gridNum, neighborGrid)
{
  var adjacentGrid = -1;
  var glen = gridNeighbors[gridNum].length;
if (DEBUG_CODE)
alert("rec: gridNum="+gridNum+", "+glen+" adjacent cells");
  if (cInfo[cBoxes[gridNum]][6][playerNum][5] == 1) // can only expand to new civ from a civ with whom this player has an Embassy
  {
    for (var k=0; k < glen; k++)
    {
      adjacentGrid = gridNeighbors[gridNum][k];
      if (neighborGrid[adjacentGrid] == 0)
      {
        neighborGrid[adjacentGrid] = 1;
        getNeighborListRecursive(playerNum,adjacentGrid,neighborGrid);
      }
    }
  }
}

function isCivInNeighborList(playerNum, civNum)
{
  var bCivInList = false;

  var neighborList = getNeighborList(playerNum);
  var nlen = neighborList.length;
  for (var i=0; i < nlen; i++)
  {
    if (neighborList[i] == civNum)
    {
      bCivInList = true;
      break;
    }
  }

  return(bCivInList);
}

function isCivIsolated(gridNum, playerNum)
{
  // Check whether any civ (except home civ) is not connected to the player's home civ
  var bCivIsolated = true;

  if (pInfo[playerNum][1] == cBoxes[gridNum])
    bCivIsolated = false;
  else
  {
    var neighborList = getNeighborList(playerNum);
    var nlen = neighborList.length;
    for (var i=0; i < nlen; i++)
    {
      if (neighborList[i] == cBoxes[gridNum])
      {
        bCivIsolated = false;
        break;
      }
    }
  }

  return(bCivIsolated);
}

function updateInfluence()
{
  // If any Political Union civ (except home civ) is not connected to the home civ, reset its highest deal with its owning civ back to Embassy
  var civNum = -1;

  for (var i=0; i < nBoxes; i++)
  {
    civNum = cBoxes[i];

    for (var j=0; j < 4; j++)
    {
      if (isCivIsolated(i,j) == true && cInfo[civNum][6][j][7] == 1)
      {
        // Reset this civ's highest deal with that player civ back to Embassy
if (DEBUG_CODE)
alert("movenum="+moveNum+": resetting civ "+civNum+" back to Embassy; current PU = "+cInfo[civNum][6][j][7]);
//var glen = gridNeighbors[i].length;
//for (var k=0; k < glen; k++)
//{
//  var adjacentCiv = cBoxes[gridNeighbors[i][k]];
//  alert("adjacentCiv "+adjacentCiv+" First Contact deal with playernum "+j+" is "+cInfo[adjacentCiv][6][j][0]);
//}

        cInfo[civNum][6][j][7] = 0;
        cInfo[civNum][6][j][6] = 0;
        cInfo[civNum][8] = 4; // show that civ is no longer aligned with any player
      }
    }
  }
}

function accumulateCredits()
{
  // For each player, add up the incoming credits from civs with whom they have deals
  var civNum = -1;
  var highDeal = -1;
  var playerCiv = new Array(pInfo[0][1],pInfo[1][1],pInfo[2][1],pInfo[3][1]);

  for (var i = 0; i < nBoxes; i++)
  {
    civNum = cBoxes[i];
    for (var playerNum = 0; playerNum < numPlayers; playerNum++)
    {
      if (playerCiv[playerNum] != civNum)
      {
        highDeal = getHighestDeal(civNum, playerNum);
        if (highDeal != -1)
          pInfo[playerNum][2] += creditsProduced[highDeal];
      }
    }
  }
}

function showInfluence()
{
  // Update the appearance of each civ cell to show who has the most influence there
  for (var i = 0; i < nBoxes; i++)
    showInfluenceCell(i);
}

function showInfluenceCell(cellnum)
{
  var cellColor = "#000000";
  var borderColors = new Array("#e00","#0e0","#00e","#d0d","#bbb");

  var civDealStrengthColorR = 0;
  var civDealStrengthColorG = 0;
  var civDealStrengthColorB = 0;

  var civNum = cBoxes[cellnum];

  if (isCivInNeighborList(0,civNum) == true)
    document.getElementById("c"+cellnum).style.border = "solid 2px #ee0"; // highlight human player's playable civs

  for (var j = 0; j < numPlayers; j++)
  {
    var playerColorIndex = pInfo[j][3]; // index of color for this player civ

    var lastDealIndex = -1;
    for (var k = 0; k < 8; k++)
    {
      if (cInfo[civNum][6][j][k] == 1)
        lastDealIndex = k;
    }

    civDealStrengthColorR += dealStrengthColor[playerColorIndex][lastDealIndex + 1][0];
    civDealStrengthColorG += dealStrengthColor[playerColorIndex][lastDealIndex + 1][1];
    civDealStrengthColorB += dealStrengthColor[playerColorIndex][lastDealIndex + 1][2];

//    if (isCivInNeighborList(j,civNum) == true && (pInfo[j][1] == civNum || cInfo[civNum][6][j][7] == 0))
//      document.getElementById("c"+cellnum).style.border = "solid 2px " + borderColors[civColors[j]]; // highlight playable civs [last one overwrites!]
  }

  if (civDealStrengthColorR > 255)
    civDealStrengthColorR = 255;
  if (civDealStrengthColorG > 255)
    civDealStrengthColorG = 255;
  if (civDealStrengthColorB > 255)
    civDealStrengthColorB = 255;

  cellColor = "#" + decToHex(civDealStrengthColorR) + decToHex(civDealStrengthColorG) + decToHex(civDealStrengthColorB);

if (DEBUG_CODE)
alert("civNum="+cBoxes[civNum]+", Rd="+civDealStrengthColorR+", Gd="+civDealStrengthColorG+", Bd="+civDealStrengthColorB);

  // Modify cell color based on the combined strengths of the highest deals between all four players and the civ in this cell
  document.getElementById("c"+cellnum).style.background = cellColor; // background color must be changed on CELL, not IMAGE

  if (pInfo[0][1] == cBoxes[cellnum])
    document.getElementById("c"+cellnum).style.border = "solid 2px #ee0"; // highlight human player's home civ
}

function decToHex(decVal)
{
  var hexVal = "";
  var hexString = "";

  hexVal = decVal.toString(16);
  if (decVal < 10)
    hexString = "0" + hexVal;
  else
    hexString = hexVal;

  return(hexString);
}

function getGameOptions()
{
  // Get the player's new game preferences


  numPlayers = 4;
}

function resetGalaxy()
{
  // Reset galaxy variables and images for new game

  // Reset the proposal acceptance flag
  bProposalAccepted = false;

  for (var i = 0; i < nBoxes; i++)
  {
    // Reset the proposal evaluation flag for all civs
    bProposalEvaluated[i] = false;

    // Restore original background colors and images
    document.getElementById("c"+i).style.background = "#000000"; // background color must be changed on CELL, not IMAGE

    document.getElementById("i"+i).style.opacity = "0.5"; // for most browsers
    document.getElementById("i"+i).style.filter = "alpha(opacity=50)"; // for IE 5-7 (works for IE 8 as well)

    document.getElementById("i"+i).src = "img_bck.png";

    document.getElementById("c"+i).style.border = "solid 2px #fff"; // reset all borders
  }
}

function randomizeCivInfo()
{
  // Randomly generate details for the maximum number of civilizations used in a game
  // Insure that names are used by only one civ, and that traits do not repeat for any one civ
  var civNameNums = new Array(0);
  randomizeNumbers(civNameNums,0,cNames.length-1);

  var styles = new Array(0,0,0,0,0,0,0,0);

  var civTraitNums = new Array(0);
  for (var j=0; j < cTraitsHi.length-1; j++)
    civTraitNums[j] = j;

  for (var i=0; i < nBoxes; i++)
  {
    // Civ name
    cInfo[i][0] = civNameNums[i]; // pick next civ name from randomized array

    // Civ type
    cInfo[i][1] = rand(0,cTypes.length-1); // pick random civ political structure type

    // Civ traits
    civTraitNums.shuffleArray(); // need to re-randomize trait order for each civ
    for (var j = 0; j < 8; j++)
    {
      if (rand(0,99) < 50)
        cInfo[i][2][j] = 0; // use trait from Hi group
      else
        cInfo[i][2][j] = 1; // use trait from Lo group
      cInfo[i][3][j] = civTraitNums[j]; // pick first 8 traits from randomized array
    }

    for (var j = 0; j < 4; j++)
      cInfo[i][4][j] = 1; // one trait for each civ is known to each player (out of 4) at the start of the game

    // Civ deals
    for (var j = 0; j < 4; j++)
    {
      for (var k = 0; k < 8; k++)
        cInfo[i][6][j][k] = 0; // each civ has no deals with any player at the start of the game
    }

    cInfo[i][7] = 0; // reset proposal counter for this civ

    cInfo[i][8] = 4; // reset political alignment for this civ to "non-aligned"

    cInfo[i][9] = calcTraitType(i,0); // calculate and store the overall personality type for this civ
    styles[cInfo[i][9]]++; // count the number of each personality style

    // Non-Aggression Pact cost reductions
    for (var j = 0; j < 4; j++)
      cInfo[i][10][j] = false;

    // Evaluation count
    for (var j = 0; j < 4; j++)
      cInfo[i][11][j] = 0;
  }

//var outbuf = "";
//for (var i=0; i < 8; i++)
//{
//  outbuf += traitTypes[i] + " " + styles[i] + "\n";
//}
//alert(outbuf);

}

function calcTraitType(civNum,disp)
{
  var traitVals = new Array(0,0,0,0,0,0,0,0);
  var traitNum = -1;
  var traitMax = -999;
  var traitValIndex = 0;

  // Add up the type values for each of this civ's traits
  for (var j=0; j < 8; j++)
  {
    traitNum = cInfo[civNum][3][j];
    var traitTypeBig = cTraitTypeVals[traitNum][0];
    var traitTypeSml = cTraitTypeVals[traitNum][1];
    if (cInfo[civNum][2][j] == 0)
    {
      traitVals[traitTypeBig] += 3;
      traitVals[traitTypeSml] -= 1;
if (DEBUG_CODE)
if (disp==1) alert(cTraitsHi[traitNum]+": "+traitTypes[traitTypeBig]+"+3, "+traitTypes[traitTypeSml]+"-1");
    }
    else
    {
      traitVals[traitTypeBig] -= 3;
      traitVals[traitTypeSml] += 1;
if (DEBUG_CODE)
if (disp==1) alert(cTraitsLo[traitNum]+": "+traitTypes[traitTypeBig]+"-3, "+traitTypes[traitTypeSml]+"+1");
    }
  }

//if (disp==1)
//{
//  var str = '';
//  for (var i=0; i < 8; i++)
//    str += " " + traitVals[i];
//  alert("traitVals:"+str);
//}

  // Find the highest-valued trait type
  for (var j=0; j < 8; j++)
  {
    if (traitVals[j] > traitMax)
    {
      traitMax = traitVals[j];
      traitValIndex = j;
if (DEBUG_CODE)
if (disp==1) alert("index="+traitValIndex+", val="+traitMax);
    }
  }

  return(traitValIndex);
}

function randomizeGalaxy()
{
  // Randomize civ locations
  // Insure that each civ, once assigned to a galactic location, is not assigned again

// NOTE: this isn't actually randomized yet!
// It doesn't actually need to be since civs are randomly created for each new game -- assigning them
// iteratively looks random enough.
// This does, however, mean that randomizeGalaxy() can only be called AFTER randomizeCivInvo() is called.

// Also note that this level of indirection is needed because, although the game starts with every civ
// as a politically independent entity, the Political Union deal allows non-player-controlled civs to
// merge with one of the player-controlled civs. At that point, several cells will have the same civ index.

  for (var i = 0; i < nBoxes; i++)
    cBoxes[i] = i;
}

function assignStartVals()
{
  // Reset starting data values for each player

  // Randomize starting grid cells
  var cornerNums = new Array(0);
  randomizeNumbers(cornerNums,0,4);

  // Randomize player civ colors
  civColors = new Array(0);
  randomizeNumbers(civColors,0,4);
  civColors[4] = 4; // make sure "non-aligned" alignment is considered for civ colors

  // Assign starting values for each player
  for (var playerNum = 0; playerNum < numPlayers; playerNum++)
  {
    var rpri = cornerNums[playerNum];
    var rsec = rand(0,8);
    pInfo[playerNum][0] = startLocs[rpri][rsec]; // this is the starting CELL number for each player, not their starting CIV index

    // Store index of player's civ for convenience
    pInfo[playerNum][1] = cBoxes[pInfo[playerNum][0]];
    var civNum = pInfo[playerNum][1];

    // Reset credits
    pInfo[playerNum][2] = 100;

    // Reset identifying color for this player's civ
    pInfo[playerNum][3] = civColors[playerNum];

    // Assign default political alignments
    cInfo[civNum][8] = playerNum;

    // Each player civ knows all of its own traits
    cInfo[civNum][4][playerNum] = 8;
  }
}

function assignResources()
{
  // Assign starting resources
  var civNum = -1;

  for (var i=0; i < nBoxes; i++)
  {
    civNum = cBoxes[i];

    // Set the title for each cell to the name/type of the civ located there
    var imgTitle = document.getElementById("i"+i);
    imgTitle.setAttribute("title",cNames[cInfo[civNum][0]] + " " + cTypes[cInfo[civNum][1]] + "["+traitTypes[cInfo[civNum][9]]+"]");

    // Assign starting tradeable resources
    var isPlayer = false;

    for (var j = 0; j < numPlayers; j++)
    {
      if (civNum == pInfo[j][1])
        isPlayer = true;
    }

    if (isPlayer == true)
      assignPlayerResources(civNum); // assign starting tradable resources to player's civ
    else
      assignCivResources(civNum);    // assign starting tradable resources to regular civ
  }
}

function assignPlayerResources(civNum)
{
  // Randomize starting resources available to players

  // Reset resources
    cInfo[civNum][5].length = 0;

  // Give player all of the basic (low-tech) resources
  for (var j = 0; j < 50; j++)
    cInfo[civNum][5][j] = 1;

  // Also give player the initial high-tech resources needed for space travel
  for (var j = 50; j < 60; j++)
    cInfo[civNum][5][j] = 1;

  if (gameDifficulty == GD_EASY && civNum == pInfo[0][1])
  {
    // In Easy mode, also give the human player a few random high-tech resources (with no duplicates)
    var hiTechResourceList = new Array();
    randomizeNumbers(hiTechResourceList,60,100);

    var numHiTechResources = rand(1,5);
    for (var j = 0; j < numHiTechResources; j++)
      cInfo[civNum][5][hiTechResourceList[j]] = 1;
  }
}

function assignCivResources(civNum)
{
  // Randomize starting resources available to civ

  // Reset resources
  cInfo[civNum][5].length = 0;

  // Give civ some basic (low-tech) resources to trade with
  var loTechResourceList = new Array();
  randomizeNumbers(loTechResourceList,0,50);

  var numLoTechResources = rand(15,22);
  for (var j = 0; j < numLoTechResources; j++)
    cInfo[civNum][5][loTechResourceList[j]] = 1;

  // Also give civ the initial high-tech resources needed for space travel
  for (var j = 50; j < 60; j++)
    cInfo[civNum][5][j] = 1;

  // Also give civ some random high-tech resources (with no duplicates)
  var hiTechResourceList = new Array();
  randomizeNumbers(hiTechResourceList,60,100);

  var numHiTechResources = rand(6,12);
  for (var j = 0; j < numHiTechResources; j++)
    cInfo[civNum][5][hiTechResourceList[j]] = 1;
}

function resourceOwned(civNum, resNum)
{
  // Test a civ's resources to see if a particular resource is owned
  // Return true if found, false if not found
  var found = false;
  if (cInfo[civNum][5][resNum] == 1)
    found = true;

  return(found);
}

function assignCivDeals()
{
  // Clear all deals except for the player civs, who start with all deals for themselves
  var dealVal = 0;
  var civNum = -1;

  for (var i=0; i < nBoxes; i++)
  {
    civNum = cBoxes[i];
    for (var j = 0; j < numPlayers; j++)
    {
      if (civNum == pInfo[j][1]) // test whether this civ is a player civ
        dealVal = 1;
      else
        dealVal = 0;

      for (var k = 0; k < 8; k++)
        cInfo[civNum][6][j][k] = dealVal;

if (DEBUG_CODE)
{
if (dealVal == 1)
alert("cInfo["+civNum+"][6]["+j+"][7] = "+cInfo[civNum][6][j][7]);
}
    }
  }
}

function dist_func(loc1, loc2, bTrunc)
{
  // Use standard distance function to calculate the distance between two objects
  var x1=0, y1=0, x2=0, y2=0;
  var dist = 0;

  // Convert second location to x1, y1 coordinates
  x1 = loc1 % 8;
  y1 = loc1 / 8;

  // Convert second location to x2, y2 coordinates
  x2 = loc2 % 8;
  y2 = loc2 / 8;

  // Calculate distance
  dist = Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));

  if (bTrunc == true)
    dist = Math.floor(dist);

if (DEBUG_CODE)
alert("loc1="+loc1+", loc2="+loc2+", dist="+dist);
  return(dist);
}

function randomizeNumbers(nArray, nCountStart, nCountEnd)
{
  // Populate an array with a randomized list of 'nCount' numbers
  for (var i=0, j=nCountStart; j < nCountEnd; j++)
    nArray[i++] = j;
  nArray.shuffleArray();

  return;
}

function getHighestDeal(civNum, playerNum)
{
  var highestDealNum = -1;

  for (var k=0; k < 8; k++)
  {
    if (cInfo[civNum][6][playerNum][k] == 1)
      highestDealNum = k;
  }

  return(highestDealNum);
}

function getNextFreeDeal(civNum, playerNum)
{
  var nextFreeDealNum = -1;

  for (var k = 0; k < 8; k++)
  {
    if (k != 3 && cInfo[civNum][6][playerNum][k] == 0)
    {
      nextFreeDealNum = k;
      break;
    }
  }

  return(nextFreeDealNum);
}

function replaceText(sStr, rTArray, rVArray)
{
  // Replace values in text string
  // rTArray contains tags to replace
  // rVArray contains the replacement value for each tag
  var rStr = sStr;

  for (var i=0; i < rTArray.length; i++)
    rStr = rStr.replace(rTArray[i],rVArray[i]);

  return(rStr);
}

function mouseClick(cell)
{
  gridNumGlobal = cell;
  var lastDealChecked = -1;
  var civNum = cBoxes[gridNumGlobal];
  civNumGlobal = civNum;
  var civName = cNames[cInfo[civNum][0]];
  var civType = cTypes[cInfo[civNum][1]];
  var civStyle = cInfo[civNum][9];
  var ownerCivName = "";
  var ownerCivType = "";
  var bOwned = false;


calcTraitType(civNum,1); // TEMPORARY for debugging


  var ownerPlayerNum = cInfo[civNum][8];
  if (ownerPlayerNum != 4)
  {
    var ownerCivNum = pInfo[ownerPlayerNum][1];
    if (ownerCivNum != civNum)
    {
      ownerCivName = cNames[cInfo[ownerCivNum][0]];
      ownerCivType = cTypes[cInfo[ownerCivNum][1]];
      bOwned = true;
    }
  }

  pctCreditsIndex = 0; // initial credits multiplier is 0

  dealCloseType = 2; // initial deal closure type is "other" (i.e., not "Cancel" or "Propose")

if (DEBUG_CODE)
alert("civNum="+civNum+", highDeal[0]="+getHighestDeal(civNum,0)+", highDeal[1]="+getHighestDeal(civNum,1)+", highDeal[2]="+getHighestDeal(civNum,2)+", highDeal[3]="+getHighestDeal(civNum,3));
//return;

  // Load non-player civ list with just the indexes of civ resources (if that civ is not the player civ)
  crll = 0;
  civResList.length = 0;
  if (civNum != pInfo[0][1]) // only show non-player civ resources if player has not selected his own civ
  {
    for (var i = 0; i < 100; i++)
    {
      if (cInfo[civNum][5][i] == 1)
        civResList[crll++] = i;
    }
  }

  // Load player civ list with just the indexes of civ resources
  prll = 0;
  for (var i = 0; i < 100; i++)
  {
    if (cInfo[pInfo[0][1]][5][i] == 1)
      playerResList[prll++] = i;
  }

  // Assign text color for civ information
  var civColorText = new Array("#ff3333","#33ff33","#4455ff","#cc33ee","#ffffff");
  var civColor = civColorText[civColors[cInfo[civNum][8]]];

if (DEBUG_CODE)
alert("mouseClick cell "+gridNumGlobal+", civNum="+civNum+", civName='"+civName+"', civType='"+civType+"'");

  var winOptions = "toolbar=0,location=0,directories=0,status=0,menubar=0,scrollbars=0,resizable=0,height=640,width=960";
  if (device > 0)
    winOptions += ",fullscreen=true"; // non-PCs get a fullscreen child window
  var childWin = window.open("","TempWindow",winOptions);

  tempWin = childWin;

  tempWin.document.write("<!DOCTYPE html>\n");
//  tempWin.document.write("<!-- saved from url=(0016)http://localhost -->\n"); // Mark Of The Web

  tempWin.document.write("<HEAD>\n");

  tempWin.document.write("\n");
  tempWin.document.write("<SCR"+"IPT type='text/javascript' SRC='Random.js'></SCR"+"IPT>\n");
  tempWin.document.write("<SCR"+"IPT type='text/javascript' src='sd-consts.js'></SCR"+"IPT>\n");
  tempWin.document.write("<SCR");
  tempWin.document.write("IPT LANGUAGE='JavaScript'>\n");
  tempWin.document.write("<!--\n");
  tempWin.document.write("function scoreDeal()\n");
  tempWin.document.write("{\n");
  tempWin.document.write("  // Deal evaluation logic (to be called after clicking [Propose] to prevent spamming the game with guesses)\n");
  tempWin.document.write("  var evalPct = 5;        // final evaluation percentage -- always between 5% and 95% (inclusive)\n");
  tempWin.document.write("  var dealIndex = -1;     // index of currently selected deal\n");
  tempWin.document.write("  var dealCost = 0;       // base cost of the currently selected deal\n");
  tempWin.document.write("  var dealOffer = 0;      // value of the current offer after all mods are applied\n");
  tempWin.document.write("  var techTraitOffer = 0; // sum of the value of all techs being offered versus the civ's traits\n");
  tempWin.document.write("  var techTraitCost = 0;  // sum of the value of all techs being requested from the civ versus that civ's traits\n");
  tempWin.document.write("  var toneTraitMod = 0;   // sum of the value of current tone versus all civ's traits\n");
  tempWin.document.write("  var proposalMod = new Array(1.0,1.2,1.5); // successive proposals get more expensive\n");
  tempWin.document.write("  var toneSelected = -1;  // currently selected tone (must be one, and can be only one)\n");
  tempWin.document.write("  var myCivNum = window.opener.pInfo[0][1];\n");
  tempWin.document.write("  var civNum = window.opener.civNumGlobal;\n");
  tempWin.document.write("\n");
  tempWin.document.write("  // Get the current count of proposal attempts to this civ for this turn\n");
  tempWin.document.write("  var proposalCount = window.opener.cInfo[civNum][7];\n");
  tempWin.document.write("\n");
  tempWin.document.write("  // Get the base cost of the deal\n");
  tempWin.document.write("  for (dealIndex = 0; dealIndex < 8; dealIndex++)\n");
  tempWin.document.write("  {\n");
  tempWin.document.write("    if (cDeal[dealIndex].disabled == false && cDeal[dealIndex].checked == true)\n");
  tempWin.document.write("      break;\n");
  tempWin.document.write("  }\n");
  tempWin.document.write("  dealCost = dealCosts[dealIndex];\n");
  tempWin.document.write("  switch (window.opener.cInfo[myCivNum][9]) // give benefits based on player civ's personality type\n");
  tempWin.document.write("  {\n");
  tempWin.document.write("    case 0: // MIL\n");
  tempWin.document.write("      if (dealIndex == 3)\n");
  tempWin.document.write("        dealCost -= Math.floor(dealCost * 0.15); // reduce cost of Obtain Info deals by 15%\n");
  tempWin.document.write("      break\n");
  tempWin.document.write("    case 1: // POL\n");
  tempWin.document.write("      if (dealIndex == 7)\n");
  tempWin.document.write("        dealCost -= Math.floor(dealCost * 0.10); // reduce cost of Political Alliance deals by 10%\n");
  tempWin.document.write("      break\n");
  tempWin.document.write("    case 2: // ECO\n");
  tempWin.document.write("      if (dealIndex == 1)\n");
  tempWin.document.write("        dealCost -= Math.floor(dealCost * 0.15); // reduce cost of Trade Treaty deals by 15%\n");
  tempWin.document.write("      break\n");
  tempWin.document.write("    case 3: // SOC\n");
  tempWin.document.write("      break\n");
  tempWin.document.write("    case 4: // ART\n");
  tempWin.document.write("      if (dealIndex == 2 || dealIndex == 5)\n");
  tempWin.document.write("        dealCost -= Math.floor(dealCost * 0.10); // reduce cost of Consulate and Embassy deals by 10%\n");
  tempWin.document.write("      break\n");
  tempWin.document.write("    case 5: // PHI\n");
  tempWin.document.write("      if (dealIndex == 6)\n");
  tempWin.document.write("        dealCost -= Math.floor(dealCost * 0.15); // reduce cost of Non-Aggression Pact deals by 15%\n");
  tempWin.document.write("      break\n");
  tempWin.document.write("    case 6: // TEC\n");
  tempWin.document.write("      break\n");
  tempWin.document.write("    case 7: // INT\n");
  tempWin.document.write("      if (dealIndex == 4)\n");
  tempWin.document.write("        dealCost -= Math.floor(dealCost * 0.15); // reduce cost of Research Treaty deals by 15%\n");
  tempWin.document.write("      break\n");
  tempWin.document.write("  }\n");
  tempWin.document.write("  if (window.opener.cInfo[civNum][6][0][7] == 1)\n");
  tempWin.document.write("    dealCost -= Math.floor(dealCost * 0.33333333); // reduce cost of Obtain Info deals one-third if player has Political Union with target civ\n");
  tempWin.document.write("\n");
  tempWin.document.write("  // Calculate the modifiers to the deal cost by looping through each of the target civ's 8 traits (including the hidden ones)\n");
  tempWin.document.write("  for (var i = 0; i < 8; i++)\n");
  tempWin.document.write("  {\n");
  tempWin.document.write("    // Get index of this trait for the target civ\n");
  tempWin.document.write("    var traitIndex = (cTraitsHi.length * window.opener.cInfo[civNum][2][i]) + window.opener.cInfo[civNum][3][i];\n");
  tempWin.document.write("    // Accumulate the values for each tech selected from the target civ's resources (subtract, since this is a cost)\n");
  tempWin.document.write("    for (var resNum = 0; resNum < window.opener.crll; resNum++)\n");
  tempWin.document.write("    {\n");
  tempWin.document.write("      if (cResC[resNum].checked == true)\n");
  tempWin.document.write("      {\n");
  tempWin.document.write("        var techIndex = window.opener.civResList[resNum];\n");
  tempWin.document.write("        techTraitCost += techTraitVals[techIndex][traitIndex];\n");
  tempWin.document.write("      }\n");
  tempWin.document.write("    }\n");
  tempWin.document.write("    // Accumulate the values for each tech selected from the player's resources\n");
  tempWin.document.write("    for (var resNum = 0; resNum < window.opener.prll; resNum++)\n");
  tempWin.document.write("    {\n");
  tempWin.document.write("      if (cResP[resNum].checked == true)\n");
  tempWin.document.write("      {\n");
  tempWin.document.write("        var techIndex = window.opener.playerResList[resNum];\n");
  tempWin.document.write("        var techTraitVal = techTraitVals[techIndex][traitIndex];\n");
  tempWin.document.write("        techTraitOffer += techTraitVal;\n");
  tempWin.document.write("      }\n");
  tempWin.document.write("    }\n");
  tempWin.document.write("    if (window.opener.cInfo[myCivNum][9] == 6)\n");
  tempWin.document.write("      techTraitOffer += (techTraitOffer * 0.15); // increase value of tech offered by 15% if player civ is Technological\n");
  tempWin.document.write("    if (window.opener.cInfo[civNum][6][0][4] == 1)\n");
  tempWin.document.write("      techTraitOffer += (techTraitOffer * 0.20); // increase value of tech offered by 20% if player has Research Treaty with target civ\n");
  tempWin.document.write("    // Get the value of the modifier for the selected tone versus this trait\n");
  tempWin.document.write("    for (toneSelected = 0; toneSelected < cTones.length; toneSelected++)\n");
  tempWin.document.write("    {\n");
  tempWin.document.write("      if (cTone[toneSelected].checked == true)\n");
  tempWin.document.write("        break;\n");
  tempWin.document.write("    }\n");

if (DEBUG_CODE)
tempWin.document.write("    alert('toneSelected='+toneSelected+', traitIndex='+traitIndex);\n");

  tempWin.document.write("    toneTraitMod += toneTraitVals[toneSelected][traitIndex];\n");
  tempWin.document.write("  }\n");
  tempWin.document.write("\n");
  tempWin.document.write("  // Get the amount of credits that the player is willing to risk on this proposal\n");
  tempWin.document.write("  var curCredits = parseInt(document.getElementById('creditsCur').value,10);\n");
  tempWin.document.write("\n");
  tempWin.document.write("  // Use the cost of the deal and the value offered to calculate a percentage evaluation of the proposal\n");
  tempWin.document.write("  var evalPctPos = techTraitOffer + curCredits;\n");
  tempWin.document.write("  var evalPctNeg = dealCost + (techTraitCost * proposalMod[proposalCount]);\n");
  tempWin.document.write("  if (window.opener.cInfo[civNum][10][0] == true);\n");
  tempWin.document.write("    evalPctNeg -= Math.floor(evalPctNeg * 0.20); // reduce cost by 20% if player has NA Pact with neighbor civ\n");
  tempWin.document.write("  evalPct = (evalPctPos - evalPctNeg) + toneTraitMod;\n");
  tempWin.document.write("  var evalPctOrig = evalPct;\n");

if (DEBUG_EVAL)
tempWin.document.write("  alert('proposalCount='+proposalCount+', dealCost='+dealCost+', toneTraitMod='+toneTraitMod+', proposalMod='+proposalMod[proposalCount]+', techTraitCost='+techTraitCost+', techTraitOffer='+techTraitOffer+', curCredits='+curCredits+', evalPctPos='+evalPctPos+', evalPctNeg='+evalPctNeg+', evalPctOrig='+evalPctOrig+', evalPct='+evalPct);\n");

  tempWin.document.write("\n");
  tempWin.document.write("  // Insure that the final evaluation percentage is within required bounds\n");
  tempWin.document.write("  if (evalPct < 5)\n");
  tempWin.document.write("    evalPct = 5;\n");
  tempWin.document.write("  if (evalPct > 95)\n");
  tempWin.document.write("    evalPct = 95;\n");
  tempWin.document.write("\n");
  tempWin.document.write("  return(evalPct);\n");
  tempWin.document.write("}\n");
  tempWin.document.write("\n");

  tempWin.document.write("function evalDeal(civNum)\n");
  tempWin.document.write("{\n");
  tempWin.document.write("  var myCivNum = window.opener.pInfo[0][1];\n");
  tempWin.document.write("  // Advance evaluation counter by 1\n");
  tempWin.document.write("  window.opener.cInfo[civNum][11][0] += 1;\n");
  tempWin.document.write("  if ((window.opener.cInfo[civNum][11][0] == 1 && window.opener.cInfo[myCivNum][9] != 3) || window.opener.cInfo[civNum][11][0] > 1)\n");
  tempWin.document.write("  {\n");
  tempWin.document.write("    window.opener.bProposalEvaluated[civNum] = true;\n");
  tempWin.document.write("    eval_button.disabled = true;\n");
  tempWin.document.write("  }\n");
  tempWin.document.write("  evalPct = scoreDeal();\n");
  tempWin.document.write("\n");
  tempWin.document.write("  if (evalPct > 85)\n");
  tempWin.document.write("    dealEval = 0;\n");
  tempWin.document.write("  else if (evalPct > 40)\n");
  tempWin.document.write("    dealEval = 1;\n");
  tempWin.document.write("  else if (evalPct > 15)\n");
  tempWin.document.write("    dealEval = 2;\n");
  tempWin.document.write("  else\n");
  tempWin.document.write("    dealEval = 3;\n");
  tempWin.document.write("\n");
  tempWin.document.write("  // Display the civ's reaction to the player's proposal\n");
  tempWin.document.write("  var NPCPersonalityType = window.opener.cInfo[civNum][9];\n");
  tempWin.document.write("  var NPCCommentsBox = document.getElementById('NPCComments');\n");
  tempWin.document.write("  NPCCommentsBox.value += NPCEvalResponses[dealEval][NPCPersonalityType];\n");
  tempWin.document.write("  NPCCommentsBox.scrollTop = NPCCommentsBox.scrollHeight;\n");
  tempWin.document.write("}\n");
  tempWin.document.write("\n");

  tempWin.document.write("function endDeal(cDeal,cResC,cResP,cTone,prop_button,eval_button,proposeDeal)\n");
  tempWin.document.write("{\n");
  tempWin.document.write("  var civNum = window.opener.civNumGlobal;\n");
  tempWin.document.write("  var evalPct = 0;\n");
  tempWin.document.write("  var newDeal = -1;\n");
  tempWin.document.write("\n");
  tempWin.document.write("  if (proposeDeal == 1)\n");
  tempWin.document.write("  {\n");
  tempWin.document.write("    // Get deal number\n");
  tempWin.document.write("    for (var dealNum = 0; dealNum < 8; dealNum++)\n");
  tempWin.document.write("    {\n");
  tempWin.document.write("      if (cDeal[dealNum].checked == true)\n");
  tempWin.document.write("        newDeal = dealNum\n");
  tempWin.document.write("    }\n");
  tempWin.document.write("\n");
  tempWin.document.write("    evalPct = scoreDeal();\n");
  tempWin.document.write("\n");
  tempWin.document.write("    // Test to see whether the civ accepts the proposed deal\n");
  tempWin.document.write("    var acceptDeal = false;\n");
  tempWin.document.write("    var actualPct = window.opener.rand(0,100);\n");

if (DEBUG_EVAL)
tempWin.document.write("    alert('actualPct='+actualPct);\n");

  tempWin.document.write("    // The Evaluation Percentage is the ceiling for a percentage chance of success. For example, if the\n");
  tempWin.document.write("    // evalPct is 5%, and the actual randomly generated percentage is 23%, then the proposal fails. (If the\n");
  tempWin.document.write("    // failure is small, the player can try again; if the failure is large, the civ is so annoyed that no\n");
  tempWin.document.write("    // additional proposals are permitted that turn.) If the evalPct is 85%, and the randomly generated\n");
  tempWin.document.write("    // actual percentage is 23%, then the proposal succeeds.\n");
  tempWin.document.write("    if (actualPct < evalPct)\n");
  tempWin.document.write("      acceptDeal = true;\n");
  tempWin.document.write("    else\n");
  tempWin.document.write("      acceptDeal = false;\n");

  tempWin.document.write("\n");
  tempWin.document.write("    // Assess the evaluation result as one of the following possibilities:\n");
  tempWin.document.write("    //   Huge Success       (bonus to next deal attempt)\n");
  tempWin.document.write("    //   Acceptable Success\n");
  tempWin.document.write("    //   Marginal Failure\n");
  tempWin.document.write("    //   Insulting Failure  (civ will accept no more proposals from you this turn)\n");
  tempWin.document.write("    var dealEval = 0;\n");
  tempWin.document.write("    var dealDiff = evalPct - actualPct;\n");
  tempWin.document.write("    if (dealDiff > 50)\n");
  tempWin.document.write("      dealEval = 0; // huge success\n");
  tempWin.document.write("    else if (dealDiff > 0)\n");
  tempWin.document.write("      dealEval = 1; // acceptable success\n");
  tempWin.document.write("    else if (dealDiff > -50)\n");
  tempWin.document.write("      dealEval = 2; // marginal failure\n");
  tempWin.document.write("    else\n");
  tempWin.document.write("      dealEval = 3; // insulting failure\n");
  tempWin.document.write("\n");
  tempWin.document.write("    if (acceptDeal == false || newDeal != 3)\n");
  tempWin.document.write("    {\n");
  tempWin.document.write("      // Display the civ's reaction to the player's proposal\n");
  tempWin.document.write("      var NPCPersonalityType = window.opener.cInfo[civNum][9];\n");
  tempWin.document.write("      var NPCCommentsBox = document.getElementById('NPCComments');\n");
  tempWin.document.write("      NPCCommentsBox.value += NPCDealResponses[dealEval][NPCPersonalityType];\n");
  tempWin.document.write("      NPCCommentsBox.scrollTop = NPCCommentsBox.scrollHeight;\n");
  tempWin.document.write("    }\n");

  tempWin.document.write("\n");
  tempWin.document.write("    if (acceptDeal == true)\n");
  tempWin.document.write("    {\n");
  tempWin.document.write("      // Proposal was accepted, so set acceptance flag for this turn, and reset proposal counter\n");
  tempWin.document.write("      window.opener.bProposalAccepted = true;\n");
  tempWin.document.write("      window.opener.cInfo[civNum][7] = 0;\n");
  tempWin.document.write("\n");
  tempWin.document.write("      prop_button.style.background = '#999999'\n");
  tempWin.document.write("      prop_button.disabled = true;\n");
  tempWin.document.write("      eval_button.disabled = true;\n");
  tempWin.document.write("      for (var resNum = 0; resNum < window.opener.crll; resNum++)\n");
  tempWin.document.write("        cResC[resNum].disabled = true;\n");
  tempWin.document.write("      for (var resNum = 0; resNum < window.opener.prll; resNum++)\n");
  tempWin.document.write("        cResP[resNum].disabled = true;\n");
  tempWin.document.write("      for (var dealNum = 0, dlen = cDeals.length; dealNum < dlen; dealNum++)\n");
  tempWin.document.write("        cDeal[dealNum].disabled = true;\n");
  tempWin.document.write("      for (var toneNum = 0, tlen = cTones.length; toneNum < tlen; toneNum++)\n");
  tempWin.document.write("        cTone[toneNum].disabled = true;\n");
  tempWin.document.write("\n");
  tempWin.document.write("      // Write updated deal value for this civ back to the data structure\n");
  tempWin.document.write("      if (newDeal != -1 && newDeal != 3)\n");
  tempWin.document.write("        window.opener.cInfo[civNum][6][0][newDeal] = 1;\n");
  tempWin.document.write("\n");
  tempWin.document.write("      // Write selected resource values back to the civ and player data structures\n");
  tempWin.document.write("      if (civNum != window.opener.pInfo[0][1])\n");
  tempWin.document.write("      {\n");
  tempWin.document.write("        // Copy selected player resources to non-player civ\n");
  tempWin.document.write("        for (var resNum = 0; resNum < window.opener.prll; resNum++)\n");
  tempWin.document.write("        {\n");
  tempWin.document.write("          if (cResP[resNum].checked == true)\n");
  tempWin.document.write("            window.opener.cInfo[civNum][5][window.opener.playerResList[resNum]] = 1;\n");
  tempWin.document.write("        }\n");
  tempWin.document.write("        // Copy selected non-player resources to player civ\n");
  tempWin.document.write("        for (var resNum = 0; resNum < window.opener.crll; resNum++)\n");
  tempWin.document.write("        {\n");
  tempWin.document.write("          if (cResC[resNum].checked == true)\n");
  tempWin.document.write("            window.opener.cInfo[window.opener.pInfo[0][1]][5][window.opener.civResList[resNum]] = 1;\n");
  tempWin.document.write("        }\n");
  tempWin.document.write("      }\n");
  tempWin.document.write("\n");
  tempWin.document.write("      // Update total credits value onscreen and in global variable for player\n");
  tempWin.document.write("      var totCredits = parseInt(document.getElementById('creditsTot').value,10);\n");
  tempWin.document.write("      var curCredits = parseInt(document.getElementById('creditsCur').value,10);\n");
  tempWin.document.write("      totCredits = totCredits - curCredits;\n");
  tempWin.document.write("      document.getElementById('creditsTot').value = totCredits;\n");
  tempWin.document.write("      window.opener.pInfo[0][2] = totCredits;\n");
  tempWin.document.write("      window.opener.pctCreditsIndex = 0; // reset credits index to 0\n");
  tempWin.document.write("      document.getElementById('creditsCur').value = 0; // display updated current credits\n");
  tempWin.document.write("\n");
  tempWin.document.write("      // If Political Union accepted, show that civ is now aligned with human player\n");
  tempWin.document.write("      performDeal(civNum,newDeal);\n");
  tempWin.document.write("\n");
  tempWin.document.write("      window.opener.showInfluence();\n");
  tempWin.document.write("\n");
  tempWin.document.write("      window.opener.nt_button.style.background = '#22dd33';\n");
  tempWin.document.write("    }\n");
  tempWin.document.write("    else\n");
  tempWin.document.write("    {\n");
  tempWin.document.write("      // Proposal was not accepted, so advance proposal counter by 1\n");
  tempWin.document.write("      window.opener.cInfo[civNum][7] += 1;\n");
  tempWin.document.write("      switch (window.opener.cInfo[civNum][7])\n");
  tempWin.document.write("      {\n");
  tempWin.document.write("        case 1:\n");
  tempWin.document.write("          prop_button.style.background = '#eeee00'\n");
  tempWin.document.write("          break;\n");
  tempWin.document.write("        case 2:\n");
  tempWin.document.write("          prop_button.style.background = '#ee0000'\n");
  tempWin.document.write("          break;\n");
  tempWin.document.write("        default:\n");
  tempWin.document.write("        case 3:\n");
  tempWin.document.write("          prop_button.style.background = '#999999'\n");
  tempWin.document.write("          prop_button.disabled = true;\n");
  tempWin.document.write("          eval_button.disabled = true;\n");
  tempWin.document.write("          // Display the civ's reaction to the player's failed proposals\n");
  tempWin.document.write("          var NPCPersonalityType = window.opener.cInfo[civNum][9];\n");
  tempWin.document.write("          var NPCCommentsBox = document.getElementById('NPCComments');\n");
  tempWin.document.write("          NPCCommentsBox.value += NPCDealRejections[NPCPersonalityType];\n");
  tempWin.document.write("          NPCCommentsBox.scrollTop = NPCCommentsBox.scrollHeight;\n");
  tempWin.document.write("          break;\n");
  tempWin.document.write("      }\n");
  tempWin.document.write("    }\n");
  tempWin.document.write("\n");
  tempWin.document.write("    window.opener.dealCloseType = 1;\n");
//  tempWin.document.write("    this.close();\n");
  tempWin.document.write("  }\n");
  tempWin.document.write("}\n");
  tempWin.document.write("\n");

  tempWin.document.write("function adjourn()\n");
  tempWin.document.write("{\n");
  tempWin.document.write("  // Player canceled the negotiation with the target civ\n");
  tempWin.document.write("  window.opener.dealCloseType = 0;\n");
  tempWin.document.write("  this.close();\n");
  tempWin.document.write("}\n");
  tempWin.document.write("\n");

  tempWin.document.write("function performDeal(civNum, dealNum)\n");
  tempWin.document.write("{\n");
  tempWin.document.write("  switch (dealNum)\n");
  tempWin.document.write("  {\n");
  tempWin.document.write("    case 0: // First Contact\n");
  tempWin.document.write("      exposeTraits(civNum);\n");
  tempWin.document.write("      break;\n");
  tempWin.document.write("    case 1: // Trade Treaty\n");
  tempWin.document.write("      exposeTraits(civNum);\n");
  tempWin.document.write("      window.opener.pInfo[0][2] += bonusTradeTreaty; // add credits bonus for new Trade Treaty\n");
  tempWin.document.write("      document.getElementById('creditsTot').value = window.opener.pInfo[0][2]; // display new total credits\n");
  tempWin.document.write("      break;\n");
  tempWin.document.write("    case 2: // Consulate\n");
  tempWin.document.write("      exposeTraits(civNum);\n");
  tempWin.document.write("      exposeNeighborTraits();\n");
  tempWin.document.write("      break;\n");
  tempWin.document.write("    case 3: // Obtain Info\n");
  tempWin.document.write("      obtainInfo();\n");
  tempWin.document.write("      break;\n");
  tempWin.document.write("    case 4: // Research Treaty\n");
  tempWin.document.write("      exposeTraits(civNum);\n");
  tempWin.document.write("      break;\n");
  tempWin.document.write("    case 5: // Embassy\n");
  tempWin.document.write("      exposeTraits(civNum);\n");
  tempWin.document.write("      break;\n");
  tempWin.document.write("    case 6: // Non-Aggression Pact\n");
  tempWin.document.write("      exposeTraits(civNum);\n");
  tempWin.document.write("      reduceNeighborCosts(civNum);\n");
  tempWin.document.write("      break;\n");
  tempWin.document.write("    case 7: // Political Union\n");
  tempWin.document.write("      // This civ has joined the human player's civ\n");
  tempWin.document.write("      showAllTraits(civNum);\n");
  tempWin.document.write("      window.opener.cInfo[civNum][8] = 0;\n");
  tempWin.document.write("      for (var k=0; k < 7; k++)\n");
  tempWin.document.write("      {\n");
  tempWin.document.write("        window.opener.cInfo[civNum][6][1][k] = 0;\n");
  tempWin.document.write("        window.opener.cInfo[civNum][6][2][k] = 0;\n");
  tempWin.document.write("        window.opener.cInfo[civNum][6][3][k] = 0;\n");
  tempWin.document.write("      }\n");
  tempWin.document.write("      break;\n");
  tempWin.document.write("  }\n");
  tempWin.document.write("}\n");
  tempWin.document.write("\n");

  tempWin.document.write("function obtainInfo()\n");
  tempWin.document.write("{\n");
  tempWin.document.write("  var civTrait  = '';\n");
  tempWin.document.write("  var adjCivNum = -1;\n");
  tempWin.document.write("  var traitCount = -1;\n");
  tempWin.document.write("  var NPCRespStringXXX = '';\n");
  tempWin.document.write("  var NPCRespString = '';\n");
  tempWin.document.write("  var adjacentCivs = new Array();\n");
  tempWin.document.write("  var gridNum = window.opener.gridNumGlobal;\n");
  tempWin.document.write("  var glen = gridNeighbors[gridNum].length;\n");
  tempWin.document.write("  var myCivNum = window.opener.pInfo[0][1];\n");
  tempWin.document.write("  var NPCPersonalityType = window.opener.cInfo[myCivNum][9];\n");
  tempWin.document.write("\n");
  tempWin.document.write("  for (var k=0, j=0; k < glen; k++)\n");
  tempWin.document.write("    adjacentCivs[j++] = gridNeighbors[gridNum][k];\n");
  tempWin.document.write("  adjacentCivs.shuffleArray();\n");
  tempWin.document.write("\n");
  tempWin.document.write("  var traitNum = -1;\n");
  tempWin.document.write("  for (var i=0; i < glen; i++)\n");
  tempWin.document.write("  {\n");
  tempWin.document.write("    adjCivNum = window.opener.cBoxes[adjacentCivs[i]];\n");
  tempWin.document.write("    traitCount = window.opener.cInfo[adjCivNum][4][0];\n");
  tempWin.document.write("    if (traitCount < 8)\n");
  tempWin.document.write("    {\n");
  tempWin.document.write("      traitNum = window.opener.cInfo[adjCivNum][3][traitCount]; // get first unknown trait for this civ for the human player\n");
  tempWin.document.write("      break;\n");
  tempWin.document.write("    }\n");
  tempWin.document.write("  }\n");
  tempWin.document.write("\n");
  tempWin.document.write("  if (traitNum != -1)\n");
  tempWin.document.write("  {\n");
  tempWin.document.write("    window.opener.cInfo[adjCivNum][4][0] += 1;\n");
  tempWin.document.write("\n");
  tempWin.document.write("    if (window.opener.cInfo[adjCivNum][2][traitCount] == 0)\n");
  tempWin.document.write("      civTrait = cTraitsHi[traitNum];\n");
  tempWin.document.write("    else\n");
  tempWin.document.write("      civTrait = cTraitsLo[traitNum];\n");
  tempWin.document.write("\n");
  tempWin.document.write("    var gTArr = new Array('%civname%','%civtype%','%civtrait%');\n");
  tempWin.document.write("    var gVArr = new Array(cNames[window.opener.cInfo[adjCivNum][0]],cTypes[window.opener.cInfo[adjCivNum][1]],civTrait);\n");
  tempWin.document.write("    NPCRespString = window.opener.replaceText(NPCInfoResponses[1][NPCPersonalityType],gTArr,gVArr);\n");
  tempWin.document.write("\n");
  tempWin.document.write("  }\n");
  tempWin.document.write("  else\n");
  tempWin.document.write("    NPCRespString = NPCInfoResponses[0][NPCPersonalityType];\n");
  tempWin.document.write("\n");
  tempWin.document.write("  var NPCCommentsBox = document.getElementById('NPCComments');\n");
  tempWin.document.write("  NPCCommentsBox.value += NPCRespString;\n");
  tempWin.document.write("  NPCCommentsBox.scrollTop = NPCCommentsBox.scrollHeight;\n");
  tempWin.document.write("}\n");
  tempWin.document.write("\n");

  tempWin.document.write("function exposeNeighborTraits()\n");
  tempWin.document.write("{\n");
  tempWin.document.write("  // Expose the next trait for all civs neighboring the target civ\n");
  tempWin.document.write("  var adjacentCivs = new Array();\n");
  tempWin.document.write("  var gridNum = window.opener.gridNumGlobal;\n");
  tempWin.document.write("  var glen = gridNeighbors[gridNum].length;\n");
  tempWin.document.write("  for (var i=0; i < glen; i++)\n");
  tempWin.document.write("    exposeTraits(window.opener.cBoxes[gridNeighbors[gridNum][i]]);\n");
  tempWin.document.write("}\n");
  tempWin.document.write("\n");

  tempWin.document.write("function exposeTraits(civNum)\n");
  tempWin.document.write("{\n");
  tempWin.document.write("  // Expose the next trait for this civ for the human player if one is still available\n");
  tempWin.document.write("  var traitCount = window.opener.cInfo[civNum][4][0];\n");
  tempWin.document.write("  if (traitCount < 8)\n");
  tempWin.document.write("  {\n");
  tempWin.document.write("    window.opener.cInfo[civNum][4][0] += 1;\n");
  tempWin.document.write("\n");
  tempWin.document.write("    traitNum = window.opener.cInfo[civNum][3][traitCount]; // get index number of first unknown trait for this civ for the human player\n");
  tempWin.document.write("    if (window.opener.cInfo[civNum][2][traitCount] == 0)\n");
  tempWin.document.write("      cTrait = cTraitsHi[traitNum];\n");
  tempWin.document.write("    else\n");
  tempWin.document.write("      cTrait = cTraitsLo[traitNum];\n");
  tempWin.document.write("    var civTraitCell = document.getElementById('t'+traitCount);\n");

if (DEBUG_CODE)
tempWin.document.write("alert('civNum='+civNum+': civTraitCell['+traitCount+'] = '+cTrait);\n");

  tempWin.document.write("    if (civNum == window.opener.civNumGlobal)\n");
  tempWin.document.write("      civTraitCell.innerHTML = cTrait;\n");
  tempWin.document.write("  }\n");
  tempWin.document.write("}\n");
  tempWin.document.write("\n");

  tempWin.document.write("function showAllTraits(civNum)\n");
  tempWin.document.write("{\n");
  tempWin.document.write("  // Expose all traits for this civ for the human player\n");
  tempWin.document.write("  window.opener.cInfo[civNum][4][0] = 8;\n");
  tempWin.document.write("  for (var traitCount=1; traitCount < 8; traitCount++)\n");
  tempWin.document.write("  {\n");
  tempWin.document.write("\n");
  tempWin.document.write("    traitNum = window.opener.cInfo[civNum][3][traitCount];\n");
  tempWin.document.write("    if (window.opener.cInfo[civNum][2][traitCount] == 0)\n");
  tempWin.document.write("      cTrait = cTraitsHi[traitNum];\n");
  tempWin.document.write("    else\n");
  tempWin.document.write("      cTrait = cTraitsLo[traitNum];\n");
  tempWin.document.write("    var civTraitCell = document.getElementById('t'+traitCount);\n");
  tempWin.document.write("    civTraitCell.innerHTML = cTrait;\n");
  tempWin.document.write("  }\n");
  tempWin.document.write("}\n");
  tempWin.document.write("\n");

  tempWin.document.write("function reduceNeighborCosts()\n");
  tempWin.document.write("{\n");
  tempWin.document.write("  // Flag all civs neighboring the target civ as getting Non-Aggression Pact cost reduction\n");
  tempWin.document.write("  var adjacentCivs = new Array();\n");
  tempWin.document.write("  var gridNum = window.opener.gridNumGlobal;\n");
  tempWin.document.write("  for (var i=0, glen = gridNeighbors[gridNum].length; i < glen; i++)\n");
  tempWin.document.write("  {\n");
  tempWin.document.write("    var civNum = window.opener.cBoxes[gridNeighbors[gridNum][i]];\n");
  tempWin.document.write("    window.opener.cInfo[civNum][10][0] = true;\n");
  tempWin.document.write("  }\n");
  tempWin.document.write("}\n");
  tempWin.document.write("\n");

  tempWin.document.write("function pickDeal(cDeal, dealNum)\n");
  tempWin.document.write("{\n");
  tempWin.document.write("  // Pre-processing stub called when user clicks to pick a deal\n");
  tempWin.document.write("  if (cDeal[dealNum].checked == true)\n");
  tempWin.document.write("    ;\n");
  tempWin.document.write("  switch (dealNum)\n");
  tempWin.document.write("  {\n");
  tempWin.document.write("    case 0: // first contact\n");
  tempWin.document.write("      break;\n");
  tempWin.document.write("    case 1: // trade treaty\n");
  tempWin.document.write("      break;\n");
  tempWin.document.write("    case 2: // consulate\n");
  tempWin.document.write("      break;\n");
  tempWin.document.write("    case 3: // obtain info\n");
  tempWin.document.write("      break;\n");
  tempWin.document.write("    case 4: // research treaty\n");
  tempWin.document.write("      break;\n");
  tempWin.document.write("    case 5: // embassy\n");
  tempWin.document.write("      break;\n");
  tempWin.document.write("    case 6: // non-aggression pact\n");
  tempWin.document.write("      break;\n");
  tempWin.document.write("    case 7: // political alliance\n");
  tempWin.document.write("      break;\n");
  tempWin.document.write("  }\n");
  tempWin.document.write("}\n");
  tempWin.document.write("\n");

  tempWin.document.write("function pickCivResource(cResC,resNum)\n");
  tempWin.document.write("{\n");
  tempWin.document.write("  // Pre-processing stub called when user clicks to pick a target civ resource\n");
  tempWin.document.write("  if (cResC[resNum].checked == true)\n");
  tempWin.document.write("    ;\n");
  tempWin.document.write("}\n");
  tempWin.document.write("\n");

  tempWin.document.write("function pickPlayerResource(cResP,resNum)\n");
  tempWin.document.write("{\n");
  tempWin.document.write("  // Pre-processing stub called when user clicks to pick a player resource\n");
  tempWin.document.write("  if (cResP[resNum].checked == true)\n");
  tempWin.document.write("    ;\n");
  tempWin.document.write("}\n");
  tempWin.document.write("\n");

  tempWin.document.write("function pickTone(cTone,toneNum)\n");
  tempWin.document.write("{\n");
  tempWin.document.write("  // Pre-processing stub called when user clicks to pick a tone\n");
  tempWin.document.write("  if (cTone[toneNum].checked == true)\n");
  tempWin.document.write("    ;\n");
  tempWin.document.write("}\n");

  tempWin.document.write("function checkClose()\n");
  tempWin.document.write("{\n");
  tempWin.document.write("  // If dealCloseType is 2, the player closed the child window without clicking the Cancel button\n");
  tempWin.document.write("  if (window.opener.dealCloseType == 2)\n");
  tempWin.document.write("    endDeal(null,null,null,null,null,null,2);\n");
  tempWin.document.write("}\n");

  tempWin.document.write("function changeCredits(dir)\n");
  tempWin.document.write("{\n");
  tempWin.document.write("  // Possibly modify the current amount of credits being risked for a deal\n");
  tempWin.document.write("  var totCredits = parseInt(document.getElementById('creditsTot').value,10);\n");
  tempWin.document.write("  if (dir == -1)\n");
  tempWin.document.write("  {\n");
  tempWin.document.write("    if (window.opener.pctCreditsIndex > 0)\n");
  tempWin.document.write("      window.opener.pctCreditsIndex -= 1;\n");
  tempWin.document.write("  }\n");
  tempWin.document.write("  else\n");
  tempWin.document.write("  {\n");
  tempWin.document.write("    if (window.opener.pctCreditsIndex < 10)\n");
  tempWin.document.write("      window.opener.pctCreditsIndex += 1;\n");
  tempWin.document.write("  }\n");
  tempWin.document.write("  var curCredits = Math.floor(totCredits * window.opener.pctCreditsArray[window.opener.pctCreditsIndex]);\n");
  tempWin.document.write("  document.getElementById('creditsCur').value = curCredits;\n");
  tempWin.document.write("}\n");
  tempWin.document.write("\n");

  tempWin.document.write("//-->\n");
  tempWin.document.write("</SCR");
  tempWin.document.write("IPT>\n");

  tempWin.document.write("</HEAD>\n");

  tempWin.document.write("<BODY BGCOLOR='#222222' TEXT='FFFFFF' onBeforeUnload=checkClose()>\n");

  tempWin.document.write("<FONT FACE='Verdana' COLOR='white'>\n");

  tempWin.document.write("<FONT COLOR='"+civColor+"' SIZE='5'>\n");
  tempWin.document.write("<CENTER>");
  if (civNum == pInfo[0][1])
  {
    if (gameState == GS_AIP)
      tempWin.document.write("The Disappointing "); // highlight that player has clicked on his own civ after losing the game
    else
      tempWin.document.write("The Glorious "); // highlight that player has clicked on his own civ
  }
  tempWin.document.write(civName + " " + civType);
  if (bOwned == true)
    tempWin.document.write(" ("+ownerCivName + " " + ownerCivType+")");
  tempWin.document.write("</CENTER>\n");
  tempWin.document.write("</FONT>\n");

  tempWin.document.write("<TABLE ID='top_table' NAME='top_table' VALUE='top_table'>\n");
  tempWin.document.write("<TR>\n");

  //////////////
  // COLUMN 1 //
  //////////////
  tempWin.document.write("<TD STYLE='width:360px'>\n");

  //
  // TRAITS
  //
  tempWin.document.write("<CENTER><H3>CIV TRAITS</H3></CENTER>\n");

  // NOTE: The traits need to be displayed using DIV+CSS since doing it as a table caused IE not to display any cell with a width or other style defined
  tempWin.document.write("<style type='text/css'>\n");
  tempWin.document.write("  .row { clear: left; padding: 4px; font-size: 16px; }\n");
  tempWin.document.write("  .row label { float: left; width: 10em; }\n");
  tempWin.document.write("  {\n");
  tempWin.document.write("    width: 100%;\n");
  tempWin.document.write("    box-sizing: border-box;\n");
  tempWin.document.write("    -moz-box-sizing: border-box; -webkit-box-sizing: border-box; -khtml-box-sizing: border-box;\n");
  tempWin.document.write("  }\n");
  tempWin.document.write("</style>\n");

  for (var i = 0; i < 4; i++)
  {
    var cTrait0 = "?";
    var cTrait1 = "?";
    if (civNum == pInfo[0][1] || i*2 < cInfo[civNum][4][0]) // check civ is player's or if counter is less than number of civ traits known to human player
    {
      // Display trait
      if (cInfo[civNum][2][i*2] == 0)
        cTrait0 = cTraitsHi[cInfo[civNum][3][i*2]];
      else
        cTrait0 = cTraitsLo[cInfo[civNum][3][i*2]];
    }
    if (civNum == pInfo[0][1] || i*2+1 < cInfo[civNum][4][0]) // check civ is player's or if counter is less than number of civ traits known to human player
    {
      // Display trait
      if (cInfo[civNum][2][i*2+1] == 0)
        cTrait1 = cTraitsHi[cInfo[civNum][3][i*2+1]];
      else
        cTrait1 = cTraitsLo[cInfo[civNum][3][i*2+1]];
    }

    tempWin.document.write("<div class='row'>\n");
    tempWin.document.write("<label id=t"+(i*2)+" >"  +cTrait0+"</label>\n");
    tempWin.document.write("<label id=t"+(i*2+1)+" >"+cTrait1+"</label>\n");
    tempWin.document.write("</div>\n");
    tempWin.document.write("<BR />\n");
  }

  //
  // PORTRAIT
  //
  tempWin.document.write("<A><IMG SRC='portrait.png' /></A>\n");

  //
  // PROPOSED DEAL RESPONSE TEXT
  //
  var gTArr = new Array("%civname%","%civtype%");
  var civmode = 1; // civ is not the human player's
  var columns = 42;
  if (device == 2)
    columns -= 8; // iPhone text area needs to be less wide
  tempWin.document.write("<TEXTAREA ID='NPCComments' ROWS='6' COLS='"+columns+"' DISABLED='disabled' style='background:#222222; color:white; font-family:Calibri,Verdana,sans-serif; font-style:bold; font-size:16px;'>\n");

  if (civNum == pInfo[0][1])
    civmode = 0;
  else
    civmode = 1;
  // Initial civ greeting text
  var gText = "";
  var gVArr = new Array(civName,civType);
  var mainGreeting = "";
  if (gameState == GS_AIP)
    mainGreeting = replaceText(NPCGreetings[3],"","");
  else
    mainGreeting = replaceText(NPCGreetings[civmode][civStyle],gTArr,gVArr);
  var firstLetter = "";
  if (bOwned == true)
  {
    gVArr = new Array(ownerCivName,ownerCivType);
    gText = replaceText(NPCGreetings[2][civStyle],gTArr,gVArr);

    firstLetter = mainGreeting.substring(0,1).toLowerCase();
    mainGreeting = firstLetter + mainGreeting.substring(1);
  }
  gText += mainGreeting;
  tempWin.document.write(gText);

  tempWin.document.write("</TEXTAREA>\n");

  tempWin.document.write("</TD>\n");

  //////////////
  // COLUMN 2 //
  //////////////
  tempWin.document.write("<TD STYLE='width:340px'>\n");

  //
  // CIV'S RESOURCES
  //
  if (civNum != pInfo[0][1])
    tempWin.document.write("<CENTER><H3>THEIR RESOURCES</H3></CENTER>\n");
  else
    tempWin.document.write("<CENTER><H3>&nbsp;</H3></CENTER>\n");
  tempWin.document.write("<DIV STYLE='overflow:auto; -webkit-overflow-scrolling:touch; height:155px'>\n");
  tempWin.document.write("<TABLE CELLPADDING='0' CELLSPACING='0'>\n");
  tempWin.document.write("<TR>\n");
  tempWin.document.write("<TD>\n");
  tempWin.document.write("<FONT SIZE='2'>\n");

  // Display resource info for selected non-player civ
  var crColor = "white";
  for (i = 0, llen = civResList.length; i < llen; i++)
  {
    crColor = "white";
    tempWin.document.write("<INPUT TYPE='checkbox' ID='cResC' NAME='cResC' VALUE='"+i+"'");
    if (civNum == pInfo[0][1] || resourceOwned(pInfo[0][1],civResList[i]) == true)
    {
      tempWin.document.write(" DISABLED='disabled'");
      crColor = "gray";
    }
    tempWin.document.write(" onClick='pickCivResource(cResC,"+i+")'>");
    tempWin.document.write("<FONT COLOR='"+crColor+"'>");
    tempWin.document.write(cResources[civResList[i]]);
    tempWin.document.write("</FONT>");
    tempWin.document.write("<BR />\n");
  }
  tempWin.document.write("</FONT>\n");
  tempWin.document.write("</TD>\n");
  tempWin.document.write("</TR>\n");
  tempWin.document.write("</TABLE>\n");
  tempWin.document.write("</DIV>\n");

  //
  // PLAYER'S RESOURCES
  //
  tempWin.document.write("<CENTER><H3>OUR RESOURCES</H3></CENTER>\n");
  tempWin.document.write("<DIV STYLE='overflow:auto; -webkit-overflow-scrolling:touch; height:155px'>\n");
  tempWin.document.write("<TABLE CELLPADDING='0' CELLSPACING='0'>\n");
  tempWin.document.write("<TR>\n");
  tempWin.document.write("<TD>\n");
  tempWin.document.write("<FONT SIZE='2'>\n");

  // Display resource info for player civ
  var prColor = "white";
  for (i = 0, llen = playerResList.length; i < llen; i++)
  {
    prColor = "white";
    tempWin.document.write("<INPUT TYPE='checkbox' ID='cResP' NAME='cResP' VALUE='"+i+"'");
    if (civNum == pInfo[0][1] || resourceOwned(civNum,playerResList[i]) == true)
    {
      tempWin.document.write(" DISABLED='disabled'");
      prColor = "gray";
    }
    tempWin.document.write(" onClick='pickPlayerResource(cResP,"+i+")'>");
    tempWin.document.write("<FONT COLOR='"+prColor+"'>");
    tempWin.document.write(cResources[playerResList[i]]);
    tempWin.document.write("</FONT>");
    tempWin.document.write("<BR />\n");
  }
  tempWin.document.write("</FONT>\n");
  tempWin.document.write("</TD>\n");
  tempWin.document.write("</TR>\n");
  tempWin.document.write("</TABLE>\n");
  tempWin.document.write("</DIV>\n");

  //
  // CIV'S OTHER DEALS
  //
  var fontsize = "2";
  var civColorDeal = new Array(civColorText[civColors[cInfo[pInfo[1][1]][8]]],civColorText[civColors[cInfo[pInfo[2][1]][8]]],civColorText[civColors[cInfo[pInfo[3][1]][8]]]);
  var civNameDeal  = new Array(cNames[cInfo[pInfo[1][1]][0]],cNames[cInfo[pInfo[2][1]][0]],cNames[cInfo[pInfo[3][1]][0]]);
  var civTypeDeal  = new Array(cTypes[cInfo[pInfo[1][1]][1]],cTypes[cInfo[pInfo[2][1]][1]],cTypes[cInfo[pInfo[3][1]][1]]);
  var highDealNum = new Array(getHighestDeal(civNum,1),getHighestDeal(civNum,2),getHighestDeal(civNum,3));
  var civDealName = new Array();
  if (pInfo[1][1] == civNum)
    civDealName[0] = "Home Civ";
  else if (highDealNum[0] == -1)
    civDealName[0] = "[No Contact]";
  else
    civDealName[0] = cDeals[highDealNum[0]];
  if (pInfo[2][1] == civNum)
    civDealName[1] = "Home Civ";
  else if (highDealNum[1] == -1)
    civDealName[1] = "[No Contact]";
  else
    civDealName[1] = cDeals[highDealNum[1]];
  if (pInfo[3][1] == civNum)
    civDealName[2] = "Home Civ";
  else if (highDealNum[2] == -1)
    civDealName[2] = "[No Contact]";
  else
    civDealName[2] = cDeals[highDealNum[2]];
  var clen1 = civNameDeal[0].length + civTypeDeal[0].length + civDealName[0].length + 2;
  var clen2 = civNameDeal[1].length + civTypeDeal[1].length + civDealName[1].length + 2;
  var clen3 = civNameDeal[2].length + civTypeDeal[2].length + civDealName[2].length + 2;
  var clen = clen1;
  if (clen2 > clen)
    clen = clen2;
  if (clen3 > clen)
    clen = clen3;
  if (clen > 35)
    fontsize = "1";
  else if (clen > 30)
    fontsize = "2";
  else
    fontsize = "3";
  tempWin.document.write("<CENTER>\n");
  tempWin.document.write("<H3>DEAL STATUSES</H3>\n");
  tempWin.document.write("<TABLE>\n");
  for (var j=0; j < 3; j++)
  {
    tempWin.document.write("<TR>\n");
    tempWin.document.write("<TD STYLE='text-align:left'><FONT SIZE='"+fontsize+"' COLOR='"+civColorDeal[j]+"'>"+civNameDeal[j]+" "+civTypeDeal[j]+"</FONT></TD>\n");
    tempWin.document.write("<TD><FONT SIZE='"+fontsize+"' COLOR='white'>"+civDealName[j]+"</FONT></TD>\n");
    tempWin.document.write("</TR>\n");
  }
  tempWin.document.write("</TABLE>\n");
  tempWin.document.write("</CENTER>\n");

  tempWin.document.write("</TD>\n");

  //////////////
  // COLUMN 3 //
  //////////////
  tempWin.document.write("<TD STYLE='width:300px'>\n");

  //
  // DEALS
  //
  tempWin.document.write("<CENTER><H3>DEALS</H3></CENTER>\n");
  tempWin.document.write("<FONT SIZE='2'>\n");
  var dColor = "white";
  for (var i = 0; i < cDeals.length; i++)
  {
    dColor = "white";
    tempWin.document.write("<INPUT TYPE='radio' ID='cDeal' NAME='cDeal' VALUE='"+i+"'");
    if (civNum == pInfo[0][1])
    {
      tempWin.document.write(" DISABLED='disabled' CHECKED='checked'");
      dColor = "gray";
    }
    else
    {
      if (i == 3) // Obtain Info deal?
      {
        if (cInfo[civNum][6][0][2] == 1) // Consulate deal achieved?
        {
          // Obtain Info deal is always available once Consulate deal has been accepted
          lastDealChecked = i;
          if (cInfo[civNum][6][0][7] == 1)
            tempWin.document.write(" CHECKED='checked'"); // once Political Union is achieved, Obtain Info is the only deal always available
        }
        else
        {
          tempWin.document.write(" DISABLED='disabled'");
          dColor = "gray";
        }
      }
      else
      {
        if (cInfo[civNum][6][0][i] == 1)
        {
          lastDealChecked = i;
          tempWin.document.write(" DISABLED='disabled'");
          dColor = "gray";
        }
        else
        {
          if (i > lastDealChecked+1)
          {
            tempWin.document.write(" DISABLED='disabled'");
            dColor = "gray";
          }
          else
            tempWin.document.write(" CHECKED='checked'"); // select by default the next available deal (will always skip the "Obtain Info" deal, else would get stuck there)
        }
      }
    }
    tempWin.document.write(" onClick='pickDeal(cDeal,"+i+")'>");
    tempWin.document.write("<FONT COLOR='"+dColor+"'>");
    tempWin.document.write(cDeals[i]);
    tempWin.document.write("</FONT>");
    tempWin.document.write("<BR />\n");
  }
  tempWin.document.write("</FONT>\n");

  //
  // DEAL TIME REMAINING
  //
  tempWin.document.write("<CENTER>\n");
  tempWin.document.write("<FONT SIZE='2' COLOR='#555555'>Time Remaining: 6 turns</FONT>\n");
  tempWin.document.write("</CENTER>\n");

  //
  // TONE
  //
  tempWin.document.write("<CENTER><H3>TONE</H3></CENTER>\n");
  tempWin.document.write("<DIV STYLE='overflow:auto; -webkit-overflow-scrolling:touch; height:120px'>\n");
  tempWin.document.write("<TABLE CELLPADDING='0' CELLSPACING='0'>\n");
  tempWin.document.write("<TR>\n");
  tempWin.document.write("<TD>\n");
  tempWin.document.write("<FONT SIZE='2'>\n");
  var tColor = "white";
  for (var i = 0; i < cTones.length; i++)
  {
    tColor = "white";
    tempWin.document.write("<INPUT TYPE='radio' ID='cTone' NAME='cTone' VALUE='"+i+"'");
    if (civNum == pInfo[0][1])
    {
      tempWin.document.write(" DISABLED='disabled'");
      tColor = "gray";
    }
    if (i == 0)
      tempWin.document.write(" CHECKED='checked'"); // select "Neutral" tone by default
    tempWin.document.write(" onClick='pickTone(cTone,"+i+")'>");
    tempWin.document.write("<FONT COLOR='"+tColor+"'>");
    tempWin.document.write(cTones[i]);
    tempWin.document.write("</FONT>");
    tempWin.document.write("<BR />\n");
  }
  tempWin.document.write("</FONT>\n");
  tempWin.document.write("</TD>\n");
  tempWin.document.write("</TR>\n");
  tempWin.document.write("</TABLE>\n");
  tempWin.document.write("</DIV>\n");

  //
  // CREDITS
  //
  tempWin.document.write("<CENTER>\n");
  tempWin.document.write("<H3>CREDITS</H3>\n");
  tempWin.document.write("<P>\n");

  tempWin.document.write("<INPUT TYPE='BUTTON' VALUE='-'");
  if (civNum == pInfo[0][1])
    tempWin.document.write(" DISABLED='disabled'");
  tempWin.document.write(" onClick='changeCredits(-1)' />\n");

//  tempWin.document.write("<BUTTON");
//  if (civNum == pInfo[0][1])
//    tempWin.document.write(" DISABLED='disabled'");
//  tempWin.document.write(" onClick='changeCredits(-1)'><B>-</B></BUTTON>\n");

  tempWin.document.write("&nbsp;\n");

//  tempWin.document.write("<FONT COLOR='blue'>█████</FONT>");
//  tempWin.document.write("<FONT COLOR='white'>██████████</FONT>");

//  tempWin.document.write("");

  tempWin.document.write("<INPUT ID='creditsCur' TYPE='text' STYLE='background-color: #CCCCCC; color: #000000' SIZE='6' MAXLENGTH='6' VALUE='0' />\n");
  tempWin.document.write("&nbsp;/&nbsp;\n");
  tempWin.document.write("<INPUT ID='creditsTot' TYPE='text' STYLE='background-color: #222222; color: #eeeeee' SIZE='6' VALUE='"+pInfo[0][2]+"' DISABLED='disabled' />\n");

  tempWin.document.write("<INPUT TYPE='BUTTON' VALUE='+'");
  if (civNum == pInfo[0][1])
    tempWin.document.write(" DISABLED='disabled'");
  tempWin.document.write(" onClick='changeCredits(1)' />\n");

//  tempWin.document.write("<BUTTON");
//  if (civNum == pInfo[0][1])
//    tempWin.document.write(" DISABLED='disabled'");
//  tempWin.document.write(" onClick='changeCredits(1)'><B>+</B></BUTTON>\n");

//tempWin.document.write("<INPUT TYPE='range' MIN='0' MAX='100' STEP='1' VALUE='25' /\n"); // slider works in HTML5+ only

  tempWin.document.write("</P>\n");
  tempWin.document.write("</CENTER>\n");

  //
  // CANCEL/PROPOSE BUTTONS
  //
  tempWin.document.write("<CENTER>\n");

  tempWin.document.write("<BUTTON ID='eval_button' NAME='eval_button' STYLE='padding: 4px; font: bold 14px Arial; background-color: #999999; border-radius: 40px'");
  if (ownerPlayerNum != 4 || bProposalEvaluated[civNumGlobal] == true)
    tempWin.document.write(" DISABLED='disabled'");
  tempWin.document.write(" onClick='evalDeal("+civNumGlobal+")'><B>Eval</B></BUTTON>\n");

  tempWin.document.write("&nbsp;");

  tempWin.document.write("<BUTTON ID='prop_button' NAME='prop_button' STYLE='padding: 4px; font: bold 14px Arial; border-radius: 40px");
  if (ownerPlayerNum != 4 || bProposalAccepted == true || cInfo[civNumGlobal][7] > 2 || isCivInNeighborList(0,civNum) == false)
    tempWin.document.write("; background-color: #999999' DISABLED='disabled'");
  else
    tempWin.document.write("; background-color: #00ee00'");
  tempWin.document.write(" onClick='endDeal(cDeal,cResC,cResP,cTone,prop_button,eval_button,1)'><B>Propose</B></BUTTON>\n");

  tempWin.document.write("&nbsp;");

  tempWin.document.write("<BUTTON STYLE='padding: 4px; font: bold 14px Arial; background-color: #999999; border-radius: 40px' onClick='adjourn()'><B>Adjourn</B></BUTTON>\n");

  tempWin.document.write("</CENTER>\n");

  tempWin.document.write("</TD>\n");

  tempWin.document.write("</TR>\n");
  tempWin.document.write("</TABLE>\n");

  tempWin.document.write("</FONT>\n");

  tempWin.document.write("</BODY>");
}

function mouseOver(cell)
{
if (DEBUG_CODE)
alert("mouseOver cell "+cell+", value="+cBoxes[cell]);
}

function mouseOut(cell)
{
}

function helpWin()
{
  // Help info for game

  alert("Welcome to Space Diplomat!\n\n" +
        "This is a work-in-progress game for one to four human or computer players.\n\n" +
        "Good luck!");
}

function waitFunction()
{
  // Null function called when images are loaded
  ;
}

//-->
