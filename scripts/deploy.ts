import { ethers, hardhatArguments } from "hardhat";
import * as Config from "./config";
async function main() {
    await Config.initConfig()
    const network = hardhatArguments.network ? hardhatArguments.network : "dev";
    const [deployer] = await ethers.getSigners();
    console.log("Address of deploy Wallet: ", deployer.address);

    const Token = await ethers.getContractFactory("STMan");
    const token = await Token.deploy();
    console.log("STMan contract address: ", token.address);
    Config.setConfig(network + '.STMan', token.address);
    await Config.updateConfig();
}
main().then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })