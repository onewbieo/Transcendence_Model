import { prisma } from "../prisma";

// Function to create a notification
export async function createNotification(userId: number, message: string) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        message,
      },
    });
  }
  catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}
