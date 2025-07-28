"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Register = Register;
const client_1 = require("@prisma/client");
const poseidon_1 = require("./poseidon"); // should return native BigInt
const prisma = new client_1.PrismaClient();
function Register(userId, password) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const hash = (0, poseidon_1.hasher)(userId, password);
            console.log("Hash:", hash);
            const hashstring = hash.toString();
            yield prisma.user.create({
                data: {
                    UserId: userId,
                    password: password,
                    hash: hashstring,
                },
            });
            console.log("✅ Hash saved to database");
        }
        catch (err) {
            console.error("❌ Data insertion error:", err);
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
Register("rakshit", "1323123");
