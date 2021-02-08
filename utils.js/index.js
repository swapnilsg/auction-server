const _ = require("lodash");
function winningBid(bids = []) {
  const bidAmountCounts = _.countBy(bids, bid => bid.bidAmount);
  const uniqueBids = Object.keys(bidAmountCounts).filter(
    bid => bidAmountCounts[bid] === 1
  );
  const maxBid = _.max(uniqueBids);
  const winner = _.find(bids, bid => bid.bidAmount === maxBid);
  console.log("unique bids", uniqueBids, "winner", winner);
  return winner;
}

function platformFee(winningBid) {
  const fees = (winningBid.bidAmount * 5) / 100;
  console.log("platform fees for this bid", fees);
  return fees;
}

module.exports = {
  winningBid,
  platformFee
};
