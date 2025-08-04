import { db } from '../drizzle'
import { trades, p2pListings, battles, userTradingStats } from '../schema'
import type { User } from '../schema'

export async function seedTrades(users: {
  adminUser: User
  testUser1: User
  testUser2: User
  proUser: User
  enterpriseUser: User
}) {
  console.log('Seeding trades and P2P listings...')

  // Create P2P listings
  await db.insert(p2pListings).values([
    {
      userId: users.testUser1.id,
      listingType: 'sell',
      tokenOffered: 'ETH',
      amount: '5.0',
      pricePerUnit: '2500',
      minAmount: '0.1',
      maxAmount: '5.0',
      paymentMethods: ['bank_transfer', 'paypal'],
      isActive: true
    },
    {
      userId: users.testUser2.id,
      listingType: 'buy',
      tokenOffered: 'ETH',
      amount: '2.0',
      pricePerUnit: '2480',
      minAmount: '0.05',
      maxAmount: '2.0',
      paymentMethods: ['bank_transfer'],
      isActive: true
    },
    {
      userId: users.proUser.id,
      listingType: 'sell',
      tokenOffered: 'BTC',
      amount: '0.5',
      pricePerUnit: '65000',
      minAmount: '0.001',
      maxAmount: '0.5',
      paymentMethods: ['bank_transfer', 'wise'],
      isActive: true
    },
    {
      userId: users.enterpriseUser.id,
      listingType: 'buy',
      tokenOffered: 'USDT',
      amount: '10000',
      pricePerUnit: '1.0',
      minAmount: '100',
      maxAmount: '10000',
      paymentMethods: ['bank_transfer', 'paypal', 'wise'],
      isActive: true
    },
    {
      userId: users.adminUser.id,
      listingType: 'sell',
      tokenOffered: 'XTZ',
      amount: '1000',
      pricePerUnit: '1.5',
      minAmount: '10',
      maxAmount: '1000',
      paymentMethods: ['crypto', 'bank_transfer'],
      isActive: true
    }
  ])

  // Create trades
  await db.insert(trades).values([
    {
      escrowId: 1,
      chainId: 128123, // Etherlink Testnet
      buyerId: users.testUser2.id,
      sellerId: users.testUser1.id,
      amount: '0.5',
      currency: 'ETH',
      tradeType: 'p2p',
      status: 'completed',
      metadata: {
        paymentMethod: 'bank_transfer',
        completionTime: '45 minutes',
        rating: 5
      },
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    },
    {
      escrowId: 2,
      chainId: 128123,
      buyerId: users.proUser.id,
      sellerId: users.testUser1.id,
      amount: '1.0',
      currency: 'ETH',
      tradeType: 'p2p',
      status: 'completed',
      metadata: {
        paymentMethod: 'paypal',
        completionTime: '30 minutes',
        rating: 5
      },
      completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
    },
    {
      escrowId: 3,
      chainId: 128123,
      buyerId: users.enterpriseUser.id,
      sellerId: users.proUser.id,
      amount: '0.1',
      currency: 'BTC',
      tradeType: 'p2p',
      status: 'completed',
      metadata: {
        paymentMethod: 'wise',
        completionTime: '1 hour',
        rating: 4
      },
      completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
    },
    {
      escrowId: 4,
      chainId: 128123,
      buyerId: users.testUser1.id,
      sellerId: users.enterpriseUser.id,
      amount: '500',
      currency: 'USDT',
      tradeType: 'p2p',
      status: 'funded',
      metadata: {
        paymentMethod: 'bank_transfer'
      }
    },
    {
      escrowId: 5,
      chainId: 128123,
      buyerId: users.testUser2.id,
      sellerId: users.adminUser.id,
      amount: '100',
      currency: 'XTZ',
      tradeType: 'p2p',
      status: 'disputed',
      metadata: {
        paymentMethod: 'crypto',
        disputeReason: 'Payment not received'
      }
    }
  ])

  // Create battles
  await db.insert(battles).values([
    {
      player1Id: users.testUser1.id,
      player2Id: users.testUser2.id,
      winnerId: users.testUser1.id,
      player1CP: 250,
      player2CP: 150,
      feeDiscountPercent: 25,
      discountExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Expires tomorrow
    },
    {
      player1Id: users.proUser.id,
      player2Id: users.enterpriseUser.id,
      winnerId: users.enterpriseUser.id,
      player1CP: 1500,
      player2CP: 3000,
      feeDiscountPercent: 25,
      discountExpiresAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // Expired 1 hour ago
    },
    {
      player1Id: users.adminUser.id,
      player2Id: users.proUser.id,
      winnerId: users.adminUser.id,
      player1CP: 5000,
      player2CP: 1500,
      feeDiscountPercent: 25,
      discountExpiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000) // Expires in 12 hours
    },
    {
      player1Id: users.testUser1.id,
      player2Id: users.enterpriseUser.id,
      winnerId: users.enterpriseUser.id,
      player1CP: 250,
      player2CP: 3000,
      feeDiscountPercent: 25,
      discountExpiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // Expired 2 days ago
    },
    {
      player1Id: users.testUser2.id,
      player2Id: users.proUser.id,
      winnerId: users.proUser.id,
      player1CP: 150,
      player2CP: 1500,
      feeDiscountPercent: 25,
      discountExpiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000) // Expires in 6 hours
    }
  ])

  // Create trading stats
  await db.insert(userTradingStats).values([
    {
      userId: users.adminUser.id,
      totalTrades: 50,
      successfulTrades: 48,
      totalVolume: '150000',
      avgCompletionTime: 35, // minutes
      disputesWon: 2,
      disputesLost: 0,
      rating: 5
    },
    {
      userId: users.testUser1.id,
      totalTrades: 15,
      successfulTrades: 14,
      totalVolume: '25000',
      avgCompletionTime: 45,
      disputesWon: 1,
      disputesLost: 0,
      rating: 5
    },
    {
      userId: users.testUser2.id,
      totalTrades: 8,
      successfulTrades: 7,
      totalVolume: '12000',
      avgCompletionTime: 50,
      disputesWon: 0,
      disputesLost: 1,
      rating: 4
    },
    {
      userId: users.proUser.id,
      totalTrades: 30,
      successfulTrades: 29,
      totalVolume: '85000',
      avgCompletionTime: 40,
      disputesWon: 1,
      disputesLost: 0,
      rating: 5
    },
    {
      userId: users.enterpriseUser.id,
      totalTrades: 75,
      successfulTrades: 73,
      totalVolume: '500000',
      avgCompletionTime: 30,
      disputesWon: 2,
      disputesLost: 0,
      rating: 5
    }
  ])

  console.log(
    'Trades, P2P listings, battles, and trading stats seeded successfully'
  )
}
