import { PrismaClient, RoleType } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedAPMCData() {
  try {
    // First create locations for APMCs
    const locations = await Promise.all([
      prisma.location.create({
        data: {
          title: 'Unjha',
        },
      }),
      prisma.location.create({
        data: {
          title: 'Rajkot',
        },
      }),
      prisma.location.create({
        data: {
          title: 'Gondal',
        },
      }),
    ]);

    // Create APMC admins
    const apmcAdmins = await Promise.all([
      prisma.aPMCAdmin.create({
        data: {
          id:"fdc6afbe-af8c-4c3f-8ace-31453349d645",
          name: 'Shyam Jaju',
          mobile_number: '+919828527448',
        },
      }),

      prisma.aPMCAdmin.create({
        data: {
          id:"fdc6afbe-af8c-4c3f-8ace-313cty69d675",
          name: 'Sourabh',
          mobile_number: '+919766132327',
        },
      }),
      prisma.aPMCAdmin.create({
        data: {
          id:"fdc6afbe-af8c-4c3f-8ace-313c8349d61d",
          name: 'Suresh Shah',
          mobile_number: '+918209033423',
        },
      }),
    ]);

    const apmcs = await Promise.all([
      prisma.aPMC.create({
        data: {
          name:"Jodhpur APMC",
          location: {
            connect: { id: locations[0].id },
          },
          admins: {
            connect: [{ id: apmcAdmins[2].id },{ id: apmcAdmins[0].id },{ id: apmcAdmins[1].id }],
          },
        },
      }),
      prisma.aPMC.create({

        data: {
          name:"Rajkot APMC",
          location: {
            connect: { id: locations[1].id },
          },
          admins: {
            connect: [{ id: apmcAdmins[2].id },{ id: apmcAdmins[1].id }],
          },
        },
      }),
      prisma.aPMC.create({
        data: {
          name:"Gondal APMC",
          location: {
            connect: { id: locations[2].id },
          },
          admins: {
            connect: [{ id: apmcAdmins[2].id },{ id: apmcAdmins[0].id }],
          },
        },
      }),
    ]);

    // Create 30 users (10 for each APMC) with random roles
    const users = [];
    for (let apmcIndex = 0; apmcIndex < apmcs.length; apmcIndex++) {
      const apmcIndexFinal = apmcIndex
      for (let i = 0; i < Math.floor(Math.random() * 10) + 5; i++) {
        // Randomly decide if user should have one or two roles
        const shouldHaveBothRoles = Math.random() < 0.3; // 30% chance of having both roles
        
        // Create base roles array with at least one role
        const rolesToCreate = [];
        
        if (shouldHaveBothRoles) {
          // Add both roles
          rolesToCreate.push(
            {
              type: RoleType.buyer,
              is_approved: Math.random() < 0.5,
              assignment_date: new Date(),
              permissions: [],
              apmc: {
                connect: { id: apmcs[apmcIndexFinal].id }
              }
            },
            {
              type: RoleType.seller,
              is_approved: Math.random() < 0.5,
              assignment_date: new Date(),
              permissions: [],
              apmc: {
                connect: { id: apmcs[apmcIndexFinal].id }
              }
            }
          );
        } else {
          // Add just one random role
          const randomRole = Math.random() < 0.5 ? RoleType.buyer : RoleType.seller;
          rolesToCreate.push({
            type: randomRole,
            is_approved: Math.random() < 0.5,
            assignment_date: new Date(),
            permissions: [],
            apmc: {
              connect: { id: apmcs[apmcIndexFinal].id }
            }
          });
        }

        const user = await prisma.user.create({
          data: {
            first_name: `User${apmcIndexFinal * 10 + i + 1}`,
            last_name: `LastName${apmcIndexFinal * 10 + i + 1}`,
            mobile_number: `${Math.floor(9000000000 + Math.random() * 1000000000)}`,
            notional_amount: Math.floor(50000 + Math.random() * 450000),
            is_verified: true,
            roles: {
              create: rolesToCreate
            }
          }
        });
        users.push(user);
      }
    }

    console.log('Demo APMC data seeded successfully!');
    return { locations, apmcAdmins, apmcs, users };
  } catch (error) {
    console.error('Error seeding APMC data:', error);
    throw error;
  }
}

async function seedCommodities() {
  const commodities = await Promise.all([
    prisma.commodity.create({
      data: {
        title: "Wheat",
        image: `https://picsum.photos/seed/wheat123/200`
      }
    }),
    prisma.commodity.create({
      data: {
        title: "Rice",
        image: `https://picsum.photos/seed/rice456/200`
      }
    }),
    prisma.commodity.create({
      data: {
        title: "Corn",
        image: `https://picsum.photos/seed/corn789/200`
      }
    }),
    prisma.commodity.create({
      data: {
        title: "Soybeans",
        image: `https://picsum.photos/seed/soy101/200`
      }
    }),
    prisma.commodity.create({
      data: {
        title: "Cotton",
        image: `https://picsum.photos/seed/cotton202/200`
      }
    }),
    prisma.commodity.create({
      data: {
        title: "Peanuts",
        image: `https://picsum.photos/seed/peanut303/200`
      }
    })
  ]);

  console.log('Demo commodities seeded successfully!');
  return commodities;
}

async function seedShopsAndSlots() {
  try {
    // Get all APMCs and commodities
    const apmcs = await prisma.aPMC.findMany();
    const commodities = await prisma.commodity.findMany();

    // First create APMCCommodity connections
    for (const apmc of apmcs) {
      await Promise.all(
        commodities.map(commodity => 
          prisma.aPMCCommodity.create({
            data: {
              apmc_id: apmc.id,
              commodity_id: commodity.id,
              disabled: Math.random() > 0.8 // 20% chance of being disabled
            }
          })
        )
      );
    }

    for (const apmc of apmcs) {
      // Create 5 shops for each APMC
      const shops = await Promise.all(
        Array.from({ length: 5 }, async (_, i) => {
          // Randomly select 2-6 commodities for each shop
          const numCommodities = Math.floor(Math.random() * 5) + 2; // Random number between 2-6
          const selectedCommodities = commodities
            .sort(() => Math.random() - 0.5) // Shuffle commodities
            .slice(0, numCommodities); // Take first 2-6 commodities

          return prisma.shop.create({
            data: {
              name: `Shop ${i + 1} - ${apmc.name}`,
              apmc_id: apmc.id,
              commodities: {
                connect: selectedCommodities.map(c => ({ id: c.id }))
              }
            },
          });
        })
      );

      // Create 10 slots for each APMC
      const now = new Date();
      for (let i = 0; i < 10; i++) {
        const startTime = new Date(now);
        startTime.setDate(now.getDate() + (i < 5 ? i : 0));
        startTime.setHours(9, 0, 0, 0);

        const endTime = new Date(startTime);
        endTime.setHours(17, 0, 0, 0);

        const participateBefore = new Date(startTime);
        participateBefore.setDate(startTime.getDate() - 1);

        // Randomly select 2-4 shops for this slot
        const numShopsForSlot = Math.floor(Math.random() * 3) + 2;
        const selectedShops = shops
          .sort(() => Math.random() - 0.5)
          .slice(0, numShopsForSlot);

        // Randomly select one commodity for the slot
        const randomCommodity = commodities[Math.floor(Math.random() * commodities.length)];
        const d  =new Date(new Date().setHours(0,0,0,0))
        if(i < 5){
          d.setDate(d.getDate() - 1)
        }
        await prisma.slot.create({

          data: {
            day: d,
            start_time: startTime,
            end_time: endTime,
            participate_before: participateBefore,
            apmc_id: apmc.id,
            commodity_id: randomCommodity.id,
            shops_eligible: {
              connect: selectedShops.map(shop => ({ id: shop.id })),
            },
            shops_participated: {
              connect: selectedShops.map(shop => ({ id: shop.id })),
            },
          },
        });
      }
    }

    console.log('Demo shops and slots data seeded successfully!');
  } catch (error) {
    console.error('Error seeding shops and slots data:', error);
    throw error;
  }
}

// Modify the main execution to run all seeding functions
async function seedAllData() {
  await seedCommodities();
  await seedAPMCData();
  await seedShopsAndSlots();
}

seedAllData();
