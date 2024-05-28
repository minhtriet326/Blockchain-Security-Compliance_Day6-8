// SPDX-License-Identifier: UNLICENSED 
pragma solidity <= 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract Lottery is Ownable {
    using Address for address payable;

    uint8 public winningNumber;
    mapping(address => uint8) public bets;
    bool public betsClosed;
    bool public prizeTaken;//đã có người trúng giải

    function placeBet(uint8 _number) external payable {
        require(bets[msg.sender] == 0, "Only 1 bet per player");
        require(msg.value == 10 ether, "Bet cost: 10 ether");//msg.sender đại diện cho số tiền mà người gửi transsaction này đính kèm vào
        require(betsClosed == false, "Bets are closed");
        require(_number > 0 && _number <= 255, "Must be a number from 1 to 255");

        bets[msg.sender] = _number;
    } 

    function endLottery() external onlyOwner {
        betsClosed = true;
        winningNumber = pseudoRandNumGen();
    }

    function withdrawPrize() external {//người win bay vào hốt hết ether
        require(betsClosed == true, "Bets is still open");
        require(prizeTaken == false, "Prize alreadly taken");
        require(bets[msg.sender] == winningNumber, "You are not winner");

        prizeTaken = true;
        payable(msg.sender).transfer(address(this).balance);
    }

    function pseudoRandNumGen() private view returns(uint8) {
        return uint8(uint256(keccak256(abi.encode(block.timestamp))) % 254) + 1;
        //block.timestamp được chọn làm seed: là một con số là gần như ko thể dự đoán được
        //VÌ: nó lấy timestamp của cái block mà trong block đó cái transaction này được đào
        //VÀ block.timestamp này nó nằm trong header của block
        //đem đi encode
        //băm bằng keccak256 xong ép về uint256 rồi % 245 
        //ép về uint8 + 1
    }
}