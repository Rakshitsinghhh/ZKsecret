// YOUR MAIN FILE (paste.txt or whatever you named it)
// Replace the existing Register function with this corrected version

import { PrismaClient } from '@prisma/client';
import { hasher } from './poseidon'; // Keep this import even though we won't use it for registration
import generateProof from './proof/GenProof';
import VerifyProof from './proof/VerifyProof';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import verifyProof from './proof/VerifyProof';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

export interface AddDbOptions {
  runMigration?: boolean;
  envPath?: string;
  silent?: boolean;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  userId?: string;
}

/**
 * CORRECTED Register function - uses circuit hash instead of poseidon hash
 * @param userId - Unique user identifier
 * @param password - User password (will be hashed by circuit)
 * @returns Promise with registration result
 */
export async function Register(userId: string, password: string): Promise<RegisterResponse> {
  try {
    // Input validation
    if (!userId || !password) {
      return {
        success: false,
        message: 'userId and password must be provided'
      };
    }

    if (typeof userId !== 'string' || typeof password !== 'string') {
      return {
        success: false,
        message: 'userId and password must be strings'
      };
    }

    // 🔧 CHANGED: Get hash from circuit instead of computing manually
    console.log("🔒 Generating proof to get correct hash...");
    const { proof, publicSignals } = await generateProof(password);
    const hash = publicSignals[0]; // This is the hash your circuit produces
    
    console.log("Hash from circuit:", hash);
    console.log("📊 Public signals:", publicSignals);

    // Save user with circuit-consistent hash
    await prisma.user.create({
      data: {
        UserId: userId,
        hash: hash, // 🔧 CHANGED: Use circuit hash, not poseidon hash
      },
    });

    console.log("✅ Hash saved to database");

    // 🔧 CHANGED: Enable ZK proof verification since we have the proof already
    try {
      console.log("🔍 Verifying proof...");
      
      // Verify proof
      const verified = await verifyProof(proof, publicSignals, userId);

      if (verified.isValidProof && verified.isHashMatched) {
        console.log('✅ Proof verified successfully');
      } else {
        console.warn('⚠️ Proof verification failed:', verified.message);
        return {
          success: false,
          message: 'Proof verification failed'
        };
      }
    } catch (proofError) {
      console.error('❌ Proof verification error:', proofError);
      return {
        success: false,
        message: 'Proof system error'
      };
    }

    return {
      success: true,
      message: 'User registered and verified successfully',
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

// Keep all your other functions unchanged (addDb, initializeDatabase, cleanup, etc.)
// ... rest of your code stays the same ...

// 🔧 UPDATED: Your test function will now work correctly
async function testuser(userID: string, pass: string) {
  try {
    console.log(`🔧 Registering user: ${userID}`);
    const registerResult = await Register(userID, pass);
    console.log("Registration result:", registerResult);
    
    if (!registerResult.success) {
      console.error("❌ Registration failed:", registerResult.message);
      return;
    }

    // Since Register already includes verification, we're done!
    console.log("🎉 Registration and verification completed successfully!");

  } catch (error) {
    console.error("❌ Test user error:", error);
  }
}

// Test it
testuser("newuser123", "12123");