const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const _ = require("lodash");
const { getCollection } = require("lokijs-promise");
const { winningBid, platformFee } = require("../utils.js");

const COLLECTION_NAME = "auction";

router.get("/acitve", async (req, res) => {
  const auction = await getCollection(COLLECTION_NAME);
  const activeAuctions = auction.find({ isActive: { $eq: true } });
  console.log("active auctions", activeAuctions);
  res.json({ auctions: activeAuctions });
});

router.post("/create", async (req, res) => {
  const auction = await getCollection(COLLECTION_NAME);
  const user = await getCollection('users');
  const id = uuidv4();
  const isPresent = auction.find({ _id: id });
  const [seller] = user.find({_id: req.body.sellerId});
  if (isPresent.length !== 0) {
    res.status(400).json({ message: "auction already created" });
  } else if (seller === undefined || seller.role === 'buyer') {
      res.status(401).json({message: 'you dont have access to create an auction'});
  }else {
    const defaultValues = {
      _id: id,
      startDate: new Date(),
      endDate: "",
      isActive: true,
      bids: []
    };
    const newAuction = Object.assign(req.body, defaultValues);
    try {
      const createAuction = auction.insert(newAuction);
      res.json({
        message: "auction created successfully",
        auction: createAuction
      });
    } catch (e) {
      console.log("something went wrong while creating auction", e);
      res.json({ message: "something went wrong" });
    }
  }
});

router.post("/close", async (req, res) => {
  const auction = await getCollection(COLLECTION_NAME);
  const auctionId = req.body.auctionId;
  const [auctionToUpdate] = auction.find({ _id: auctionId });

  if (auctionToUpdate !== undefined) {
    auctionToUpdate.endDate = new Date();
    auctionToUpdate.isActive = false;
    auctionToUpdate.winner = winningBid(auctionToUpdate.bids);
    auctionToUpdate.platformFee = platformFee(auctionToUpdate.winner);
    auction.update(auctionToUpdate);
    res.json({
      message: "bid closed",
      winner: auctionToUpdate.winner,
      fees: auctionToUpdate.platformFee
    });
  } else {
    res.json({ message: "auction doesn't exists" });
  }
});

router.post("/bid", async (req, res) => {
  const auction = await getCollection(COLLECTION_NAME);
  const auctionId = req.body.auctionId;
  const bid = req.body.bid;
  const buyer = req.body.userId;

  const [auctionToBid] = auction.find({ _id: auctionId });
  if (auctionToBid !== undefined) {
    const buyerIndex = _.findIndex(auctionToBid.bids, { buyerId: buyer });
    if (buyerIndex >= 0) {
      auctionToBid.bids[buyerIndex].bidAmount = bid;
    } else {
      auctionToBid.bids.push({
        buyerId: buyer,
        bidAmount: bid
      });
    }
    try {
      const update = auction.update(auctionToBid);
      console.log("update", update);
      res.json({ message: "bid placed!!" });
    } catch (e) {
      res.json({ message: "something went workng while placing bid" });
    }
  } else {
    res.json({ message: "Auction doesn't exists to bid" });
  }
});

router.post("/withdraw", async (req, res) => {
  const auction = await getCollection(COLLECTION_NAME);
  const buyerId = req.body.userId;
  const auctionId = req.body.auctionId;
  const [auctionToUpdate] = auction.find({ _id: auctionId });
  if (!auctionToUpdate !== undefined) {
    const buyerIndex = _.findIndex(auctionToUpdate.bids, { buyerId: buyerId });
    console.log("buyerindex to remove", buyerIndex);
    if (buyerIndex >= 0) {
      auctionToUpdate.bids.splice(buyerIndex, 1);
      try {
        auction.update(auctionToUpdate);
        res.json({ message: "withdraw success" });
      } catch (e) {
        res.json({ message: "something went wrong, please try again" });
      }
    } else {
      res.json({ message: "you have not placed any bid for this" });
    }
  } else {
    res.json({ message: "auction not found" });
  }
});

router.get("/:sellerId", async (req, res) => {
  const auction = await getCollection(COLLECTION_NAME);
  const sellerId = req.params.sellerId;
  const sellerAuctions = auction.find({ sellerId: sellerId });
  res.json({ message: "auction created by seller", auctions: sellerAuctions });
});

router.get("/statment/:auctionId", async (req, res) => {
  const auction = await getCollection(COLLECTION_NAME);
  const auctionId = req.params.auctionId;
  const [closedAuction] = auction.find({ _id: auctionId });
  console.log('closed auction', closedAuction);
  if (closedAuction !== undefined) {
    console.log('numbers' )
    const sellerWinnging = parseInt(closedAuction.winner.bidAmount) - parseInt(closedAuction.platformFee);
    const platformWinning = closedAuction.platformFee;
    console.log("seller winning", sellerWinnging);
    console.log("platform winning", platformWinning);
    auction.update(closedAuction);
    res.json({
      message: `P&L statement for ${auctionId}`,
      sellerWinnging,
      platformWinning
    });
  } else {
    res.json({
      message: "the auction is not completed yet to prepare statment"
    });
  }
});
module.exports = router;
