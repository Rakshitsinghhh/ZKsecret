import { poseidon2 } from "poseidon-lite";
import { keccak256, toUtf8Bytes } from "ethers";


export function tostring(str: string):bigint{

    const hash = keccak256(toUtf8Bytes(str));
    return BigInt(hash);

}


export function hasher(secret: bigint): bigint {
    // poseidon2 expects an array of 2 elements with lowercase bigint type
    // We can pad with 0 or use the secret twice, depending on your needs
    
    // Option 1: Use secret and 0 as padding
    return poseidon2([secret, 0]);
    
    // Option 2: Use secret twice (uncomment if preferred)
    // return poseidon2([secret, secret]);
    
    // Option 3: Use secret and a constant salt (more secure)
    // const SALT = 123456789n; // Use a consistent salt
    // return poseidon2([secret, SALT]);
}

// Alternative: If you want to hash userId + password together
export function hasherWithUserId(userId: string, password: string): bigint {
    // Convert strings to BigInt (you might want to use a proper string-to-bigint conversion)
    const userIdBigInt = BigInt('0x' + Buffer.from(userId, 'utf8').toString('hex'));
    const passwordBigInt = BigInt(password); // Assuming password is numeric
    
    return poseidon2([userIdBigInt, passwordBigInt]);
}

// For debugging - convert string to BigInt safely
export function stringToBigInt(str: string): bigint {
    // Convert string to hex, then to BigInt
    const hex = Buffer.from(str, 'utf8').toString('hex');
    return BigInt('0x' + hex);
}
