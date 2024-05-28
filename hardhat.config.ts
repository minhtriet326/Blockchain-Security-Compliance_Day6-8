import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + "./env" });
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        compilers: [
            {
                version: "0.8.17"
            }
        ]
    },
    networks: {
        hardhat: {
            initialBaseFeePerGas: 0,
            mining: {
                auto: false,//tắt tính năng đào transaction tự động. Theo mặc định, Hardhat sẽ tự động đào transaction khi có transaction chờ đợi
                interval: 3000,//Cài đặt này đặt khoảng thời gian (tính bằng mili giây) giữa các khối được đào. Việc tăng giá trị này sẽ làm chậm tốc độ đào transaction
            }
        }
    }
};
