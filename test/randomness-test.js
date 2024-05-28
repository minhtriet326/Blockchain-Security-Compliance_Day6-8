const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Weak randomness", function () {
    let deployer, attacker, user;
    beforeEach(async function() {
        [deployer, attacker, user] = await ethers.getSigners();
        const Lottery = await ethers.getContractFactory("Lottery", deployer);
        lottery = await Lottery.deploy();

        const LotteryAttacker = await ethers.getContractFactory("LotteryAttacker", attacker);
        lotteryAttaker = await LotteryAttacker.deploy(lottery.address); 
    })

    describe("Lottery", function() {
        describe.skip("With bets open", function () {
            it("Should allow a user to place a bet", async function() {
                await lottery.placeBet(88, {value: ethers.utils.parseEther("10")});
                expect(await lottery.bets(deployer.address)).to.eq(88);
                //thằng contract bet thì mặc định deployer là msg.sender
            });

            it("Should revert if a user place more than 1 bet", async function() {
                await lottery.placeBet(88, {value: ethers.utils.parseEther("10")});
                await expect(lottery.placeBet(8, {value: ethers.utils.parseEther("10")})).to.be.revertedWith("Only 1 bet per player");
            });

            it("Should revert if bet is not 10 ether", async function() {
                await expect(lottery.placeBet(100, {value: ethers.utils.parseEther("5")})).to.be.revertedWith("Bet cost: 10 ether");
                await expect(lottery.placeBet(100, {value: ethers.utils.parseEther("55")})).to.be.revertedWith("Bet cost: 10 ether");
            });
            it("Should be revert if bet is < 0", async function() {
                await expect(lottery.placeBet(0, {value: ethers.utils.parseEther("10")})).to.be.revertedWith("Must be a number from 1 to 255");
            })
        });

        describe.skip("With bets closed", function() {
            it("Should revert if a user place a bet", async function() {
                await lottery.endLottery();
                await expect(lottery.placeBet(100, {value: ethers.utils.parseEther("10")})).to.be.revertedWith("Bets are closed");
            });

            it("Should allow only the winner to withdraw the prize", async function() {
                const initialBalanceUser = await ethers.provider.getBalance(user.address);

                await lottery.connect(user).placeBet(100, {value: ethers.utils.parseEther("10")});
                await lottery.connect(attacker).placeBet(101, {value: ethers.utils.parseEther("10")});
                await lottery.placeBet(102, {value: ethers.utils.parseEther("10")});

                let winningNumber = 0;
                while(winningNumber != 100) {
                    await lottery.endLottery();
                    winningNumber = await lottery.winningNumber();
                    console.log(winningNumber);
                }

                await expect(lottery.connect(attacker).withdrawPrize()).to.be.revertedWith("You are not winner");

                console.log("Initial balance of user: ", ethers.utils.formatEther(initialBalanceUser));
            
                await lottery.connect(user).withdrawPrize();

                const finalBalanceUser = await ethers.provider.getBalance(user.address);
                console.log("Final balance of user: ", ethers.utils.formatEther(finalBalanceUser));

                //gt là greater than
                expect(finalBalanceUser).to.be.gt(initialBalanceUser);
            })
        });

        describe("Attack", function() {
            it.skip("A miner could guess the number", async function() {
                await lottery.placeBet(88, {value: ethers.utils.parseEther("10")});
                await lottery.connect(attacker).placeBet(10, {value: ethers.utils.parseEther("10")});
                await lottery.connect(user).placeBet(11, {value: ethers.utils.parseEther("10")});

                await ethers.provider.send("evm_setNextBlockTimestamp", [1716735622]);
                let winningNumber = 0;
                while(winningNumber != 10) {
                    await lottery.endLottery();
                    winningNumber = await lottery.winningNumber();
                    console.log("Lucky number is: ", winningNumber);
                };
                //BẢN CHẤT EVM: nó ko có đồng hồ, ko có block trong evm
                //DO ĐÓ: block.timestamp do miner
                //điều kiện là nó lớn hơn block timestamp cũ là < block timestamp mới
                console.log(await ethers.provider.getBlock("latest"));

                const initialBalanceAttacker = await ethers.provider.getBalance(attacker.address);
                console.log(ethers.utils.formatEther(initialBalanceAttacker));
                await lottery.connect(attacker).withdrawPrize();
                const finalBalanceAttacker = await ethers.provider.getBalance(attacker.address);
                console.log(ethers.utils.formatEther(finalBalanceAttacker));

                expect(finalBalanceAttacker).to.be.gt(initialBalanceAttacker);
            })

            it("Attack from an attacker contract", async function () {
                await lotteryAttaker.attack({value: ethers.utils.parseEther("10")});
                await lottery.endLottery();
                await ethers.provider.send("evm_mine");//lệnh này làm cho 2 lệnh trên nằm cùng 1 block, 
                //nói cách khác: được thực thi cùng trong một block => cùng 1 timestamp => cùng 1 số
                console.log("Attack number: " + (await lottery.bets(lotteryAttaker.address)));//mình tấn công = contract thì là contract nó bet
                console.log("Winning number: " + (await lottery.winningNumber()));
            })

        });
    })
});