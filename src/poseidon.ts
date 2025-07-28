import { poseidon2 } from "poseidon-lite";
import { keccak256, toUtf8Bytes } from "ethers";


export function tostring(str: string):bigint{

    const hash = keccak256(toUtf8Bytes(str));
    return BigInt(hash);

}


export function hasher(userId:string,password:string){

    const uname = tostring(userId);
    const upass = tostring(password);

    return poseidon2([uname,upass]);


}