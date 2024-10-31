// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IYamanekoNFT {
    // Events
    event NFTMintEvent(address indexed recipient, uint256 tokenId, uint256 contentsId, string uri, address operator);
    event NFTBurnEvent(address indexed recipient, uint256 tokenId, uint256 contentsId, address operator);
    event SetSBTAddressEvent(address indexed sbtAddress);
    event SetMarketplaceAddressEvent(address indexed marketplaceAddress);
    event SetSBTonNFTEvent(address indexed owner, uint256 tokenId, uint256 preTokenId, uint256 contentsId, uint256 sbtTokenId, address operator);
    event RemoveSBTonNFTEvent(address indexed owner, uint256 preTokenId, uint256 contentsId, uint256 sbtTokenId, address operator);

    // Structs
    struct ApprovePermitVoucher{
        address owner;
        address operator;
        bool approved;
        uint256 nonce;
        uint256 deadline;
        bytes signature;
    }

    // Functions
    function initialize(address _sbtAddress) external;
    function mint(address to, uint256 tokenId, uint256 contentsId, string calldata uri) external;
    function burn(uint256 tokenId) external;
    function setSBTAddress(address _sbtAddress) external;
    function setMarketplaceAddress(address _marketplaceAddress) external;
    function setSBTonNFT(address owner, uint256 tokenId, uint256 contentsId) external;
    function removeSBTonNFT(address owner, uint256 contentsId) external;
    function getSBTonBattleNFT(address owner, uint256 contentsId) external view returns (uint256);
    function approvalPermit(ApprovePermitVoucher calldata voucher) external;
    function approve(address to, uint256 tokenId) external;
    function setApprovalForAll(address operator, bool approved) external;
    function transferFrom(address from, address to, uint256 tokenId) external;

    // ERC721 functions
    function ownerOf(uint256 tokenId) external view returns (address owner);
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function exists(uint256 tokenId) external view returns (bool);
}
