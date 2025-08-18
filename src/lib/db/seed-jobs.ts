import { db } from './drizzle'
import { jobCategories, skills } from './schema'

export async function seedJobsData() {
  console.log('🌱 Seeding job categories and skills...')

  // Seed job categories
  const categoriesData = [
    {
      name: 'Web Development',
      slug: 'web-development',
      description: 'Frontend, backend, and full-stack web development services',
      icon: '💻',
      sortOrder: 1
    },
    {
      name: 'Mobile Development',
      slug: 'mobile-development',
      description: 'iOS, Android, and cross-platform mobile app development',
      icon: '📱',
      sortOrder: 2
    },
    {
      name: 'Design & Creative',
      slug: 'design-creative',
      description: 'UI/UX design, graphic design, and creative services',
      icon: '🎨',
      sortOrder: 3
    },
    {
      name: 'Writing & Translation',
      slug: 'writing-translation',
      description: 'Content writing, copywriting, and translation services',
      icon: '✍️',
      sortOrder: 4
    },
    {
      name: 'Digital Marketing',
      slug: 'digital-marketing',
      description: 'SEO, social media, PPC, and marketing strategy',
      icon: '📈',
      sortOrder: 5
    },
    {
      name: 'Video & Animation',
      slug: 'video-animation',
      description: 'Video editing, animation, and motion graphics',
      icon: '🎬',
      sortOrder: 6
    },
    {
      name: 'Music & Audio',
      slug: 'music-audio',
      description: 'Music production, audio editing, and sound design',
      icon: '🎵',
      sortOrder: 7
    },
    {
      name: 'Programming & Tech',
      slug: 'programming-tech',
      description: 'Software development, DevOps, and technical services',
      icon: '⚙️',
      sortOrder: 8
    },
    {
      name: 'Data Science & Analytics',
      slug: 'data-science',
      description: 'Data analysis, machine learning, and AI services',
      icon: '📊',
      sortOrder: 9
    },
    {
      name: 'Business & Consulting',
      slug: 'business-consulting',
      description: 'Business strategy, consulting, and professional services',
      icon: '💼',
      sortOrder: 10
    }
  ]

  // Insert categories and get their IDs
  const insertedCategories = await db
    .insert(jobCategories)
    .values(categoriesData)
    .onConflictDoNothing()
    .returning()

  console.log(`✅ Inserted ${insertedCategories.length} job categories`)

  // Get all categories for mapping
  const allCategories = await db.select().from(jobCategories)
  const categoryMap = new Map(allCategories.map(c => [c.slug, c.id]))

  // Seed skills
  const skillsData = [
    // Web Development
    {
      name: 'JavaScript',
      categoryId: categoryMap.get('web-development'),
      isVerifiable: true
    },
    {
      name: 'TypeScript',
      categoryId: categoryMap.get('web-development'),
      isVerifiable: true
    },
    {
      name: 'React',
      categoryId: categoryMap.get('web-development'),
      isVerifiable: true
    },
    {
      name: 'Vue.js',
      categoryId: categoryMap.get('web-development'),
      isVerifiable: true
    },
    {
      name: 'Angular',
      categoryId: categoryMap.get('web-development'),
      isVerifiable: true
    },
    {
      name: 'Node.js',
      categoryId: categoryMap.get('web-development'),
      isVerifiable: true
    },
    {
      name: 'Next.js',
      categoryId: categoryMap.get('web-development'),
      isVerifiable: true
    },
    {
      name: 'HTML/CSS',
      categoryId: categoryMap.get('web-development'),
      isVerifiable: true
    },
    {
      name: 'Tailwind CSS',
      categoryId: categoryMap.get('web-development'),
      isVerifiable: true
    },

    // Mobile Development
    {
      name: 'React Native',
      categoryId: categoryMap.get('mobile-development'),
      isVerifiable: true
    },
    {
      name: 'Flutter',
      categoryId: categoryMap.get('mobile-development'),
      isVerifiable: true
    },
    {
      name: 'Swift',
      categoryId: categoryMap.get('mobile-development'),
      isVerifiable: true
    },
    {
      name: 'Kotlin',
      categoryId: categoryMap.get('mobile-development'),
      isVerifiable: true
    },
    {
      name: 'iOS Development',
      categoryId: categoryMap.get('mobile-development'),
      isVerifiable: true
    },
    {
      name: 'Android Development',
      categoryId: categoryMap.get('mobile-development'),
      isVerifiable: true
    },

    // Programming Languages
    {
      name: 'Python',
      categoryId: categoryMap.get('programming-tech'),
      isVerifiable: true
    },
    {
      name: 'Java',
      categoryId: categoryMap.get('programming-tech'),
      isVerifiable: true
    },
    {
      name: 'C++',
      categoryId: categoryMap.get('programming-tech'),
      isVerifiable: true
    },
    {
      name: 'C#',
      categoryId: categoryMap.get('programming-tech'),
      isVerifiable: true
    },
    {
      name: 'PHP',
      categoryId: categoryMap.get('programming-tech'),
      isVerifiable: true
    },
    {
      name: 'Ruby',
      categoryId: categoryMap.get('programming-tech'),
      isVerifiable: true
    },
    {
      name: 'Go',
      categoryId: categoryMap.get('programming-tech'),
      isVerifiable: true
    },
    {
      name: 'Rust',
      categoryId: categoryMap.get('programming-tech'),
      isVerifiable: true
    },
    {
      name: 'Solidity',
      categoryId: categoryMap.get('programming-tech'),
      isVerifiable: true
    },

    // Design
    {
      name: 'UI/UX Design',
      categoryId: categoryMap.get('design-creative'),
      isVerifiable: false
    },
    {
      name: 'Graphic Design',
      categoryId: categoryMap.get('design-creative'),
      isVerifiable: false
    },
    {
      name: 'Logo Design',
      categoryId: categoryMap.get('design-creative'),
      isVerifiable: false
    },
    {
      name: 'Illustration',
      categoryId: categoryMap.get('design-creative'),
      isVerifiable: false
    },
    {
      name: 'Figma',
      categoryId: categoryMap.get('design-creative'),
      isVerifiable: true
    },
    {
      name: 'Adobe Photoshop',
      categoryId: categoryMap.get('design-creative'),
      isVerifiable: true
    },
    {
      name: 'Adobe Illustrator',
      categoryId: categoryMap.get('design-creative'),
      isVerifiable: true
    },

    // Writing
    {
      name: 'Content Writing',
      categoryId: categoryMap.get('writing-translation'),
      isVerifiable: false
    },
    {
      name: 'Copywriting',
      categoryId: categoryMap.get('writing-translation'),
      isVerifiable: false
    },
    {
      name: 'Technical Writing',
      categoryId: categoryMap.get('writing-translation'),
      isVerifiable: false
    },
    {
      name: 'Translation',
      categoryId: categoryMap.get('writing-translation'),
      isVerifiable: false
    },
    {
      name: 'Proofreading',
      categoryId: categoryMap.get('writing-translation'),
      isVerifiable: false
    },

    // Marketing
    {
      name: 'SEO',
      categoryId: categoryMap.get('digital-marketing'),
      isVerifiable: true
    },
    {
      name: 'Social Media Marketing',
      categoryId: categoryMap.get('digital-marketing'),
      isVerifiable: false
    },
    {
      name: 'PPC',
      categoryId: categoryMap.get('digital-marketing'),
      isVerifiable: true
    },
    {
      name: 'Email Marketing',
      categoryId: categoryMap.get('digital-marketing'),
      isVerifiable: false
    },
    {
      name: 'Content Marketing',
      categoryId: categoryMap.get('digital-marketing'),
      isVerifiable: false
    },

    // Video
    {
      name: 'Video Editing',
      categoryId: categoryMap.get('video-animation'),
      isVerifiable: false
    },
    {
      name: '3D Animation',
      categoryId: categoryMap.get('video-animation'),
      isVerifiable: false
    },
    {
      name: 'Motion Graphics',
      categoryId: categoryMap.get('video-animation'),
      isVerifiable: false
    },
    {
      name: 'After Effects',
      categoryId: categoryMap.get('video-animation'),
      isVerifiable: true
    },
    {
      name: 'Premiere Pro',
      categoryId: categoryMap.get('video-animation'),
      isVerifiable: true
    },

    // Data Science
    {
      name: 'Data Analysis',
      categoryId: categoryMap.get('data-science'),
      isVerifiable: true
    },
    {
      name: 'Machine Learning',
      categoryId: categoryMap.get('data-science'),
      isVerifiable: true
    },
    {
      name: 'Deep Learning',
      categoryId: categoryMap.get('data-science'),
      isVerifiable: true
    },
    {
      name: 'Data Visualization',
      categoryId: categoryMap.get('data-science'),
      isVerifiable: true
    },
    {
      name: 'SQL',
      categoryId: categoryMap.get('data-science'),
      isVerifiable: true
    },
    {
      name: 'Pandas',
      categoryId: categoryMap.get('data-science'),
      isVerifiable: true
    },
    {
      name: 'TensorFlow',
      categoryId: categoryMap.get('data-science'),
      isVerifiable: true
    },

    // Blockchain
    {
      name: 'Blockchain',
      categoryId: categoryMap.get('programming-tech'),
      isVerifiable: true
    },
    {
      name: 'Smart Contracts',
      categoryId: categoryMap.get('programming-tech'),
      isVerifiable: true
    },
    {
      name: 'Web3',
      categoryId: categoryMap.get('programming-tech'),
      isVerifiable: true
    },
    {
      name: 'DeFi',
      categoryId: categoryMap.get('programming-tech'),
      isVerifiable: true
    },
    {
      name: 'NFT',
      categoryId: categoryMap.get('programming-tech'),
      isVerifiable: true
    }
  ]

  const insertedSkills = await db
    .insert(skills)
    .values(skillsData.filter(s => s.categoryId !== undefined))
    .onConflictDoNothing()
    .returning()

  console.log(`✅ Inserted ${insertedSkills.length} skills`)

  return {
    categories: insertedCategories,
    skills: insertedSkills
  }
}
