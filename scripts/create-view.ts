import fs from "fs";
import path from "path";

const viewsFolder = path.resolve(__dirname, "../src/views");

const name = process.argv[2];

if (!name) {
	throw new Error("name was not given");
}

const tsx = `import styles from "./${name}.module.scss";

export default function ${name}() {}
`;

Bun.write(path.resolve(viewsFolder, name + ".tsx"), tsx);
Bun.write(path.resolve(viewsFolder, name + ".module.scss"), "");
