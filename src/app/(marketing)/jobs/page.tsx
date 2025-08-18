import { UnifiedMarketplace } from '@/components/blocks/marketplace'

export default function PublicJobsPage() {
  return (
    <UnifiedMarketplace
      defaultCategory='service'
      isPublic={true}
      title='JOB MARKETPLACE'
      description='Browse thousands of freelance jobs from verified clients'
    />
  )
}
