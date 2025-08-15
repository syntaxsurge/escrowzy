# 🎮 ESCROWZY - Revolutionary Gamified DeFi Trading Platform on Core Blockchain

> **Core Connect Global Buildathon Submission** | Track: Socialfi & DeFi

[![Escrowzy Demo](/public/images/escrowzy-homepage.png)](https://youtu.be/xxxxxxx)

## 🚀 Executive Summary

**Escrowzy** is the world's first gamified DeFi platform that transforms
traditional P2P trading and token swapping into an engaging, trust-minimized
experience. We've created a revolutionary **Battle-to-Trade** mechanism where
traders compete for 25% fee discounts, earning Combat Power through achievement
NFTs.

### 🎯 The Innovation That Changes Everything

**Problem**: DeFi platforms suffer from poor user engagement, high friction, and
trust issues in P2P trading.

**Our Solution**: We've gamified the entire trading experience:

- **Battle Arena**: Win PvP battles → Get 25% trading fee discount for 24 hours
- **Achievement NFTs**: Trade more → Earn NFTs → Increase Combat Power → Win
  more battles
- **Trust-Minimized P2P**: Smart contract escrow with multi-sig for high-value
  trades
- **Frictionless Onboarding**: Email login via Thirdweb - no seed phrases
  required

---

## 🏆 Track Alignment & Innovation

### ✅ PayFi / Consumer Finance Track

| Feature                      | Implementation                         | Innovation                                |
| ---------------------------- | -------------------------------------- | ----------------------------------------- |
| **Smart Contract Escrow**    | EscrowCore.sol with dispute resolution | First escrow with gamification incentives |
| **ERC20 Token Support**      | Full ERC20 integration                 | Leverages Core's EVM compatibility        |
| **Autonomous Subscriptions** | On-chain renewal system                | Self-executing revenue model              |
| **Achievement NFTs**         | 35+ categories using ERC721            | NFTs that provide real utility in battles |
| **Battle Rewards**           | Autonomous fee discount system         | Game theory meets DeFi incentives         |

### ✨ Innovation Highlights

| Feature                  | Implementation                             | Innovation                             |
| ------------------------ | ------------------------------------------ | -------------------------------------- |
| **Email/Social Wallets** | Thirdweb SDK - users start with just email | First gamified DeFi with email wallets |
| **No Seed Phrases**      | Account abstraction via Thirdweb           | Web2 UX with Web3 security             |
| **Low-Cost Trading**     | Core's low transaction fees                | Makes DeFi accessible to everyone      |
| **Fast Block Time**      | 3 second block production                  | Real-time battle results and trades    |

---

## 🔧 Core Blockchain Integration

### Network Configuration

```yaml
# config/blockchains.yaml
coreMainnet:
  chainId: 1116
  rpcUrl: 'https://rpc.coredao.org'

coreTestnet:
  chainId: 1114
  rpcUrl: 'https://rpc.test2.btcs.network'
```

**Why Core is Perfect for Escrowzy:**

- ⚡ **3s blocks**: Fast battle results and trades
- 💰 **Low fees**: Affordable transaction costs
- 🔒 **Satoshi Plus Consensus**: Bitcoin-aligned security
- 🪙 **BTCfi Native**: Built for Bitcoin DeFi
- 📈 **High TPS**: Scales for consumer applications

---

## 📜 Smart Contract Architecture

### 1. EscrowCore.sol

- Multi-signature for trades >10 ETH
- 2-layer dispute resolution system
- Cross-chain trade tracking via chainId
- Time-locked refunds with buyer protection
- Integration with battle rewards system

### 2. AchievementNFT.sol

- 35+ achievement categories with rarity tiers
- Combat Power calculation from NFT ownership
- Dynamic URI generation for evolving NFTs
- On-chain progress tracking

### 3. SubscriptionManager.sol

- Self-executing 30-day renewals
- Team subscription sharing mechanism
- Multi-token payment support
- Tiered benefits affecting battle limits

---

## 🎮 Revolutionary Features

### 🥊 Battle Arena System

**The Innovation**: Trade to earn Combat Power → Battle for fee discounts →
Trade more with discounts

- **Matchmaking Algorithm**: Pairs traders with similar Combat Power
- **Real Stakes**: Winners get 25% off all trading fees for 24 hours
- **Daily Limits**: Free (3 battles), Pro (10), Enterprise (Unlimited)
- **Live PvP**: Real-time WebSocket battles with animations

### 🤝 Gamified P2P Marketplace

- **10+ Payment Methods**: Bank, PayPal, Venmo, Crypto
- **Reputation System**: 5-star ratings tracked on-chain
- **Escrow Protection**: 100% smart contract secured
- **Dispute Resolution**: Admin-moderated system

### 🏆 Achievement & Progression System

- **100 Levels**: Novice → Expert → Master → Mythic
- **35+ Achievements**: Each grants unique Combat Power bonuses
- **XP from Everything**: Trading, battling, referring
- **Daily Quests**: Complete tasks to earn XP and level up

---

## 📊 Technical Stack

| Layer                   | Technology                       | Status                  |
| ----------------------- | -------------------------------- | ----------------------- |
| **Frontend**            | Next.js 15, TypeScript, Tailwind | ✅ Production Ready     |
| **Smart Contracts**     | Solidity, Foundry, OpenZeppelin  | ✅ Ready for Deployment |
| **Blockchain**          | Core, wagmi, viem                | ✅ Integrated           |
| **Account Abstraction** | Thirdweb SDK                     | ✅ Implemented          |
| **Real-time**           | Pusher, WebSockets               | ✅ Live                 |
| **Database**            | PostgreSQL, Drizzle ORM          | ✅ Scalable             |

---

## 🚀 Setup & Deployment

### Quick Start

```bash
# 1. Clone repository
git clone https://github.com/syntaxsurge/escrowzy-core
cd escrowzy-core

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your configuration

# 4. Setup database
pnpm db:push
pnpm db:seed

# 5. Deploy contracts to Core testnet
cd contracts
./deploy.sh coreTestnet

# 6. Start development
pnpm dev

# Visit: http://localhost:3000
```

### Environment Variables

Key environment variables needed:

```bash
# Database
POSTGRES_URL=postgresql://...

# Authentication
AUTH_SECRET=...

# Blockchain
ADMIN_ADDRESS=0x...
ADMIN_PRIVATE_KEY=...

# Wallet Provider (thirdweb or rainbow-kit)
NEXT_PUBLIC_WALLET_PROVIDER=rainbow-kit
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...

# Real-time (Pusher)
PUSHER_APP_ID=...
NEXT_PUBLIC_PUSHER_KEY=...
PUSHER_SECRET=...
```

---

## 💡 Business Model

### Revenue Streams

- **Trading Fees**: 2.5% per transaction
- **Subscriptions**: $3-5/month for Pro/Enterprise tiers
- **Battle Passes**: Premium battle features (planned)
- **NFT Marketplace**: Achievement NFT trading (planned)

### Target Market

- **Primary**: 2M+ GameFi users seeking yield
- **Secondary**: 10M+ DeFi traders wanting lower fees
- **Unique Value**: Only platform where gaming skill reduces trading costs

---

## 🔮 Roadmap

### Q1 2025 - Foundation

- [x] Deploy on Core testnet
- [ ] Security audit
- [ ] Mobile app development
- [ ] Integration with popular wallets

### Q2 2025 - Expansion

- [ ] Cross-chain bridge integration
- [ ] AI-powered trade matching
- [ ] Staking program launch
- [ ] Advanced analytics dashboard

### Q3 2025 - Innovation

- [ ] Prediction markets
- [ ] Automated market making
- [ ] Guild system implementation
- [ ] Tournament mode with prizes

---

## 🤝 Why This Wins

### For Core Blockchain

- **Drives Adoption**: Users discover BTCfi through gamified trading
- **Increases TVL**: Battle rewards drive network activity
- **Showcases Tech**: Proves Core's DeFi and consumer finance capabilities

### For Users

- **Lower Fees**: Win battles, save money
- **Entertainment**: Trading becomes engaging
- **Trust**: Smart contracts eliminate scams
- **Accessibility**: Start with just an email

---

## 📦 Project Structure

```
escrowzy-core/
├── src/
│   ├── app/           # Next.js app router
│   ├── components/    # React components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utilities and libraries
│   ├── services/      # Server-side business logic
│   └── config/        # Configuration files
├── contracts/         # Smart contracts (Solidity)
├── public/           # Static assets
└── config/           # Blockchain configuration
```

---

## Project Resources

- 🌐 **Live Platform**:
  [escrowzy.com](https://escrowzy.com/)
- 📹 **Demo Video**: [youtu.be/xxxxxxx](https://youtu.be/xxxxxxx)
- 💻 **GitHub**:
  [github.com/syntaxsurge/escrowzy](https://github.com/syntaxsurge/escrowzy)

---

## 🏁 Conclusion

**Escrowzy** combines the addictive nature of gaming with the financial benefits
of DeFi. Our deep integration with Core's BTCfi capabilities and Satoshi Plus
consensus positions us as the flagship gamified DeFi dApp for the Core
ecosystem.

**Join us in reshaping DeFi forever. Battle. Trade. Conquer.**

---

> **"Build What Matters, Build on Core"** - Core Connect Global Buildathon

**#BattleToTrade #CoreBlockchain #Web3Gaming #BTCfi #DeFi**
