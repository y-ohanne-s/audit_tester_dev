// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IYamanekoSBT {

    // Events
    event SBTMintEvent(address indexed recipient, uint256 tokenId, uint256 contentsId, address operator);
    event SetSwitchURIEvent(uint256 indexed switchURI);
    event SetTokenURIEvent(address indexed tokenuri);
    event SetFixMetadataEvent(string fixMetadata);
    event SetBaseURIEvent(string baseURI);
    event SetBaseExtensionEvent(string baseExtension);

    // Functions
    function initialize() external;
    function mint(address to, uint256 contentsId) external;
    function setSwitchURI(uint256 _switchURI) external;
    function setTokenURI(address _tokenuri) external;
    function setFixMetadata(string calldata _data) external;
    function setBaseURI(string calldata _data) external;
    function setBaseExtension(string calldata _data) external;
    function setTokenBattleNFT(uint256 tokenId, uint256 battleNFTId) external;
    function getBattleNFT(uint256 tokenId) external view returns (uint256);
    function getTokenId(uint256 contentsId, address owner) external view returns (uint256);
    function getContentsId(uint256 tokenId) external view returns (uint256);
    function approve(address to, uint256 tokenId) external;
    function setApprovalForAll(address operator, bool _approved) external;
    function tokenURI(uint256 tokenId) external view returns (string memory);
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}
