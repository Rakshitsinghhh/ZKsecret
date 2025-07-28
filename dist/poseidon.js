"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tostring = tostring;
exports.hasher = hasher;
const poseidon_lite_1 = require("poseidon-lite");
const ethers_1 = require("ethers");
function tostring(str) {
    const hash = (0, ethers_1.keccak256)((0, ethers_1.toUtf8Bytes)(str));
    return BigInt(hash);
}
function hasher(userId, password) {
    const uname = tostring(userId);
    const upass = tostring(password);
    return (0, poseidon_lite_1.poseidon2)([uname, upass]);
}
