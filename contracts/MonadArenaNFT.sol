// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract MonadArenaNFT is ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;

    // Token ID counter
    Counters.Counter private _tokenIdCounter;

    // Game core contract address
    address public gameCoreContract;

    // Weapon stats
    struct WeaponStats {
        uint8 damage;
        uint8 fireRate;
        uint8 accuracy;
        uint8 range;
        string weaponType;
    }

    // Mapping from token ID to weapon stats
    mapping(uint256 => WeaponStats) private _weaponStats;

    // Mapping from token ID to token URI
    mapping(uint256 => string) private _tokenURIs;

    // Events
    event WeaponMinted(
        uint256 indexed tokenId,
        address indexed owner,
        string weaponType
    );
    event GameCoreContractUpdated(address indexed newContract);

    constructor() ERC721("Monad Arena Weapon", "MAW") {}

    // Set game core contract
    function setGameCoreContract(address _gameCoreContract) external onlyOwner {
        gameCoreContract = _gameCoreContract;
        emit GameCoreContractUpdated(_gameCoreContract);
    }

    // Mint weapon NFT
    function mintWeapon(
        address to,
        string memory tokenURI,
        uint8 damage,
        uint8 fireRate,
        uint8 accuracy,
        uint8 range,
        string memory weaponType
    ) external returns (uint256) {
        require(
            msg.sender == owner() || msg.sender == gameCoreContract,
            "Only owner or game core can mint"
        );

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);

        _weaponStats[tokenId] = WeaponStats({
            damage: damage,
            fireRate: fireRate,
            accuracy: accuracy,
            range: range,
            weaponType: weaponType
        });

        emit WeaponMinted(tokenId, to, weaponType);

        return tokenId;
    }

    // Get weapon stats
    function getWeaponStats(
        uint256 tokenId
    )
        external
        view
        returns (
            uint8 damage,
            uint8 fireRate,
            uint8 accuracy,
            uint8 range,
            string memory weaponType
        )
    {
        require(_exists(tokenId), "Weapon does not exist");

        WeaponStats memory stats = _weaponStats[tokenId];
        return (
            stats.damage,
            stats.fireRate,
            stats.accuracy,
            stats.range,
            stats.weaponType
        );
    }

    // Set token URI
    function _setTokenURI(uint256 tokenId, string memory tokenURI) internal {
        require(_exists(tokenId), "URI set for nonexistent token");
        _tokenURIs[tokenId] = tokenURI;
    }

    // Get token URI
    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        require(_exists(tokenId), "URI query for nonexistent token");
        return _tokenURIs[tokenId];
    }

    // Check if token exists
    function exists(uint256 tokenId) external view returns (bool) {
        return _exists(tokenId);
    }
}
