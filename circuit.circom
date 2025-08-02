template Main() {
    signal input secret;
    signal output out;

    out <== secret * secret; // Constraint: public output is the square of secret
}

component main = Main();
