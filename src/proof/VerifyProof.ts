import * as snarkjs from 'snarkjs';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface VerificationResult {
  isValidProof: boolean;
  isHashMatched: boolean;
  userExists: boolean;
  userId?: string;
  message: string;
}

export default async function verifyProof(
  proof: any, 
  publicSignals: any, 
  userId: string
): Promise<VerificationResult> {
  try {
    // Step 1: Verify the ZK proof
    const vKeyPath = path.join(process.cwd(), "verification_key.json");
    
    if (!fs.existsSync(vKeyPath)) {
      return {
        isValidProof: false,
        isHashMatched: false,
        userExists: false,
        message: "Verification key not found. Run 'npm run setup' first."
      };
    }

    const vKey = JSON.parse(fs.readFileSync(vKeyPath, 'utf8'));
    const isValidProof = await snarkjs.groth16.verify(vKey, publicSignals, proof);

    if (!isValidProof) {
      return {
        isValidProof: false,
        isHashMatched: false,
        userExists: false,
        message: "❌ Invalid ZK proof"
      };
    }

    // Step 2: Check if user exists in database
    const user = await prisma.user.findUnique({
      where: { UserId: userId }
    });

    if (!user) {
      return {
        isValidProof: true,
        isHashMatched: false,
        userExists: false,
        message: "❌ User not found in database"
      };
    }

    // Step 3: Verify the hash matches
    // publicSignals[0] should be the hash (secret^2 in your circuit)
    const proofHash = publicSignals[0].toString();
    const storedHash = user.hash;

    const isHashMatched = proofHash === storedHash;

    if (!isHashMatched) {
      return {
        isValidProof: true,
        isHashMatched: false,
        userExists: true,
        userId: user.UserId,
        message: "❌ Hash mismatch - incorrect secret"
      };
    }

    // Step 4: All checks passed
    return {
      isValidProof: true,
      isHashMatched: true,
      userExists: true,
      userId: user.UserId,
      message: "✅ Authentication successful"
    };

  } catch (error) {
    console.error("Verification error:", error);
    return {
      isValidProof: false,
      isHashMatched: false,
      userExists: false,
      message: `❌ Verification failed: ${error}`
    };
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to verify without user lookup (just proof verification)
export async function verifyProofOnly(proof: any, publicSignals: any): Promise<boolean> {
  try {
    const vKeyPath = path.join(process.cwd(), "verification_key.json");
    const vKey = JSON.parse(fs.readFileSync(vKeyPath, 'utf8'));
    return await snarkjs.groth16.verify(vKey, publicSignals, proof);
  } catch (error) {
    console.error("Proof verification error:", error);
    return false;
  }
}