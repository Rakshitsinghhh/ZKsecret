import { PrismaClient } from '@prisma/client';
import * as snarkjs from 'snarkjs';
import * as fs from 'fs';

const prisma = new PrismaClient();

export interface VerifyResponse {
  success: boolean;
  message: string;
  isValidProof?: boolean;
  isHashMatched?: boolean;
}

/**
 * FIXED: Verify proof function without recursion
 * @param proof - The proof to verify
 * @param publicSignals - Public signals from proof generation
 * @param userId - User ID to verify against database
 * @returns Promise with verification result
 */
export async function VerifyProof(proof: any, publicSignals: string[], userId: string): Promise<VerifyResponse> {
  try {
    // Input validation
    if (!proof || !publicSignals || !userId) {
      return {
        success: false,
        message: 'Proof, publicSignals, and userId must be provided'
      };
    }

    if (!Array.isArray(publicSignals) || typeof userId !== 'string') {
      return {
        success: false,
        message: 'Invalid input types'
      };
    }

    console.log("🔍 Verifying proof...");
    console.log("User ID:", userId);
    console.log("Public signals:", publicSignals);

    // Step 1: Verify the cryptographic proof using snarkjs
    console.log("🔐 Verifying cryptographic proof...");
    
    // Load verification key from file
    let verificationKey;
    let isValidProof = false;
    
    try {
      // Load verification key from JSON file
      const fs = require('fs');
      const vkeyData = fs.readFileSync('verification_key.json', 'utf8');
      verificationKey = JSON.parse(vkeyData);
      
      console.log("📋 Verification key loaded successfully");
    } catch (vkeyError) {
      console.error("❌ Failed to load verification key:", vkeyError);
      return {
        success: false,
        message: 'Failed to load verification key file',
        isValidProof: false,
        isHashMatched: false
      };
    }
    
    try {
      isValidProof = await snarkjs.groth16.verify(
        verificationKey, // ✅ Pass the loaded object, not file path
        publicSignals,
        proof
      );
      console.log("Cryptographic proof valid:", isValidProof);
    } catch (cryptoError) {
      console.error("❌ Cryptographic verification failed:", cryptoError);
      return {
        success: false,
        message: 'Cryptographic proof verification failed',
        isValidProof: false,
        isHashMatched: false
      };
    }

    // Step 2: Check if hash matches database
    console.log("🗄️ Checking hash against database...");
    
    let isHashMatched = false;
    try {
      const user = await prisma.user.findUnique({
        where: { UserId: userId }
      });

      if (!user) {
        console.log("❌ User not found in database");
        return {
          success: false,
          message: 'User not found',
          isValidProof,
          isHashMatched: false
        };
      }

      const hashFromProof = publicSignals[0]; // First public signal should be the hash
      isHashMatched = user.hash === hashFromProof;
      
      console.log("Hash from database:", user.hash);
      console.log("Hash from proof:", hashFromProof);
      console.log("Hash matched:", isHashMatched);
      
    } catch (dbError) {
      console.error("❌ Database check failed:", dbError);
      return {
        success: false,
        message: 'Database verification failed',
        isValidProof,
        isHashMatched: false
      };
    }

    // Step 3: Final result
    if (isValidProof && isHashMatched) {
      console.log('✅ Proof verified successfully');
      return {
        success: true,
        message: 'Proof verified successfully',
        isValidProof: true,
        isHashMatched: true
      };
    } else {
      const issues = [];
      if (!isValidProof) issues.push('invalid cryptographic proof');
      if (!isHashMatched) issues.push('hash mismatch');
      
      const errorMessage = `Verification failed: ${issues.join(', ')}`;
      console.warn('⚠️', errorMessage);
      
      return {
        success: false,
        message: errorMessage,
        isValidProof,
        isHashMatched
      };
    }

  } catch (error: any) {
    console.error("❌ Proof verification error:", error);
    return {
      success: false,
      message: `Proof verification failed: ${error.message || 'Unknown error'}`,
      isValidProof: false,
      isHashMatched: false
    };
  }
}

export default VerifyProof;