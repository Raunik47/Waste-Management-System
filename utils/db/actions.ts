import { db } from './dbConfig';
import { Users, Reports, Rewards, CollectedWastes, Notifications, Transactions } from './schema';
import { eq, sql, and, desc, ne } from 'drizzle-orm';

export async function createUser(email: string, name: string) {
  try {
    const [user] = await db
      .insert(Users)
      .values({ email, name }) // don’t touch id or createdAt
      .returning({
        id: Users.id,
        email: Users.email,
        name: Users.name,
        createdAt: Users.createdAt,
      });
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


export async function markNotificationAsRead(notificationId: number) {
  try {
    await db.update(Notifications).set({ isRead: true }).where(eq(Notifications.id, notificationId)).execute();
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
}

// report page backend

export async function createReport(
  userId: number,
  location: string,
  wasteType: string,
  amount: string,
  imageUrl?: string,
  type?: string,
  verificationResult?: any
) {
  try {
    // ✅ Properly handle verificationResult - convert to JSON string or null
    let verificationResultForDb = null;
    
    if (verificationResult) {
      try {
        // If it's already a string, validate it's proper JSON
        if (typeof verificationResult === "string") {
          const parsed = JSON.parse(verificationResult);
          // Only accept if it has the expected structure
          if (parsed && parsed.wasteType && parsed.quantity && parsed.confidence) {
            verificationResultForDb = verificationResult; // Keep as valid JSON string
          }
        } 
        // If it's an object, stringify it
        else if (typeof verificationResult === "object") {
          if (verificationResult.wasteType && verificationResult.quantity && verificationResult.confidence) {
            verificationResultForDb = JSON.stringify(verificationResult);
          }
        }
      } catch (error) {
        console.warn("Invalid verificationResult format:", verificationResult);
        // If parsing fails, set to null
        verificationResultForDb = null;
      }
    }

    const [report] = await db
      .insert(Reports)
      .values({
        userId,
        location,
        wasteType,
        amount,
        imageUrl,
        verificationResult: verificationResultForDb, // Use the validated string or null
        status: "pending",
      })
      .returning()
      .execute();

    // Award 10 points for reporting waste
    const pointsEarned = 10;
    await updateRewardPoints(userId, pointsEarned);

    // Create a transaction for the earned points
    await createTransaction(
      userId,
      "earned_report",
      pointsEarned,
      "Points earned for reporting waste"
    );

    // Create a notification for the user
    await createNotification(
      userId,
      `You've earned ${pointsEarned} points for reporting waste!`,
      "reward"
    );

    return report;
  } catch (error) {
    console.error("Error creating report:", error);
    return null;
  }
}

// update the rewards points of the particular id 

export async function updateRewardPoints(userId: number, pointsToAdd: number) {
  try {
    const [updatedReward] = await db
      .update(Rewards)
      .set({ 
        points: sql`${Rewards.points} + ${pointsToAdd}`,
        updatedAt: new Date()
      })
      .where(eq(Rewards.userId, userId))
      .returning()
      .execute();
    return updatedReward;
  } catch (error) {
    console.error("Error updating reward points:", error);
    return null;
  }
}



// create the notification for the users
export async function createNotification(userId: number, message: string, type: string) {
  try {
    const [notification] = await db
      .insert(Notifications)
      .values({ userId, message, type })
      .returning()
      .execute();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

// create transaction for createRepotrt function
export async function createTransaction(userId: number, type: 'earned_report' | 'earned_collect' | 'redeemed', amount: number, description: string) {
  try {
    const [transaction] = await db
      .insert(Transactions)
      .values({ userId, type, amount, description })
      .returning()
      .execute();
    return transaction;
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw error;
  }
}


// get recent report backend section

export async function getRecentReports(limit: number = 10) {
  try {
    const reports = await db
      .select()
      .from(Reports)
      .orderBy(desc(Reports.createdAt))
      .limit(limit)
      .execute();
    return reports;
  } catch (error) {
    console.error("Error fetching recent reports:", error);
    return [];
  }
}


// getAvailable Rewards function 
export async function getAvailableRewards(userId: number) {
  try {
    console.log('Fetching available rewards for user:', userId);
    
    // Get user's total points
    const userTransactions = await getRewardTransactions(userId) as any;
    const userPoints = userTransactions.reduce((total:any, transaction:any) => {
      return transaction.type.startsWith('earned') ? total + transaction.amount : total - transaction.amount;
    }, 0);

    console.log('User total points:', userPoints);

    // Get available rewards from the database
    const dbRewards = await db
      .select({
        id: Rewards.id,
        name: Rewards.name,
        cost: Rewards.points,
        description: Rewards.description,
        collectionInfo: Rewards.collectionInfo,
      })
      .from(Rewards)
      .where(eq(Rewards.isAvailable, true))
      .execute();

    console.log('Rewards from database:', dbRewards);

    // Combine user points and database rewards
    const allRewards = [
      {
        id: 0, // Use a special ID for user's points
        name: "Your Points",
        cost: userPoints,
        description: "Redeem your earned points",
        collectionInfo: "Points earned from reporting and collecting waste"
      },
      ...dbRewards
    ];

    console.log('All available rewards:', allRewards);
    return allRewards;
  } catch (error) {
    console.error("Error fetching available rewards:", error);
    return [];
  }
}


// /create waste collection task
export async function createCollectedWaste(reportId: number, collectorId: number, notes?: string) {
  try {
    const [collectedWaste] = await db
      .insert(CollectedWastes)
      .values({
        reportId,
        collectorId,
        collectionDate: new Date(),
      })
      .returning()
      .execute();
    return collectedWaste;
  } catch (error) {
    console.error("Error creating collected waste:", error);
    return null;
  }
}


export async function getWasteCollectionTasks(limit: number = 20) {
  try {
    const tasks = await db
      .select({
        id: Reports.id,
        location: Reports.location,
        wasteType: Reports.wasteType,
        amount: Reports.amount,
        status: Reports.status,
        date: Reports.createdAt,
        collectorId: Reports.collectorId,
      })
      .from(Reports)
      .limit(limit)
      .execute();

    return tasks.map(task => ({
      ...task,
      date: task.date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
    }));
  } catch (error) {
    console.error("Error fetching waste collection tasks:", error);
    return [];
  }
}


// function that update the status of given task
export async function updateTaskStatus(reportId: number, newStatus: string, collectorId?: number) {
  try {
    const updateData: any = { status: newStatus };
    if (collectorId !== undefined) {
      updateData.collectorId = collectorId;
    }
    const [updatedReport] = await db
      .update(Reports)
      .set(updateData)
      .where(eq(Reports.id, reportId))
      .returning()
      .execute();
    return updatedReport;
  } catch (error) {
    console.error("Error updating task status:", error);
    throw error;
  }
}



// save reward ffunction

export async function saveReward(userId: number, amount: number) {
  try {
    const [reward] = await db
      .insert(Rewards)
      .values({
        userId,
        name: 'Waste Collection Reward',
        collectionInfo: 'Points earned from waste collection',
        points: amount,
        level: 1,
        isAvailable: true,
      })
      .returning()
      .execute();
    
    // Create a transaction for this reward
    await createTransaction(userId, 'earned_collect', amount, 'Points earned for collecting waste');

    return reward;
  } catch (error) {
    console.error("Error saving reward:", error);
    throw error;
  }
}

// function for saveCollectedWate

export async function saveCollectedWaste(reportId: number, collectorId: number, verificationResult: any) {
  try {
    const [collectedWaste] = await db
      .insert(CollectedWastes)
      .values({
        reportId,
        collectorId,
        collectionDate: new Date(),
        status: 'verified',
      })
      .returning()
      .execute();
    return collectedWaste;
  } catch (error) {
    console.error("Error saving collected waste:", error);
    throw error;
  }
}



// fetOr CreateRewards
export async function getOrCreateReward(userId: number) {
  try {
    let [reward] = await db.select().from(Rewards).where(eq(Rewards.userId, userId)).execute();
    if (!reward) {
      [reward] = await db.insert(Rewards).values({
        userId,
        name: 'Default Reward',
        collectionInfo: 'Default Collection Info',
        points: 0,
        level: 1,
        isAvailable: true,
      }).returning().execute();
    }
    return reward;
  } catch (error) {
    console.error("Error getting or creating reward:", error);
    return null;
  }
}

// redem rewards
export async function redeemReward(userId: number, rewardId: number) {
  try {
    const userReward = await getOrCreateReward(userId) as any;
    
    if (rewardId === 0) {
      // Redeem all points
      const [updatedReward] = await db.update(Rewards)
        .set({ 
          points: 0,
          updatedAt: new Date(),
        })
        .where(eq(Rewards.userId, userId))
        .returning()
        .execute();

      // Create a transaction for this redemption
      await createTransaction(userId, 'redeemed', userReward.points, `Redeemed all points: ${userReward.points}`);

      return updatedReward;
    } else {
      // Existing logic for redeeming specific rewards
      const availableReward = await db.select().from(Rewards).where(eq(Rewards.id, rewardId)).execute();

      if (!userReward || !availableReward[0] || userReward.points < availableReward[0].points) {
        throw new Error("Insufficient points or invalid reward");
      }

      const [updatedReward] = await db.update(Rewards)
        .set({ 
          points: sql`${Rewards.points} - ${availableReward[0].points}`,
          updatedAt: new Date(),
        })
        .where(eq(Rewards.userId, userId))
        .returning()
        .execute();

      // Create a transaction for this redemption
      await createTransaction(userId, 'redeemed', availableReward[0].points, `Redeemed: ${availableReward[0].name}`);

      return updatedReward;
    }
  } catch (error) {
    console.error("Error redeeming reward:", error);
    throw error;
  }
}