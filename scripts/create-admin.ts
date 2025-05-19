import { PrismaClient } from '../src/generated/prisma';
import { MembershipRole } from '../src/generated/prisma';
import { hash } from 'bcrypt';

/**
 * This script creates an admin user with proper chapter membership
 * for multi-tenant authentication in GreekDash
 */
async function createAdminUser() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Starting admin user creation process...');
    
    // Step 1: Create a chapter if not exists
    // The chapter is essential for the multi-tenant architecture
    const chapterSlug = 'admin'; // You can change this to your preferred chapter slug
    
    let chapter = await prisma.chapter.findUnique({
      where: { slug: chapterSlug }
    });
    
    if (!chapter) {
      chapter = await prisma.chapter.create({
        data: {
          name: 'Admin Chapter',
          slug: chapterSlug,
          joinCode: 'ADMIN123', // You can change this
        }
      });
      console.log('Created new chapter:', {
        id: chapter.id,
        name: chapter.name,
        slug: chapter.slug
      });
    } else {
      console.log('Using existing chapter:', {
        id: chapter.id,
        name: chapter.name,
        slug: chapter.slug
      });
    }
    
    // Step 2: Create admin user if not exists
    const adminEmail = 'chris@project9.studio'; // Change this to your preferred admin email
    
    let adminUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    
    if (!adminUser) {
      const hashedPassword = await hash('Admin123!', 12); // Change this to your preferred password
      
      adminUser = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: adminEmail,
          password: hashedPassword,
          emailVerified: new Date(),
        }
      });
      console.log('Created new admin user:', {
        id: adminUser.id,
        email: adminUser.email
      });
    } else {
      console.log('Using existing user:', {
        id: adminUser.id,
        email: adminUser.email
      });
    }
    
    // Step 3: Create admin membership if not exists
    const existingMembership = await prisma.membership.findFirst({
      where: {
        userId: adminUser.id,
        chapterId: chapter.id
      }
    });
    
    if (!existingMembership) {
      const membership = await prisma.membership.create({
        data: {
          role: MembershipRole.ADMIN,
          userId: adminUser.id,
          chapterId: chapter.id
        }
      });
      console.log('Created admin membership:', {
        id: membership.id,
        role: membership.role,
        chapterId: membership.chapterId,
        userId: membership.userId
      });
    } else {
      console.log('Admin membership already exists:', {
        id: existingMembership.id,
        role: existingMembership.role
      });
    }
    
    console.log(`\nSuccess! You can now log in with:`);
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: Admin123! (unless you changed it in the script)`);
    console.log(`\nYou'll be redirected to /${chapterSlug}/admin after login`);
    
  } catch (error) {
    console.error('Error while creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createAdminUser()
  .then(() => console.log('Script completed'))
  .catch(error => console.error('Script failed:', error));
