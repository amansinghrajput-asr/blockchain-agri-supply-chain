import {ethers} from "hardhat";
import fs from "fs";
const C=await ethers.deployContract("AgriSupplyChain");
await C.waitForDeployment();
const address=await C.getAddress();
fs.writeFileSync("deployment-address.json",JSON.stringify({network:(await ethers.provider.getNetwork()).chainId.toString(),address},null,2));
console.log("AgriSupplyChain deployed:",address);
