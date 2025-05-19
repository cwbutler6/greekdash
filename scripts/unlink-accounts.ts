import { PrismaClient } from '../src/generated/prisma';

/**
 * This script unlinks a Google account (provider account) from an existing user
 * It's specifically designed to separate chris@project9.studio from cbutler.msstate@gmail.com
 * following the multi-tenant authentication rules of GreekDash
 */
async function unlinkAccounts() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Starting account unlinking process...');
    
    // Step 1: Find the Google account record with the provider ID
    const googleAccount = await prisma.account.findFirst({
      where: {
        provider: 'google',
        // Looking for the account connected to chris@project9.studio
        // We identify by provider ID rather than email for accuracy
        providerAccountId: '101396714298862484839' // This is the Google sub/ID from the logs
      },
      include: {
        user: true
      }
    });
    
    if (!googleAccount) {
      console.log('No Google account found to unlink.');
      return;
    }
    
    console.log('Found Google account:', {
      accountId: googleAccount.id,
      provider: googleAccount.provider,
      userId: googleAccount.userId,
      userEmail: googleAccount.user?.email
    });
    
    // Step 2: Delete the account link - this is the safest option
    // This will force a new user to be created the next time Google auth is used
    await prisma.account.delete({
      where: {
        id: googleAccount.id
      }
    });
    
    console.log('Successfully deleted the account link. The next time you sign in with Google, a fresh account will be created.');
    
  } catch (error) {
    console.error('Error while unlinking accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
unlinkAccounts()
  .then(() => console.log('Script completed'))
  .catch(error => console.error('Script failed:', error));
