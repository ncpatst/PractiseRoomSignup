// Import NodeJS modules
const crypto = require("crypto");
const fs = require("fs");

// Export the function for import elsewhere
module.exports = { SHALL24 };

// Get key from SERVERKEY.txt, DO NOT share this file. Saves a 64-characters digest string to SERVERKEY
const SERVERKEY = crypto.createHmac('sha256', fs.readFileSync("SERVERKEY.txt", "utf8")).digest('hex'); 

// The main hash algorithm used for the sign up system. SHALL24() takes any string input and returns a 6-characters, base 36 digest like "1kil6b"
function SHALL24(string) {
	function convertBase(str, fromBase, toBase) {

		const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/";

		const add = (x, y, base) => {
			let z = [];
			const n = Math.max(x.length, y.length);
			let carry = 0;
			let i = 0;
			while (i < n || carry) {
				const xi = i < x.length ? x[i] : 0;
				const yi = i < y.length ? y[i] : 0;
				const zi = carry + xi + yi;
				z.push(zi % base);
				carry = Math.floor(zi / base);
				i++;
			}
			return z;
		}

		const multiplyByNumber = (num, x, base) => {
			if (num < 0) return null;
			if (num == 0) return [];

			let result = [];
			let power = x;
			while (true) {
				num & 1 && (result = add(result, power, base));
				num = num >> 1;
				if (num === 0) break;
				power = add(power, power, base);
			}

			return result;
		}

		const parseToDigitsArray = (str, base) => {
			const digits = str.split('');
			let arr = [];
			for (let i = digits.length - 1; i >= 0; i--) {
				const n = DIGITS.indexOf(digits[i])
				if (n == -1) return null;
				arr.push(n);
			}
			return arr;
		}

		const digits = parseToDigitsArray(str, fromBase);
		if (digits === null) return null;

		let outArray = [];
		let power = [1];
		for (let i = 0; i < digits.length; i++) {
			digits[i] && (outArray = add(outArray, multiplyByNumber(digits[i], power, toBase), toBase));
			power = multiplyByNumber(fromBase, power, toBase);
		}

		let out = '';
		for (let i = outArray.length - 1; i >= 0; i--)
			out += DIGITS[outArray[i]];

		return out;
	}
	return convertBase(crypto.createHmac('sha256', crypto.createHmac('sha256', string + SERVERKEY).digest('hex') + SERVERKEY).digest('hex'), 16, 32).substr(0, 6);
}