import * as snarkjs from 'snarkjs';

/**
 * Convert string to BigInt for circuit input
 * Handles any string format (numeric, text, special characters)
 */
function stringToFieldElement(str: string): bigint {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  
  let hexString = '0x';
  for (const byte of bytes) {
    hexString += byte.toString(16).padStart(2, '0');
  }
  
  // BN254 field prime - standard for most ZK circuits
  const prime = BigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617");
  return BigInt(hexString) % prime;
}

/**
 * Generate ZK proof from string password
 * @param secret - Password as string (any format)
 * @returns Promise with proof and public signals
 */
export default async function generateProof(secret: string) {
  try {
    console.log("🔒 Converting password to circuit input...");
    
    // Convert string to BigInt that circuit can understand
    const secretBigInt = stringToFieldElement(secret);
    
    console.log("Original password:", secret);
    console.log("Converted to BigInt:", secretBigInt.toString());
    
    console.log("🔄 Generating proof with snarkjs...");
    
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      { secret: secretBigInt },
      "circuit.wasm",
      "circuit_0000.zkey"
    );
    
    console.log("✅ Proof generated successfully!");
    console.log("Public signals:", publicSignals);
    
    return { proof, publicSignals };
    
  } catch (error) {
    console.error("❌ Error generating proof:", error);
    throw error;
  }
}