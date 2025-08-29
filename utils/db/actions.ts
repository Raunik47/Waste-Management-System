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

export async function getUserByEmail(email:string){
    
}