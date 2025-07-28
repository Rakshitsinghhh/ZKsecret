## 🧠 Goal: Prove you know the password without revealing it.

When a user logs in:

- You **don’t send the password**.
- You generate a **new ZK proof** using their password.
- Then **send the proof + public hash** to the server (or smart contract).
- The server just checks: *"Does this proof prove knowledge of the correct password that hashes to the storedHash?"*

## ✅ Step-by-Step Usage (Every Login)

### 🔐 1. User types:

```
js
CopyEdit
userId = "rakshit"
password = "1234"

```

### 🧮 2. You generate a proof:

You run a small script or function to:

- Calculate `Poseidon(userId, password)`
- Load the circuit and zkey files
- Generate the ZK proof (`proof.json`) and public hash (`public.json`)

This uses:

```
js
CopyEdit
const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, "circuit.wasm", "circuit_final.zkey");

```

`input` will look like:

```
js
CopyEdit
{
  userId: stringToBigInt("rakshit"),
  password: stringToBigInt("1234")
}

```

---

### 📤 3. Send to backend (or smart contract):

```
js
CopyEdit
{
  proof: proof,               // from proof.json
  publicInputs: publicSignals // from public.json (contains storedHash)
}

```

---

### ✅ 4. Backend verifies:

It loads the `verification_key.json` and checks:

```
js
CopyEdit
snarkjs.groth16.verify(vkey, publicSignals, proof);

```

If `true`: ✅ You’re authenticated

If `false`: ❌ Wrong password

---

## 🤔 But wait, do I need to save proof forever?

**No!**

You generate a **new proof every time** the user logs in.

Why?

- Password is private
- Hash stays the same
- But proof is like a **mathematical receipt**, showing: “Yes, I know the password!”

---

## 🗃️ What gets stored in DB?

| What | Stored? | Purpose |
| --- | --- | --- |
| `storedHash` | ✅ Yes | Poseidon(userId, password) |
| `proof.json` | ❌ No | Recomputed every login |
| `userId` | ✅ Yes | To identify user |

zk-password-auth/
├── circuits/
│   ├── password.circom           # Circom circuit definition
│   ├── input.json                # Sample input for proof generation
│   ├── build/                    # Compiled circuit artifacts
│   │   ├── password.r1cs
│   │   ├── password.wasm
│   │   ├── password.sym
│   │   └── password_final.zkey
│   └── verification_key.json     # Used for proof verification
│
├── prover/
│   ├── generateProof.js          # JS script to generate proof (proof.json & public.json)
│   └── proof.json                # Generated ZK proof (output)
│   └── public.json               # Public inputs (output)
│
├── verifier/
│   ├── verifyProof.js            # JS script to verify the proof
│
├── utils/
│   └── poseidon.js               # Poseidon hash utility
│   └── utils.js                  # Helpers like stringToBigInt()
│
├── trusted_setup/
│   ├── powersOfTau28_hez_final_10.ptau  # Downloaded or generated via snarkjs
│
├── package.json
├── [README.md](http://readme.md/)
└── .gitignore

zk-password-proof/
│
├── circuits/
│   ├── password.circom        # Circom circuit
│   ├── poseidonHasher.circom  # Poseidon helper (imported in circuit)
│   └── build/                 # Compiled files
│
├── inputs/
│   ├── input.json             # Private input (userId, password)
│
├── zkeys/
│   ├── password_0000.zkey     # Trusted setup phase 1
│   ├── password_final.zkey    # Final proving key
│   └── verification_key.json  # For verifying proof
│
├── proof/
│   ├── proof.json             # Generated proof
│   ├── public.json            # Public output (e.g. storedHash)
│
├── scripts/
│   ├── generate_input.js      # Create input.json
│   ├── generate_proof.js      # Call snarkjs to generate proof
│   └── verify_proof.js        # Verifies proof
│
├── powersOfTau28_hez_final_10.ptau  # Trusted setup file
├── package.json
└── [README.md](http://readme.md/)

## 🧪 Example Flow

1. ✅ **Compile circuit**

```bash
bash
CopyEdit
circom password.circom --r1cs --wasm --sym -o build

```

1. ✅ **Setup**

```bash
bash
CopyEdit
snarkjs groth16 setup build/password.r1cs ../trusted_setup/powersOfTau28_hez_final_10.ptau build/password_final.zkey

```

1. ✅ **Generate verification key**

```bash
bash
CopyEdit
snarkjs zkey export verificationkey build/password_final.zkey circuits/verification_key.json

```

1. ✅ **Generate proof**

```bash
bash
CopyEdit
node prover/generateProof.js

```

1. ✅ **Verify proof**

```bash
bash
CopyEdit
node verifier/verifyProof.js

```