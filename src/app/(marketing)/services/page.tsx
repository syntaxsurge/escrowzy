import { UnifiedMarketplace } from '@/components/blocks/marketplace'

export default function ServicesPage() {
  return (
    <UnifiedMarketplace
      defaultCategory='service'
      isPublic={true}
      title='SERVICES MARKETPLACE'
      description='Discover professional services and connect with talented freelancers'
    />
  )
}
