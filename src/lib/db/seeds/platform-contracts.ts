import { db } from '../drizzle'
import { platformContracts } from '../schema'

// Contract addresses for different chains
// These should be updated after deployment
const contracts = [
  // Etherlink Testnet (128123)
  {
    chainId: 128123,
    chainName: 'Etherlink Testnet',
    contractType: 'SUBSCRIPTION_MANAGER',
    contractAddress: '0x0000000000000000000000000000000000000000', // Update after deployment
    isActive: true
  },
  {
    chainId: 128123,
    chainName: 'Etherlink Testnet',
    contractType: 'ESCROW_CORE',
    contractAddress: '0x0000000000000000000000000000000000000000', // Update after deployment
    isActive: true
  },
  {
    chainId: 128123,
    chainName: 'Etherlink Testnet',
    contractType: 'ACHIEVEMENT_NFT',
    contractAddress: '0x0000000000000000000000000000000000000000', // Update after deployment
    isActive: true
  }
]

export async function seedPlatformContracts() {
  console.log('Seeding platform contracts...')

  try {
    // Insert or update contracts
    for (const contract of contracts) {
      await db
        .insert(platformContracts)
        .values(contract)
        .onConflictDoUpdate({
          target: [platformContracts.chainId, platformContracts.contractType],
          set: {
            contractAddress: contract.contractAddress,
            isActive: contract.isActive
          }
        })
    }

    console.log('Platform contracts seeded successfully')
  } catch (error) {
    console.error('Error seeding platform contracts:', error)
    throw error
  }
}
