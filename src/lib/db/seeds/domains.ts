import { db } from '../drizzle'
import { escrowListings, trades } from '../schema'
import type { User } from '../schema'

export async function seedDomains(users: {
  adminUser: User
  testUser1: User
  testUser2: User
  proUser: User
  enterpriseUser: User
}) {
  console.log('Seeding domain listings and trades...')

  // Create domain listings
  await db.insert(escrowListings).values([
    {
      userId: users.adminUser.id,
      listingCategory: 'domain',
      listingType: 'sell',
      amount: '5000', // Price in USD
      metadata: {
        domainName: 'cryptoexchange.com',
        registrar: 'GoDaddy',
        expiryDate: '2025-12-15',
        monthlyTraffic: 15000,
        monthlyRevenue: 2500,
        description: 'Premium crypto exchange domain with established traffic',
        transferMethod: 'push',
        includesWebsite: false,
        category: 'cryptocurrency'
      },
      isActive: true
    },
    {
      userId: users.proUser.id,
      listingCategory: 'domain',
      listingType: 'sell',
      amount: '15000',
      metadata: {
        domainName: 'defiprotocol.io',
        registrar: 'Namecheap',
        expiryDate: '2026-03-20',
        monthlyTraffic: 45000,
        monthlyRevenue: 8500,
        description:
          'High-traffic DeFi domain with active community and revenue',
        transferMethod: 'escrow',
        includesWebsite: true,
        websiteStack: 'Next.js, TypeScript, Tailwind',
        category: 'defi'
      },
      isActive: true
    },
    {
      userId: users.testUser1.id,
      listingCategory: 'domain',
      listingType: 'sell',
      amount: '2500',
      metadata: {
        domainName: 'nftmarketplace.xyz',
        registrar: 'GoDaddy',
        expiryDate: '2025-08-10',
        monthlyTraffic: 8000,
        monthlyRevenue: 0,
        description:
          'Brandable NFT marketplace domain, perfect for new projects',
        transferMethod: 'push',
        includesWebsite: false,
        category: 'nft'
      },
      isActive: true
    },
    {
      userId: users.enterpriseUser.id,
      listingCategory: 'domain',
      listingType: 'sell',
      amount: '50000',
      metadata: {
        domainName: 'blockchain.ai',
        registrar: 'GoDaddy',
        expiryDate: '2027-01-01',
        monthlyTraffic: 120000,
        monthlyRevenue: 35000,
        description:
          'Premium two-word domain combining blockchain and AI trends',
        transferMethod: 'escrow',
        includesWebsite: true,
        websiteStack: 'React, Node.js, PostgreSQL, Redis',
        socialMedia: {
          twitter: '@blockchainai',
          followers: 25000
        },
        category: 'technology'
      },
      isActive: true
    },
    {
      userId: users.testUser2.id,
      listingCategory: 'domain',
      listingType: 'sell',
      amount: '750',
      metadata: {
        domainName: 'web3gaming.net',
        registrar: 'Namecheap',
        expiryDate: '2025-05-30',
        monthlyTraffic: 2000,
        monthlyRevenue: 0,
        description: 'Gaming-focused Web3 domain, ideal for GameFi projects',
        transferMethod: 'push',
        includesWebsite: false,
        category: 'gaming'
      },
      isActive: true
    },
    {
      userId: users.adminUser.id,
      listingCategory: 'domain',
      listingType: 'sell',
      amount: '8500',
      metadata: {
        domainName: 'smartcontracts.dev',
        registrar: 'Cloudflare',
        expiryDate: '2026-09-15',
        monthlyTraffic: 35000,
        monthlyRevenue: 5000,
        description:
          'Developer-focused domain with educational content and tools',
        transferMethod: 'escrow',
        includesWebsite: true,
        websiteStack: 'Vue.js, Express, MongoDB',
        emailList: 3500,
        category: 'development'
      },
      isActive: true
    },
    {
      userId: users.proUser.id,
      listingCategory: 'domain',
      listingType: 'sell',
      amount: '3200',
      metadata: {
        domainName: 'cryptowallet.app',
        registrar: 'GoDaddy',
        expiryDate: '2025-11-22',
        monthlyTraffic: 12000,
        monthlyRevenue: 1500,
        description: 'Mobile-friendly crypto wallet domain with .app extension',
        transferMethod: 'push',
        includesWebsite: false,
        category: 'cryptocurrency'
      },
      isActive: true
    },
    {
      userId: users.enterpriseUser.id,
      listingCategory: 'domain',
      listingType: 'sell',
      amount: '125000',
      metadata: {
        domainName: 'meta.exchange',
        registrar: 'GoDaddy',
        expiryDate: '2028-06-01',
        monthlyTraffic: 250000,
        monthlyRevenue: 75000,
        description:
          'Ultra-premium exchange domain with metaverse branding potential',
        transferMethod: 'escrow',
        includesWebsite: true,
        websiteStack: 'Next.js, Rust, PostgreSQL, Kubernetes',
        activeUsers: 45000,
        appDownloads: 120000,
        category: 'exchange'
      },
      isActive: false // Sold or inactive
    }
  ])

  // Create domain trades
  await db.insert(trades).values([
    {
      escrowId: 101,
      chainId: 128123, // Etherlink Testnet
      buyerId: users.testUser2.id,
      sellerId: users.adminUser.id,
      amount: '5000',
      currency: 'USD',
      tradeType: 'domain',
      listingCategory: 'domain',
      status: 'completed',
      metadata: {
        domainName: 'cryptoexchange.com',
        transferMethod: 'push',
        completionTime: '2 hours',
        rating: 5,
        escrowAgent: 'Escrow.com'
      },
      completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
    },
    {
      escrowId: 102,
      chainId: 128123,
      buyerId: users.enterpriseUser.id,
      sellerId: users.testUser1.id,
      amount: '2500',
      currency: 'USD',
      tradeType: 'domain',
      listingCategory: 'domain',
      status: 'completed',
      metadata: {
        domainName: 'nftmarketplace.xyz',
        transferMethod: 'push',
        completionTime: '1 hour',
        rating: 5
      },
      completedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15 days ago
    },
    {
      escrowId: 103,
      chainId: 128123,
      buyerId: users.adminUser.id,
      sellerId: users.proUser.id,
      amount: '15000',
      currency: 'USD',
      tradeType: 'domain',
      listingCategory: 'domain',
      status: 'funded',
      metadata: {
        domainName: 'defiprotocol.io',
        transferMethod: 'escrow',
        includesWebsite: true,
        inspectionPeriod: 3 // days
      },
      depositedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // Deposited 2 days ago
    },
    {
      escrowId: 104,
      chainId: 128123,
      buyerId: users.testUser1.id,
      sellerId: users.enterpriseUser.id,
      amount: '50000',
      currency: 'USD',
      tradeType: 'domain',
      listingCategory: 'domain',
      status: 'payment_sent',
      metadata: {
        domainName: 'blockchain.ai',
        transferMethod: 'escrow',
        includesWebsite: true,
        wireTransfer: true,
        bankName: 'Bank of America'
      },
      paymentSentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // Payment sent 1 day ago
    },
    {
      escrowId: 105,
      chainId: 128123,
      buyerId: users.proUser.id,
      sellerId: users.testUser2.id,
      amount: '750',
      currency: 'USD',
      tradeType: 'domain',
      listingCategory: 'domain',
      status: 'disputed',
      metadata: {
        domainName: 'web3gaming.net',
        transferMethod: 'push',
        disputeReason: 'Domain not as described - traffic numbers inflated',
        disputeOpenedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      }
    },
    {
      escrowId: 106,
      chainId: 128123,
      buyerId: users.testUser2.id,
      sellerId: users.adminUser.id,
      amount: '8500',
      currency: 'USD',
      tradeType: 'domain',
      listingCategory: 'domain',
      status: 'completed',
      metadata: {
        domainName: 'smartcontracts.dev',
        transferMethod: 'escrow',
        includesWebsite: true,
        completionTime: '4 hours',
        rating: 5,
        websiteTransferred: true,
        databaseTransferred: true
      },
      completedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) // 20 days ago
    },
    {
      escrowId: 107,
      chainId: 128123,
      buyerId: users.enterpriseUser.id,
      sellerId: users.proUser.id,
      amount: '3200',
      currency: 'USD',
      tradeType: 'domain',
      listingCategory: 'domain',
      status: 'cancelled',
      metadata: {
        domainName: 'cryptowallet.app',
        transferMethod: 'push',
        cancellationReason: 'Buyer changed mind',
        cancelledBy: 'buyer'
      }
    },
    {
      escrowId: 108,
      chainId: 128123,
      buyerId: users.adminUser.id,
      sellerId: users.enterpriseUser.id,
      amount: '125000',
      currency: 'USD',
      tradeType: 'domain',
      listingCategory: 'domain',
      status: 'completed',
      metadata: {
        domainName: 'meta.exchange',
        transferMethod: 'escrow',
        includesWebsite: true,
        completionTime: '7 days',
        rating: 5,
        websiteTransferred: true,
        sourceCodeTransferred: true,
        supportPeriod: 30, // days
        escrowAgent: 'Escrow.com',
        legalDocumentsSigned: true
      },
      completedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    }
  ])

  console.log('Domain listings and trades seeded successfully')
  console.log('- Domain listings created: 8')
  console.log('- Domain trades created: 8')
}
