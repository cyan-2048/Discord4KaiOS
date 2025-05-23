import { PermissionFlagsBits } from "discord-api-types/v10";

let e = "export const PermissionFlagsBits = Object.freeze({ ";

const DV = 1 << 28;

for (const key in PermissionFlagsBits) {
	const n = PermissionFlagsBits[key as keyof typeof PermissionFlagsBits];
	const isOutOfBounds = !(-DV <= n && n < DV);

	e = e + ` ${key}: BigInteger.BigInt(${isOutOfBounds ? '"0x' + n.toString(16) + '"' : n.toString(10)}),\n`;
}

e = e + `});`;

console.log(e);
