// SEPARATED FUNCTIONS - No nested calls

import generateProof from './proof/GenProof';
import VerifyProof from './proof/VerifyProof';
import { Register } from './register';
import addDb from './addDb';


export interface VerifyResponse {
  success: boolean;
  message: string;
  isValidProof?: boolean;
  isHashMatched?: boolean;
}

export interface ProofResponse {
  success: boolean;
  message: string;
  proof?: any;
  publicSignals?: string[];
  hash?: string;
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




// 🧪 TEST FUNCTIONS
async function testSeparateFunctions() {
  try {
    await exampleSeparateUsage("testuser1", "password123");
  } catch (error) {
    console.error("Test error:", error);
  }
}


// Uncomment to test:

// addDb({
//     databaseUrl: "postgresql://neondb_owner:npg_JYbaKWeC3h6w@ep-holy-pine-a8vdyjk6-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require",
//     runMigration: true,        // Run migrations (default: true)
//     envPath: '../.env',        // Path to .env file (default: '../.env')
//     silent: false              // Show console logs (default: false)
//   })

// testSeparateFunctions();
