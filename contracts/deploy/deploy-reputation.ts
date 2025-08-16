import { ethers } from 'ethers'
import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'js-yaml'

// Load contract artifacts
const contractPath = path.join(__dirname, '../out/ReputationRegistry.sol/ReputationRegistry.json')
const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'))

interface BlockchainConfig {
  chains: {
    [key: string]: {
      chainId: number
      rpcUrl: string
      contractAddresses: {
        subscriptionManager?: string
        escrowCore?: string
        achievementNFT?: string
        reputationRegistry?: string
      }
    }
  }
}

async function deployReputationRegistry(networkName: string) {
  console.log(`\n🚀 Deploying ReputationRegistry to ${networkName}...`)

  // Load blockchain config
  const configPath = path.join(__dirname, '../../config/blockchains.yaml')
  const config = yaml.load(fs.readFileSync(configPath, 'utf8')) as BlockchainConfig
  
  const network = config.chains[networkName]
  if (!network) {
    throw new Error(`Network ${networkName} not found in config`)
  }

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(network.rpcUrl)
  const privateKey = process.env.ADMIN_PRIVATE_KEY
  
  if (!privateKey) {
    throw new Error('ADMIN_PRIVATE_KEY not set in environment')
  }

  const wallet = new ethers.Wallet(privateKey, provider)
  console.log(`Deploying from address: ${wallet.address}`)

  // Check balance
  const balance = await provider.getBalance(wallet.address)
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`)

  if (balance === 0n) {
    throw new Error('Insufficient balance for deployment')
  }

  // Deploy contract
  const factory = new ethers.ContractFactory(
    contractJson.abi,
    contractJson.bytecode.object,
    wallet
  )

  console.log('Deploying contract...')
  const contract = await factory.deploy()
  
  console.log(`Transaction hash: ${contract.deploymentTransaction()?.hash}`)
  console.log('Waiting for confirmation...')
  
  await contract.waitForDeployment()
  const contractAddress = await contract.getAddress()
  
  console.log(`✅ ReputationRegistry deployed to: ${contractAddress}`)

  // Update config file with deployed address
  network.contractAddresses.reputationRegistry = contractAddress
  
  const updatedConfig = yaml.dump(config, {
    styles: {
      '!!null': 'canonical'
    },
    sortKeys: false
  })
  
  fs.writeFileSync(configPath, updatedConfig)
  console.log('✅ Updated blockchains.yaml with contract address')

  return contractAddress
}

// Main execution
async function main() {
  const networkName = process.argv[2]
  
  if (!networkName) {
    console.error('Usage: ts-node deploy-reputation.ts <network-name>')
    console.error('Example: ts-node deploy-reputation.ts coreTestnet')
    process.exit(1)
  }

  try {
    const address = await deployReputationRegistry(networkName)
    console.log(`\n🎉 Deployment successful!`)
    console.log(`Contract address: ${address}`)
  } catch (error) {
    console.error('Deployment failed:', error)
    process.exit(1)
  }
}

main().catch(console.error)