// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract AgriSupplyChain {
    struct Batch { string crop; uint256 quantity; uint8 harvestScore; uint8 deliveryScore; address farmer; bool settled; }
    mapping(bytes32 => Batch) public batches;
    event BatchCreated(bytes32 indexed id, string crop, uint256 quantity, address indexed farmer);
    event QualityRecorded(bytes32 indexed id, uint8 score, bool harvest);
    event PaymentSettled(bytes32 indexed id, address indexed farmer, uint256 amount);

    function createBatch(bytes32 id, string calldata crop, uint256 quantity) external {
        require(batches[id].farmer == address(0), "batch exists");
        batches[id] = Batch(crop, quantity, 0, 0, msg.sender, false);
        emit BatchCreated(id, crop, quantity, msg.sender);
    }
    function recordQuality(bytes32 id, uint8 score, bool harvest) external {
        require(batches[id].farmer != address(0), "unknown batch");
        require(score <= 100, "invalid score");
        if (harvest) batches[id].harvestScore = score;
        else batches[id].deliveryScore = score;
        emit QualityRecorded(id, score, harvest);
    }
    function settle(bytes32 id) external payable {
        Batch storage b=batches[id];
        require(b.farmer != address(0), "unknown batch");
        require(!b.settled, "already settled");
        require(b.harvestScore > 0 && b.deliveryScore > 0, "quality incomplete");
        uint256 amount=msg.value;
        b.settled=true;
        (bool ok,)=b.farmer.call{value:amount}("");
        require(ok,"payment failed");
        emit PaymentSettled(id,b.farmer,amount);
    }
}
