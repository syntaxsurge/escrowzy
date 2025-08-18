import { UnifiedMarketplace } from '@/components/blocks/marketplace'

export default function PublicListingsPage() {
  return (
    <UnifiedMarketplace
      defaultCategory='all'
      isPublic={true}
      title='ESCROW MARKETPLACE'
      description='Browse secure P2P trades, domain sales, and professional services'
    />
  )
}
