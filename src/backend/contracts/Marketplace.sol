//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Marketplace is ReentrancyGuard {

    address payable public immutable feeAccount;
    uint public immutable feePercent;
    uint public itemCount;
    
    struct Item{
        uint itemId;
        IERC721 nft;
        uint tokenId;
        uint price;
        address payable seller;
        bool sold;
    }
    
    event Offered (
        uint itemId,
        address indexed nft,
        uint tokenId,
        uint price,
        address indexed seller
    );
    // Item Id -> item
    mapping(uint => Item) public items;

    constructor(uint _feePercent) {
        feeAccount = payable(msg.sender);
        feePercent = _feePercent;
    }
    function makeItem(IERC721 _nft, uint _tokenId, uint price) external nonReentrant {
        require(price > 0, "Price must be greater than zero");

        itemCount ++ ;
         // transfer nft
        _nft.transferFrom(msg.sender, address(this), _tokenId); 

        items[itemCount] = Item (
            itemCount,
            _nft,
            _tokenId,
            price,
            payable(msg.sender),
            false
        );
        // emit offered event
        emit Offered (
            itemCount,
            address(_nft),
            _tokenId,
            price,
            msg.sender
        );
    }
}