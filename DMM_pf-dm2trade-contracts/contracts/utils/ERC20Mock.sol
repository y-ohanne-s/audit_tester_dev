// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC20Mock is ERC20, Ownable {
    constructor(
        string memory name, 
        string memory symbol, 
        uint256 initialSupply
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }

    // オーナーが新しいトークンをミントできる関数
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // トークンをバーンする関数
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }

    // オーナーが他のアカウントのトークンをバーンする関数
    function burnFrom(address account, uint256 amount) public onlyOwner {
        _burn(account, amount);
    }
}
