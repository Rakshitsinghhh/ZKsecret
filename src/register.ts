import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface RegisterResponse {
  success: boolean;
  message: string;
  userId?: string;
}

/**
 * 1️⃣ REGISTER FUNCTION - Only handles database operations
 * @param userId - Unique user identifier
 * @param hash - Pre-computed hash from circuit
 * @returns Promise with registration result
 */
export async function Register(userId: string, hash: string): Promise<RegisterResponse> {
  try {
    // Input validation
    if (!userId || !hash) {
      return {
        success: false,
        message: 'userId and hash must be provided'
      };
    }

    if (typeof userId !== 'string' || typeof hash !== 'string') {
      return {
        success: false,
        message: 'userId and hash must be strings'
      };
    }

    console.log("💾 Saving user to database...");
    console.log("User ID:", userId);
    console.log("Hash:", hash);

    // Save user to database
    await prisma.user.create({
      data: {
        UserId: userId,
        hash: hash,
      },
    });

    console.log("✅ User saved to database successfully");

    return {
      success: true,
      message: 'User registered successfully',
      userId: userId
    };

  } catch (err: any) {
    // Handle Prisma unique constraint violation
    if (err.code === "P2002") {
      console.log("⚠️ Username already exists");
      return {
        success: false,
        message: 'Username already exists'
      };
    } 
    
    // Handle other database errors
    console.error("❌ Registration error:", err);
    return {
      success: false,
      message: `Registration failed: ${err.message || 'Unknown error'}`
    };
  }
}