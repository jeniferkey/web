<!--
//
// RANDOMNESS SUPPORT FUNCTIONS
//

// Language enhancements (required for member references)
Array.prototype.shuffleArray = shuffleArray;

// Initialize random number generator
RandNum = new randomNumberGenerator();

function floatFix(Val, Places)
{
  var Res = "" + Math.floor(Val * Math.pow(10,Places));
  var Dec = Res.length - Places;

  if (Places != 0)
    OutString = Res.substring(0,Dec) + "." + Res.substring(Dec,Res.length);
  else
    OutString = Res;

  return(parseInt(OutString));
}

function randomNumberGenerator()
{
  // Assign initial seed value and define constants

  var D = new Date();
  this.seed = 123459876 + (D.getSeconds() * 0xFFFFFF) + (D.getMinutes() * 0xFFFF);

  this.A = 16807;
  this.M = 2147483647;
  this.Q = floatFix(this.M / this.A, 0);
  this.R = this.M % this.A;
  this.oneOverM = 1.0 / this.M;
  this.Mask = 123459876;
  this.next = nextRandomNumber;
}

function nextRandomNumber()
{
  // Calculate a random number between 0 (inclusive) and 1 (exclusive)
  // using the Park-Miller multiplicative congruential algorithm with
  // Schrage's method for computing the necessary modulo function.
  // (This algorithm is documented on page 279 of _Numerical Recipes in
  // C, 2nd Edition_ by Press, Teukolsky, Vetterling and Flannery.)

  this.seed ^= this.Mask;

  var Hi = floatFix(this.seed / this.Q, 0);
  var Lo = floatFix(this.seed - Hi * this.Q, 0);

  this.seed = this.A * Lo - this.R * Hi;

  if (this.seed < 0)
    this.seed += this.M;

  var rval = this.oneOverM * this.seed;

  this.seed ^= this.Mask;

  return(rval);
}

function rand(lbound,ubound)
{
  // Return a random number whose potential range is from a lower bound
  // (lbound) to an upper bound (ubound), inclusive on both ends.

  return(lbound + floatFix((ubound - lbound + 1) * RandNum.next(), 0));
}

function shuffleArray()
{
  // "Sorts" values of array into semi-random order
  var tempSlot;
  var randomNumber;

  for (var i=0; i < this.length; i++)
  {
    randomNumber = Math.floor(Math.random() * this.length);
    tempSlot = this[i];
    this[i] = this[randomNumber];
    this[randomNumber] = tempSlot;
  }
}
//-->
