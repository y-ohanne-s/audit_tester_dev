// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

interface ITokenURI {
    function tokenURI_variable(uint256 tokenId) external view returns (string memory);
}