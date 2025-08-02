import { PrismaClient } from '@prisma/client';
import { hasher } from './poseidon'; // returns native BigInt hash
import generateProof from './proof/GenProof';  // assumed default export
import VerifyProof from './proof/VerifyProof'; // assumed default export

const prisma = new PrismaClient();

export async function Register(userId: string, password: string): Promise<void> {
  try {
    if (!userId || !password) {
      throw new Error('userId and password must be provided');
    }

    // Compute hash from userId and password (as BigInt)
    const secret = BigInt(password)
    const hash = hasher(secret);
    console.log("Hash:", hash);

    const hashString = hash.toString();

    // Save user with hash only, avoid storing raw passwords if possible!
    // If your schema requires 'password', you can optionally add it here
    await prisma.user.create({
      data: {
        UserId: userId,
        hash: hashString,
      },
    });

    console.log("✅ Hash saved to database");

    // Generate zero-knowledge proof; must return { proof, publicSignals }
    const { proof, publicSignals } = await generateProof(password);
    console.log("🔒proof:",proof);

    // Verify proof by passing proof and publicSignals
    const verified = await VerifyProof(proof, publicSignals,userId);

    if (verified) {
      console.log('✅ Proof verified successfully');
    } else {
      console.warn('⚠️ Proof verification failed');
    }

  } catch (err: any) {
    // Prisma unique constraint violation error code is P2002
    if (err.code === "P2002") {
      console.log("⚠️ Username already exists");
    } else {
      console.error("❌ Data insertion error:", err);
    }
  }
}

// Example direct call (remove or comment out in production)
Register("rerer", "454545").catch(console.error);