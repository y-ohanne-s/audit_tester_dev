// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IJuglToken {
    // Events (if any specific events are emitted by MyToken)

    // Functions
    function pause() external;
    function unpause() external;
    function mint(address to, uint256 amount) external;

    // IERC20Permit's permit
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    // IERC20's transferFrom
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    function transfer(
        address to,
        uint256 value
    ) external returns (bool);

    // IERC20's nonces
    function nonces(address owner) external returns (uint256);

    function balanceOf(address account) external view returns (uint256);
}
