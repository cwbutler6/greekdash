import { PrismaClient } from '../src/generated/prisma';

/**
 * This script inspects authentication data to understand account linking issues
 * It's designed to help debug authentication issues in a multi-tenant environment
 */
async function inspectAuthentication() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=============== AUTH INSPECTION ===============');
    
    // Step 1: Get all users
    const users = await prisma.user.findMany({
      include: {
        accounts: true,
        memberships: {
          include: { chapter: true }
        }
      }
    });
    
    console.log(`Found ${users.length} users in the system:`);
    
    // Step 2: Log details for each user
    for (const user of users) {
      console.log('\n-----------------------------------------------');
      console.log(`USER: ${user.name} (${user.email})`);
      console.log(`ID: ${user.id}`);
      console.log(`Created: ${user.createdAt}`);
      console.log(`Has password: ${!!user.password}`);
      
      // List all linked authentication accounts
      console.log('\nLinked accounts:');
      if (user.accounts.length === 0) {
        console.log('  None (credentials login only)');
      } else {
        user.accounts.forEach(account => {
          console.log(`  Provider: ${account.provider} (ID: ${account.providerAccountId.substring(0, 15)}...)`);
        });
      }
      
      // List all chapter memberships
      console.log('\nChapter memberships:');
      if (user.memberships.length === 0) {
        console.log('  None (will be redirected to signup)');
      } else {
        user.memberships.forEach(membership => {
          console.log(`  Chapter: ${membership.chapter.slug} (Role: ${membership.role})`);
        });
      }
    }
    
    // Step 3: Show specific recommendations
    const usersWithoutMemberships = users.filter(user => user.memberships.length === 0);
    if (usersWithoutMemberships.length > 0) {
      console.log('\n\n=============== RECOMMENDATIONS ===============');
      console.log(`Found ${usersWithoutMemberships.length} users without chapter memberships:`);
      
      usersWithoutMemberships.forEach(user => {
        console.log(`- ${user.name} (${user.email}) - ID: ${user.id}`);
        console.log('  This user will always be redirected to signup after login\n');
      });
    }
    
  } catch (error) {
    console.error('Error during inspection:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
inspectAuthentication()
  .then(() => console.log('\nInspection completed'))
  .catch(error => console.error('Inspection failed:', error));
