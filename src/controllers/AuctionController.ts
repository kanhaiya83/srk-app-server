import { Request, Response } from 'express';
import { PrismaClient, Prisma, AuctionStatus  } from '@prisma/client';
// import { authenticateVendor } from '../middlewares/authenticateVendor';

const prisma = new PrismaClient();
async function manageAuction(auctionId: string): Promise<void> {
  // Fetch the auction document
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: { bids: true }
  });

  if (!auction) {
    throw new Error('Auction not found');
  }

  const currentTime = new Date();
  const startTime = auction.start_time;
  const secondRoundStartTime = auction.second_round_start_time;
  const firstRoundDurationMs = auction.first_round_duration * 60 * 1000; // Convert minutes to milliseconds
  const firstRoundBidPeriodMs = auction.first_round_bid_period * 1000; // Convert seconds to milliseconds
  const secondRoundDurationMs = auction.second_round_duration ? auction.second_round_duration * 60 * 1000 : 0; // Convert minutes to milliseconds
  const auctionEndTimeFirstRound = new Date(startTime.getTime() + firstRoundDurationMs);
  const auctionEndTimeSecondRound = new Date(auctionEndTimeFirstRound.getTime() + secondRoundDurationMs);

  // Check if the auction should be opened
  if (auction.current_round ==1 && startTime <= currentTime && auction.auction_status === AuctionStatus.Pending) {
    await prisma.auction.update({
      where: { id: auctionId },
      data: { auction_status: AuctionStatus.Open }
    });
  }
  if (auction.current_round ==2 && secondRoundStartTime <= currentTime && auction.auction_status === AuctionStatus.Pending) {
    await prisma.auction.update({
      where: { id: auctionId },
      data: { auction_status: AuctionStatus.Open }
    });
  }

  
  // Sort bids by timestamp descending
  const sortedBids = auction.bids.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  const lastBid = sortedBids[0];

  if (!auction.is_two_rounds || auction.current_round === 1) {
    // Single round or first round logic
    if (lastBid && currentTime.getTime() - lastBid.timestamp.getTime() > firstRoundBidPeriodMs) {
      console.log("closing1");
      if (auction.is_two_rounds && auction.current_round === 1) {
        await qualifyTopBidders(auctionId, auction.first_round_qualifiers_count!);
      } else {
        await closeAuction(auctionId);
      }
      return;
    }

    if (currentTime >= auctionEndTimeFirstRound) {
      console.log("closing2");
      if (auction.is_two_rounds && auction.current_round === 1) {
        await qualifyTopBidders(auctionId, auction.first_round_qualifiers_count!);
      } else {
        await closeAuction(auctionId);
      }
    }
  } else if (auction.current_round === 2) {
    // Second round logic
    const secondRoundBidPeriodMs = auction.second_round_bid_period ? auction.second_round_bid_period * 1000 : 0;

    if (lastBid && currentTime.getTime() - lastBid.timestamp.getTime() > secondRoundBidPeriodMs) {
      console.log("closing3");
      await closeAuction(auctionId);
      return;
    }

    if (currentTime >= auctionEndTimeSecondRound) {
      console.log("closing4");
      await closeAuction(auctionId);
    }
  }
}

async function qualifyTopBidders(auctionId: string, qualifiersCount: number): Promise<void> {
  // Fetch the auction again to ensure we're working with the latest data
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: { bids: true }
  });

  if (!auction) {
    throw new Error('Auction not found');
  }

  // Sort bids by amount descending
  const sortedBids = auction.bids.sort((a, b) => b.amount - a.amount);
  const topBidders = sortedBids.slice(0, qualifiersCount).map(bid => bid.vendorId);

  // Update auction status to second round and set qualifiers
  await prisma.auction.update({
    where: { id: auctionId },
    data: {
      first_round_qualifiers: { connect: topBidders.map(id => ({ id })) },
      participants:{set:topBidders.map(id => ({ id })) },
      current_round: 2,
      bids: {
        deleteMany: {}
      },
      auction_status:"Pending"
    }
  });
}

async function closeAuction(auctionId: string): Promise<void> {
  // Fetch the auction again to ensure we're working with the latest data
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: { bids: true }
  });

  if (!auction) {
    throw new Error('Auction not found');
  }

  // Determine the top bidder
  const topBid = auction.bids.sort((a, b) => b.amount - a.amount)[0];

  // Update auction status to Closed and set the winner
  await prisma.auction.update({
    where: { id: auctionId },
    data: {
      auction_status: AuctionStatus.Closed,
      winner: topBid ? { connect: { id: topBid.vendorId } } : undefined,
    }
  });
}
setInterval(async ()=>{
  const auctions = await prisma.auction.findMany({
    include: {
      creator: true,
      participants: true,
      bids: true,
    },
    where:{
      auction_status:{
        not:"Closed"
      }
    }
  });

  auctions.forEach(auc=>{
    console.log("managing auc.id:",auc.id)
    manageAuction(auc.id)
  })
},1000)

export class AuctionController {
  async create(req: Request, res: Response) {
    try {
      // @ts-expect-error feef
      const vendorId = req.vendorId; // Attached by authenticateVendor
      req.body.start_time = req.body.start_time || new Date(new Date().getTime() + 60 *1000)
      const auctionData: Prisma.AuctionCreateInput = {
        ...req.body,
        second_round_start_time:new Date(new Date(req.body.start_time).getTime() + req.body.first_round_duration*60*1000 + 30*1000) ,
        creator: {
          connect: { id: vendorId },
        },
      };
      console.log(req.body)

      const newAuction = await prisma.auction.create({ data: auctionData });
       res.status(201).json(newAuction);
       return
    } catch (error) {
      console.error('Error creating auction:', error);
       res.status(500).json({ error: 'Internal server error' });
       return
    }
  }


 
  async findOne(req: Request, res: Response) {
    try {
      const auctionId = req.params.id
      // await manageAuction(auctionId)
      const auction = await prisma.auction.findUnique({
        where: { id: auctionId },
        include: {
          creator: true,
          participants: true,
          bids: true,
        },
      });

      if (!auction) {
         res.status(404).json({ error: 'Auction not found' });
         return
      }

       res.status(200).json(auction);
       return
    } catch (error) {
      console.error('Error finding auction:', error);
       res.status(500).json({ error: 'Internal server error' });
       return
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      const auctions = await prisma.auction.findMany({
        include: {
          creator: true,
          participants: true,
          bids: true,
        },
      });
       res.status(200).json(auctions);
       return
    } catch (error) {
      console.error('Error finding all auctions:', error);
       res.status(500).json({ error: 'Internal server error' });
       return
    }
  }

  async me(req: Request, res: Response) {
    try {
      // @ts-expect-error feef
      const vendorId = req.vendorId;
      const myAuctions = await prisma.auction.findMany({
        where: { creatorId: vendorId },
        include: {
          creator: true,
          participants: true,
        },
      });
       res.status(200).json(myAuctions);
       return
    } catch (error) {
      console.error('Error fetching user auctions:', error);
       res.status(500).json({ error: 'Internal server error' });
       return
    }
  }

  async participated(req: Request, res: Response) {
    try {
      // @ts-expect-error feef
      const vendorId = req.vendorId;
      const { filter } = req.query; // 'upcoming' or 'gone'

      const now = new Date();
      let whereClause: Prisma.AuctionWhereInput = {
        participants: {
          some: {
            id: vendorId,
          },
        },
      };

      if (filter === 'upcoming') {
        whereClause = {
          ...whereClause,
          start_time: {
            gte: now,
          },
        };
      } else if (filter === 'gone') {
        whereClause = {
          ...whereClause,
          start_time: {
            lt: now,
          },
        };
      }

      const participatedAuctions = await prisma.auction.findMany({
        where: whereClause,
        include: {
          creator: true,
          participants: true,
        },
      });
       res.status(200).json(participatedAuctions);
       return
    } catch (error) {
      console.error('Error fetching participated auctions:', error);
       res.status(500).json({ error: 'Internal server error' });
       return
    }
  }

  async search(req: Request, res: Response) {
    try {
      const {  grade, location, start_time } = req.query;

      const whereClause: Prisma.AuctionWhereInput = {};

      // if (commodity) {
      //   whereClause.commodity = {
      //     contains: commodity as string,
      //     mode: 'insensitive',
      //   };
      // }

      if (grade) {
        whereClause.grade = {
          contains: grade as string,
          mode: 'insensitive',
        };
      }

      if (location) {
        whereClause.location = {
          contains: location as string,
          mode: 'insensitive',
        };
      }

      if (start_time) {
        // You might need to adjust this depending on how you want to handle date ranges
        whereClause.start_time = {
          gte: new Date(start_time as string),
        };
      }
      // if (auction_type) {
      //   whereClause.auction_type = {
      //     contains: auction_type as string,
      //     mode: 'insensitive',
      //   };
      // }

      const searchResults = await prisma.auction.findMany({
        where: whereClause,
        include: {
          creator: true,
          participants: true,
        },
      });
       res.status(200).json(searchResults);
       return
    } catch (error) {
      console.error('Error searching auctions:', error);
       res.status(500).json({ error: 'Internal server error' });
       return
    }
  }

  async update(req: Request, res: Response) {
    try {
      // @ts-expect-error feef
      const vendorId = req.vendorId;
      const auctionId = req.params.id
      const auctionData: Prisma.AuctionUpdateInput = req.body;

      // Verify that the vendor is the creator of the auction
      const auction = await prisma.auction.findUnique({
        where: { id: auctionId },
      });

      if (!auction || auction.creatorId !== vendorId) {
         res.status(403).json({ error: 'Forbidden: You are not the creator of this auction' });
         return
      }

      const updatedAuction = await prisma.auction.update({
        where: { id: auctionId },
        data: auctionData,
      });

       res.status(200).json(updatedAuction);
       return
    } catch (error) {
      console.error('Error updating auction:', error);
       res.status(500).json({ error: 'Internal server error' });
       return
    }
  }
  async participateInAuction(req: Request, res: Response) {
    try {
      // @ts-expect-error feef
      const vendorId = req.vendorId;
      const auctionId = req.params.id

      const auction = await prisma.auction.findUnique({
        where: { id: auctionId },
      });

      if (!auction) {
         res.status(404).json({ error: 'Auction not found' }); // Auction not found
         return
      }

      if (auction.creatorId === vendorId) {
        res.status(400).json({ error: 'You cannot participate in your own auction' }); // Cannot participate in own auction
        return
     }
     if (new Date().getTime() >new Date(auction.start_time).getTime()) {
        res.status(400).json({ error: 'Auction has started' }); // Cannot participate in own auction
        return
     }

      const vendor = await prisma.user.findUnique({
        where: { id: vendorId },
      });

      if (!vendor) {
         res.status(404).json({ error: 'Vendor not found' }); // Vendor not found
         return
      }

      if (vendor.notional_amount < auction.min_notional_entry) {
         res.status(400).json({ error: 'Insufficient notional amount to participate' }); // Insufficient notional amount
         return
      }

      // if (auction.participants.some(participant => participant.id === vendorId)) {
      //    res.status(400).json({ error: 'Already participating in this auction' }); // Already participating
      //    return
      // }

      await prisma.$transaction([
        prisma.auction.update({
          where: { id: auctionId },
          data: {
            participants: {
              connect: { id: vendorId },
            },
          },
        }),
        prisma.user.update({
          where: { id: vendorId },
          data: {
            notional_amount: {
              decrement: auction.min_notional_entry,
            },
          },
        }),
      ]);

       res.status(200).json({ message: 'Successfully participated in the auction' });
       return
    } catch (error) {
      console.error('Error participating in auction:', error);
       res.status(500).json({ error: 'Internal server error' });
       return
    }
  }

  async leaveAuction(req: Request, res: Response) {
    try {
      // @ts-expect-error feef
      const vendorId = req.vendorId;
      const auctionId = req.params.id

      const auction = await prisma.auction.findUnique({
        where: { id: auctionId },
        include: {
          participants: true,
        },
      });

      if (!auction) {
         res.status(404).json({ error: 'Auction not found' }); // Auction not found
         return
      }

      if (!auction.participants.some(participant => participant.id === vendorId)) {
         res.status(400).json({ error: 'Not participating in this auction' }); // Not participating
         return
      }

      await prisma.$transaction([
        prisma.auction.update({
          where: { id: auctionId },
          data: {
            participants: {
              disconnect: { id: vendorId },
            },
          },
        }),
        prisma.user.update({
          where: { id: vendorId },
          data: {
            notional_amount: {
              increment: auction.min_notional_entry,
            },
          },
        }),
      ]);

       res.status(200).json({ message: 'Successfully left the auction' });
       return
    } catch (error) {
      console.error('Error leaving auction:', error);
       res.status(500).json({ error: 'Internal server error' });
       return
    }
  }

  async bidOnAuction(req: Request, res: Response) {
    try {
      // @ts-expect-error feef
      const vendorId = req.vendorId;
      const auctionId = req.params.id
      const { amount } = req.body;

      const auction = await prisma.auction.findUnique({
        where: {
          id: auctionId,
        },
        select: {
          participants: {
            where: {
              id: vendorId,
            },
            select: {
              id: true,
            },
          },
        },
      });

      if (!auction) {
         res.status(404).json({ error: 'Auction not found' }); // Auction not found
         return
      }
      if (auction.participants.length ==0) {
        res.status(400).json({ error: 'Bidding not allowed' }); // Auction not found
        return
     }
      // if (auction.auction_status !== 'Open') {
      //    res.status(400).json({ error: 'Bidding is not allowed in the current auction status' }); // Bidding not allowed
      //    return
      // }

      // Check if a bid already exists for the user and auction
      
      const existingBid = await prisma.bid.findFirst({
        where: {
          auctionId: auctionId,
          vendorId: vendorId,
        },
      });

      if (existingBid) {
        // Update the existing bid
        const updatedBid = await prisma.bid.update({
          where: { id: existingBid.id },
          data: { amount,timestamp:new Date() },
        });

         res.status(200).json(updatedBid);
         return
      } else {
        // Create a new bid
        const newBid = await prisma.bid.create({
          data: {
            amount,
            auction: { connect: { id: auctionId } },
            vendor: { connect: { id: vendorId } },
          },
        });

         res.status(201).json(newBid);
         return
      }
    } catch (error) {
      console.error('Error bidding on auction:', error);
       res.status(500).json({ error: 'Internal server error' });
       return
    }
  }

  async bidOnAuctionTest(req: Request, res: Response) {
    try {
      const auctionId = req.params.id
      const { amount,vendorId } = req.body;

      const auction = await prisma.auction.findUnique({
        where: { id: auctionId },
      });

      if (!auction) {
         res.status(404).json({ error: 'Auction not found' }); // Auction not found
         return
      }
      await prisma.$transaction([
        prisma.auction.update({
          where: { id: auctionId },
          data: {
            participants: {
              connect: { id: vendorId },
            },
          },
        }),
        prisma.user.update({
          where: { id: vendorId },
          data: {
            notional_amount: {
              decrement: auction.min_notional_entry,
            },
          },
        }),
      ]);

      if(auction.auction_status != "Open"){
        res.send({message:"You participated in auction"})
        return
      }

      // if (auction.auction_status !== 'Open') {
      //    res.status(400).json({ error: 'Bidding is not allowed in the current auction status' }); // Bidding not allowed
      //    return
      // }

      // Check if a bid already exists for the user and auction
      const existingBid = await prisma.bid.findFirst({
        where: {
          auctionId: auctionId,
          vendorId: vendorId,
        },
      });

      if (existingBid) {
        // Update the existing bid
        const updatedBid = await prisma.bid.update({
          where: { id: existingBid.id },
          data: { amount,timestamp:new Date() },
        });

         res.status(200).json(updatedBid);
         return
      } else {
        // Create a new bid
        const newBid = await prisma.bid.create({
          data: {
            amount,
            auction: { connect: { id: auctionId } },
            vendor: { connect: { id: vendorId } },
          },
        });

         res.status(201).json(newBid);
         return
      }
    } catch (error) {
      console.error('Error bidding on auction:', error);
       res.status(500).json({ error: 'Internal server error' });
       return
    }
  }
}