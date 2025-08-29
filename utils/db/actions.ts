import { db } from './dbConfig';
import { Users, Reports, Rewards, CollectedWastes, Notifications, Transactions } from './schema';
import { eq, sql, and, desc, ne } from 'drizzle-orm';

export async function createUser(email: string, name: string) {
  try {
    const [user] = await db.insert(Users).values({ email, name }).returning().execute();
    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    return null;
  } 
}

// get user by the email

export async function getUserByEmail(email: string) {
  try {
    const [user] = await db.select().from(Users).where(eq(Users.email, email)).execute();
    return user;
  } catch (error) {
    console.error("Error fetching user by email:", error);
    return null;
  }
}

export async function getUnreadNotifications(userId: number) {
  try {
    return await db.select().from(Notifications).where(
      and(
        eq(Notifications.userId, userId),
        eq(Notifications.isRead, false)
      )
    ).execute();
  } catch (error) {
    console.error("Error fetching unread notifications:", error);
    return [];
  }
}


export async function getUserBalance(userId: number): Promise<number> {
  const transactions = await getRewardTransactions(userId);

  if(!transactions) return 0;
  const balance = transactions.reduce((acc:number, transaction:any) => {
    return transaction.type.startsWith('earned') ? acc + transaction.amount : acc - transaction.amount
  }, 0);
  return Math.max(balance, 0); // Ensure balance is never negative
}


export async function getRewardTransactions(userId:number){
    try {
        console.log('Fetching transactions for user ID:', userId)

        const transactions = await db
          .select({
            id: Transactions.id,
            type: Transactions.type,
            amount: Transactions.amount,
            description: Transactions.description,
            date: Transactions.date,
          })
          .from(Transactions)
          .where(eq(Transactions.userId, userId))
          .orderBy(desc(Transactions.date))
          .limit(10)
          .execute();

        console.log('Raw transactions from database:', transactions)

        return transactions;   //  Ab result wapas milega
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return [];   //  fallback value
    }
}
