-- Add reputation registry table for onchain reputation tracking
CREATE TABLE IF NOT EXISTS reputation_registry (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_address VARCHAR(42) NOT NULL,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  average_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  reputation_score INTEGER NOT NULL DEFAULT 0,
  is_freelancer BOOLEAN NOT NULL DEFAULT true,
  last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, is_freelancer)
);

-- Add reputation NFTs table for tracking minted reputation badges
CREATE TABLE IF NOT EXISTS reputation_nfts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nft_type VARCHAR(50) NOT NULL, -- 'reputation', 'achievement', 'milestone'
  token_id BIGINT NOT NULL UNIQUE,
  metadata_uri TEXT,
  reputation_level VARCHAR(20), -- 'bronze', 'silver', 'gold', 'platinum', 'diamond'
  minted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  tx_hash VARCHAR(66) NOT NULL UNIQUE,
  chain_id INTEGER NOT NULL DEFAULT 1,
  contract_address VARCHAR(42),
  UNIQUE(user_id, nft_type, reputation_level)
);

-- Indexes for performance
CREATE INDEX idx_reputation_registry_user ON reputation_registry(user_id);
CREATE INDEX idx_reputation_registry_score ON reputation_registry(reputation_score DESC);
CREATE INDEX idx_reputation_registry_freelancer ON reputation_registry(is_freelancer);
CREATE INDEX idx_reputation_nfts_user ON reputation_nfts(user_id);
CREATE INDEX idx_reputation_nfts_type ON reputation_nfts(nft_type);
CREATE INDEX idx_reputation_nfts_token ON reputation_nfts(token_id);