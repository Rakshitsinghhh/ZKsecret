// circom circuit for password hash

pragma circom 2.0.0;
template PasswordCheck() {
    signal input userId;
    signal input password;
    signal input storedHash;
    signal output isValid;

    // Dummy logic for now
    isValid <== 1;
}

component main = PasswordCheck();