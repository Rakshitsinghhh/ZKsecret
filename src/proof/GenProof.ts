import * as snarkjs from 'snarkjs';


export default async function generateProof(secret:any) {
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    { secret },
    "circuit.wasm",
    "circuit_0000.zkey"
  );

  return { proof, publicSignals };
}
