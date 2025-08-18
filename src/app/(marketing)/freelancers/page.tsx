import { UnifiedMarketplace } from '@/components/blocks/marketplace'

export default function FreelancersDirectoryPage() {
  return (
    <UnifiedMarketplace
      defaultCategory='service'
      isPublic={true}
      title='FREELANCER MARKETPLACE'
      description='Connect with skilled professionals ready to bring your projects to life'
    />
  )
}
