import { Request, Response } from 'express';
import { PrismaClient, Auction, Prisma  } from '@prisma/client';
import { authenticateVendor } from '../middlewares/authenticateVendor';

const prisma = new PrismaClient();

export class AuctionController {
  async create(req: Request, res: Response) {
    try {
      const vendorId = req.vendorId; // Attached by authenticateVendor
      const auctionData: Prisma.AuctionCreateInput = {
        ...req.body,
        creator: {
          connect: { id: vendorId },
        },
      };

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
      const auctionId = parseInt(req.params.id, 10);
      const auction = await prisma.auction.findUnique({
        where: { id: auctionId },
        include: {
          creator: true,
          participants: true,
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
      const { commodity, grade, location, start_time, auction_type } = req.query;

      let whereClause: Prisma.AuctionWhereInput = {};

      if (commodity) {
        whereClause.commodity = {
          contains: commodity as string,
          mode: 'insensitive',
        };
      }

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
      if (auction_type) {
        whereClause.auction_type = {
          contains: auction_type as string,
          mode: 'insensitive',
        };
      }

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
      const vendorId = req.vendorId;
      const auctionId = parseInt(req.params.id, 10);
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
      const vendorId = req.vendorId;
      const auctionId = parseInt(req.params.id, 10);

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

      const vendor = await prisma.vendorUser.findUnique({
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
        prisma.vendorUser.update({
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
      const vendorId = req.vendorId;
      const auctionId = parseInt(req.params.id, 10);

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
        prisma.vendorUser.update({
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
      const vendorId = req.vendorId;
      const auctionId = parseInt(req.params.id, 10);
      const { amount } = req.body;

      const auction = await prisma.auction.findUnique({
        where: { id: auctionId },
      });

      if (!auction) {
         res.status(404).json({ error: 'Auction not found' }); // Auction not found
         return
      }

      if (auction.auction_status !== 'Open') {
         res.status(400).json({ error: 'Bidding is not allowed in the current auction status' }); // Bidding not allowed
         return
      }

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
          data: { amount },
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