// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MonadArenaToken is ERC20, Ownable {
    // Game core contract address
    address public gameCoreContract;

    // Events
    event GameCoreContractUpdated(address indexed newContract);

    constructor() ERC20("Monad Arena Token", "ARENA") {
        // Mint initial supply to contract creator
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    // Set game core contract
    function setGameCoreContract(address _gameCoreContract) external onlyOwner {
        gameCoreContract = _gameCoreContract;
        emit GameCoreContractUpdated(_gameCoreContract);
    }

    // Mint tokens (only game core contract can call)
    function mint(address to, uint256 amount) external {
        require(
            msg.sender == gameCoreContract,
            "Only game core contract can mint"
        );
        _mint(to, amount);
    }
}
