// SEPARATED FUNCTIONS - No nested calls

import { PrismaClient } from '@prisma/client';
import { hasher } from './poseidon';
import generateProof from './proof/GenProof';
import VerifyProof from './proof/VerifyProof';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

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

export interface ProofResponse {
  success: boolean;
  message: string;
  proof?: any;
  publicSignals?: string[];
  hash?: string;
}

export interface VerifyResponse {
  success: boolean;
  message: string;
  isValidProof?: boolean;
  isHashMatched?: boolean;
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

/**
 * 2️⃣ GENERATE PROOF FUNCTION - Only handles proof generation
 * @param password - User password
 * @returns Promise with proof generation result
 */
export async function GenerateProof(password: string): Promise<ProofResponse> {
  try {
    // Input validation
    if (!password) {
      return {
        success: false,
        message: 'Password must be provided'
      };
    }

    if (typeof password !== 'string') {
      return {
        success: false,
        message: 'Password must be a string'
      };
    }

    console.log("🔒 Generating proof...");
    
    // Generate proof using the circuit
    // const spass = BigInt(password)
    const { proof, publicSignals } = await generateProof(password);
    const hash = publicSignals[0]; // Extract hash from circuit output
    
    console.log("✅ Proof generated successfully");
    console.log("Hash from circuit:", hash);
    console.log("📊 Public signals:", publicSignals);

    return {
      success: true,
      message: 'Proof generated successfully',
      proof: proof,
      publicSignals: publicSignals,
      hash: hash
    };

  } catch (error: any) {
    console.error("❌ Proof generation error:", error);
    return {
      success: false,
      message: `Proof generation failed: ${error.message || 'Unknown error'}`
    };
  }
}

// /**
//  * 3️⃣ VERIFY PROOF FUNCTION - Only handles proof verification
//  * @param proof - The proof to verify
//  * @param publicSignals - Public signals from proof generation
//  * @param userId - User ID to verify against database
//  * @returns Promise with verification result
//  */
// export async function VerifyProof(proof: any, publicSignals: string[], userId: string): Promise<VerifyResponse> {
//   try {
//     // Input validation
//     if (!proof || !publicSignals || !userId) {
//       return {
//         success: false,
//         message: 'Proof, publicSignals, and userId must be provided'
//       };
//     }

//     if (!Array.isArray(publicSignals) || typeof userId !== 'string') {
//       return {
//         success: false,
//         message: 'Invalid input types'
//       };
//     }

//     console.log("🔍 Verifying proof...");
//     console.log("User ID:", userId);
//     console.log("Public signals:", publicSignals);

//     // Verify the proof using your verification function
//     const verificationResult = await VerifyProof(proof, publicSignals, userId);

//     if (verificationResult.isValidProof && verificationResult.isHashMatched) {
//       console.log('✅ Proof verified successfully');
//       return {
//         success: true,
//         message: 'Proof verified successfully',
//         isValidProof: true,
//         isHashMatched: true
//       };
//     } else {
//       console.warn('⚠️ Proof verification failed:', verificationResult.message);
//       return {
//         success: false,
//         message: verificationResult.message || 'Proof verification failed',
//         isValidProof: verificationResult.isValidProof || false,
//         isHashMatched: verificationResult.isHashMatched || false
//       };
//     }

//   } catch (error: any) {
//     console.error("❌ Proof verification error:", error);
//     return {
//       success: false,
//       message: `Proof verification failed: ${error.message || 'Unknown error'}`
//     };
//   }
// }

/**
 * 4️⃣ COMPLETE REGISTRATION WORKFLOW - Uses all three functions separately
 * This shows how to use all three functions together
 */
export async function CompleteRegistration(userId: string, password: string): Promise<{
  success: boolean;
  message: string;
  steps: {
    proofGeneration: ProofResponse;
    registration: RegisterResponse;
    verification: VerifyResponse;
  };
}> {
  const steps = {
    proofGeneration: { success: false, message: '' } as ProofResponse,
    registration: { success: false, message: '' } as RegisterResponse,
    verification: { success: false, message: '' } as VerifyResponse
  };

  try {
    // Step 1: Generate proof
    console.log("🔄 Step 1: Generating proof...");
    steps.proofGeneration = await GenerateProof(password);
    
    if (!steps.proofGeneration.success) {
      return {
        success: false,
        message: 'Proof generation failed',
        steps
      };
    }

    // Step 2: Register user with hash from proof
    console.log("🔄 Step 2: Registering user...");
    steps.registration = await Register(userId, steps.proofGeneration.hash!);
    
    if (!steps.registration.success) {
      return {
        success: false,
        message: 'Registration failed',
        steps
      };
    }

    // Step 3: Verify the proof
    console.log("🔄 Step 3: Verifying proof...");
    steps.verification = await VerifyProof(
      steps.proofGeneration.proof!,
      steps.proofGeneration.publicSignals!,
      userId
    );
    
    if (!steps.verification.success) {
      return {
        success: false,
        message: 'Proof verification failed',
        steps
      };
    }

    console.log("🎉 Complete registration workflow finished successfully!");
    
    return {
      success: true,
      message: 'Complete registration workflow successful',
      steps
    };

  } catch (error: any) {
    console.error("❌ Complete registration workflow error:", error);
    return {
      success: false,
      message: `Workflow failed: ${error.message || 'Unknown error'}`,
      steps
    };
  }
}

// 📝 USAGE EXAMPLES:

/**
 * Example 1: Use functions separately
 */
async function exampleSeparateUsage(userId: string, password: string) {
  console.log("=== SEPARATE FUNCTION USAGE ===");
  
  // 1. Generate proof first
  const proofResult = await GenerateProof(password);
  if (!proofResult.success) {
    console.error("Proof generation failed:", proofResult.message);
    return;
  }
  
  // 2. Register user with the hash
  const registerResult = await Register(userId, proofResult.hash!);
  if (!registerResult.success) {
    console.error("Registration failed:", registerResult.message);
    return;
  }
  
  // 3. Verify the proof
  const verifyResult = await VerifyProof(proofResult.proof!, proofResult.publicSignals!, userId);
  if (!verifyResult.success) {
    console.error("Verification failed:", verifyResult.message);
    return;
  }
  
  console.log("✅ All steps completed successfully!");
}

/**
 * Example 2: Use the complete workflow function
 */
async function exampleCompleteWorkflow(userId: string, password: string) {
  console.log("=== COMPLETE WORKFLOW USAGE ===");
  
  const result = await CompleteRegistration(userId, password);
  
  if (result.success) {
    console.log("✅ Complete workflow successful!");
  } else {
    console.error("❌ Workflow failed:", result.message);
    console.log("Steps status:", result.steps);
  }
}

// 🧪 TEST FUNCTIONS
async function testSeparateFunctions() {
  try {
    await exampleSeparateUsage("testuser5", "password123");
  } catch (error) {
    console.error("Test error:", error);
  }
}

async function testCompleteWorkflow() {
  try {
    await exampleCompleteWorkflow("testuser6", "password456");
  } catch (error) {
    console.error("Test error:", error);
  }
}

// Uncomment to test:
// testSeparateFunctions();
testCompleteWorkflow();