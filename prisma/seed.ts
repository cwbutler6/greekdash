import { PrismaClient } from '@/generated/prisma'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Create test chapter
  const testChapter = await prisma.chapter.create({
    data: {
      name: 'Alpha Beta Gamma',
      slug: 'alpha-beta-gamma',
      joinCode: 'TEST123',
      publicInfo: 'Test chapter for beta testing',
      schoolName: 'Test University',
      primaryColor: '#1e40af'
    }
  })

  // Create test admin user
  const hashedPassword = await bcrypt.hash('testpassword123', 10)
  const adminUser = await prisma.user.create({
    data: {
      name: 'Test Admin',
      email: 'admin@test.com',
      password: hashedPassword
    }
  })

  // Create admin membership
  const adminMembership = await prisma.membership.create({
    data: {
      userId: adminUser.id,
      chapterId: testChapter.id,
      role: 'ADMIN'
    }
  })

  // Create admin profile
  await prisma.profile.create({
    data: {
      membershipId: adminMembership.id,
      userId: adminUser.id,
      chapterId: testChapter.id,
      major: 'Computer Science',
      gradYear: 2024,
      bio: 'Test admin user for beta testing'
    }
  })

  // Create test member user
  const memberUser = await prisma.user.create({
    data: {
      name: 'Test Member',
      email: 'member@test.com',
      password: hashedPassword
    }
  })

  // Create member membership
  const memberMembership = await prisma.membership.create({
    data: {
      userId: memberUser.id,
      chapterId: testChapter.id,
      role: 'MEMBER'
    }
  })

  // Create member profile
  await prisma.profile.create({
    data: {
      membershipId: memberMembership.id,
      userId: memberUser.id,
      chapterId: testChapter.id,
      major: 'Business',
      gradYear: 2025,
      bio: 'Test member user for beta testing'
    }
  })

  // Create subscription for chapter
  await prisma.subscription.create({
    data: {
      chapterId: testChapter.id,
      plan: 'BASIC',
      status: 'ACTIVE'
    }
  })

  console.log('✅ Database seeded successfully')
  console.log(`Chapter: ${testChapter.name} (${testChapter.slug})`)
  console.log(`Admin: ${adminUser.email}`)
  console.log(`Member: ${memberUser.email}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })