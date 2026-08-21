import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv"; dotenv.config();
export default {
 solidity:"0.8.24",
 networks:{
   hardhat:{},
   localhost:{url:"http://127.0.0.1:8545"},
   amoy:{url:process.env.RPC_URL||"",accounts:process.env.PRIVATE_KEY?[`0x${process.env.PRIVATE_KEY.replace(/^0x/,"")}`]:[]}
 }
};
