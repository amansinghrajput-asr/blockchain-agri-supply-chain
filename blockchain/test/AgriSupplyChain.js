import {expect} from "chai";
import {ethers} from "hardhat";
describe("AgriSupplyChain",function(){
 it("creates and settles a batch",async function(){
  const [farmer,payer]=await ethers.getSigners();
  const C=await ethers.deployContract("AgriSupplyChain"); await C.waitForDeployment();
  const id=ethers.keccak256(ethers.toUtf8Bytes("B1"));
  await C.createBatch(id,"Wheat",100);
  await C.recordQuality(id,85,true);
  await C.recordQuality(id,80,false);
  await expect(C.connect(payer).settle(id,{value:1000})).to.emit(C,"PaymentSettled");
 });
});
