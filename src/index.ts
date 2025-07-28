import { PrismaClient } from '@prisma/client';
import { hasher } from './poseidon'; // should return native BigInt

const prisma = new PrismaClient();

export async function Register(userId: string, password: string) {
  try {
    const hash = hasher(userId, password);
    console.log("Hash:", hash);
    const hashstring = hash.toString();

    await prisma.user.create({
      data: {
        UserId: userId,
        password: password,
        hash: hashstring,
      },
    });

    console.log("✅ Hash saved to database");
  } catch (err) {
    console.error("❌ Data insertion error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

Register("rakshit", "1323123");
