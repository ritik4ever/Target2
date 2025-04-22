// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./MonadArenaToken.sol";
import "./MonadArenaNFT.sol";

contract MonadArenaCore is Ownable, ReentrancyGuard {
    // Contract references
    MonadArenaToken public tokenContract;
    MonadArenaNFT public nftContract;

    // Game session tracking
    struct GameSession {
        bytes32 id;
        uint256 startTime;
        uint256 endTime;
        bool active;
        mapping(address => bool) participants;
    }

    // Player stats
    struct PlayerStats {
        uint256 gamesPlayed;
        uint256 wins;
        uint256 kills;
        uint256 deaths;
        uint256 totalScore;
        uint256 lastRewardTime;
    }

    // Mappings
    mapping(bytes32 => GameSession) public gameSessions;
    mapping(address => PlayerStats) public playerStats;
    mapping(address => bool) public authorizedServers;

    // Events
    event GameSessionCreated(bytes32 indexed gameId, uint256 startTime);
    event GameSessionEnded(bytes32 indexed gameId, uint256 endTime);
    event PlayerJoined(bytes32 indexed gameId, address indexed player);
    event RewardsClaimed(
        address indexed player,
        uint256 tokenAmount,
        uint256 score
    );
    event NFTRewarded(address indexed player, uint256 tokenId);

    // Modifiers
    modifier onlyAuthorizedServer() {
        require(authorizedServers[msg.sender], "Not authorized");
        _;
    }

    constructor(address _tokenContract, address _nftContract) {
        tokenContract = MonadArenaToken(_tokenContract);
        nftContract = MonadArenaNFT(_nftContract);
    }

    // Add authorized server
    function addAuthorizedServer(address server) external onlyOwner {
        authorizedServers[server] = true;
    }

    // Remove authorized server
    function removeAuthorizedServer(address server) external onlyOwner {
        authorizedServers[server] = false;
    }

    // Create a new game session
    function createGameSession(bytes32 gameId) external onlyAuthorizedServer {
        require(
            gameSessions[gameId].startTime == 0,
            "Game session already exists"
        );

        GameSession storage session = gameSessions[gameId];
        session.id = gameId;
        session.startTime = block.timestamp;
        session.active = true;

        emit GameSessionCreated(gameId, block.timestamp);
    }

    // End a game session
    function endGameSession(bytes32 gameId) external onlyAuthorizedServer {
        GameSession storage session = gameSessions[gameId];
        require(session.startTime > 0, "Game session does not exist");
        require(session.active, "Game session already ended");

        session.endTime = block.timestamp;
        session.active = false;

        emit GameSessionEnded(gameId, block.timestamp);
    }

    // Add player to game session
    function addPlayerToSession(
        bytes32 gameId,
        address player
    ) external onlyAuthorizedServer {
        GameSession storage session = gameSessions[gameId];
        require(session.startTime > 0, "Game session does not exist");
        require(session.active, "Game session already ended");

        session.participants[player] = true;

        // Update player stats
        playerStats[player].gamesPlayed++;

        emit PlayerJoined(gameId, player);
    }

    // Record game results
    function recordGameResults(
        bytes32 gameId,
        address player,
        bool won,
        uint256 kills,
        uint256 deaths,
        uint256 score
    ) external onlyAuthorizedServer {
        GameSession storage session = gameSessions[gameId];
        require(session.startTime > 0, "Game session does not exist");
        require(session.participants[player], "Player not in session");

        // Update player stats
        PlayerStats storage stats = playerStats[player];
        if (won) stats.wins++;
        stats.kills += kills;
        stats.deaths += deaths;
        stats.totalScore += score;

        // Check if player should receive NFT reward
        if (shouldRewardNFT(stats)) {
            rewardNFT(player, stats);
        }
    }

    // Claim rewards
    function claimRewards(bytes32 gameId, uint256 score) external nonReentrant {
        GameSession storage session = gameSessions[gameId];
        require(session.startTime > 0, "Game session does not exist");
        require(session.participants[msg.sender], "Player not in session");

        // Calculate rewards
        uint256 tokenReward = calculateRewards(score);

        // Update last reward time
        playerStats[msg.sender].lastRewardTime = block.timestamp;

        // Mint tokens to player
        tokenContract.mint(msg.sender, tokenReward);

        emit RewardsClaimed(msg.sender, tokenReward, score);
    }

    // Calculate rewards based on score
    function calculateRewards(uint256 score) public pure returns (uint256) {
        // Base reward: 1 token
        uint256 baseReward = 1 * 10 ** 18;

        // Additional reward based on score
        uint256 scoreReward = (score * 10 ** 18) / 100; // 0.01 tokens per score point

        return baseReward + scoreReward;
    }

    // Check if player should receive NFT reward
    function shouldRewardNFT(
        PlayerStats memory stats
    ) internal pure returns (bool) {
        // Reward NFT for every 10 wins
        if (stats.wins > 0 && stats.wins % 10 == 0) {
            return true;
        }

        // Reward NFT for high scores
        if (stats.totalScore >= 1000 && stats.totalScore % 1000 < 100) {
            return true;
        }

        return false;
    }

    // Reward player with NFT
    function rewardNFT(address player, PlayerStats memory stats) internal {
        // Generate weapon stats based on player performance
        uint8 damage = uint8(50 + (stats.kills * 5) / stats.gamesPlayed);
        if (damage > 100) damage = 100;

        uint8 fireRate = uint8(50 + ((stats.totalScore / 1000) % 50));
        if (fireRate > 100) fireRate = 100;

        uint8 accuracy = uint8(50 + (stats.wins * 10) / stats.gamesPlayed);
        if (accuracy > 100) accuracy = 100;

        uint8 range = uint8(50 + (block.timestamp % 50));
        if (range > 100) range = 100;

        // Determine weapon type
        string memory weaponType;
        if (damage > 80) {
            weaponType = "Sniper";
        } else if (fireRate > 80) {
            weaponType = "Assault";
        } else if (accuracy > 80) {
            weaponType = "Precision";
        } else if (range > 80) {
            weaponType = "Shotgun";
        } else {
            weaponType = "Pistol";
        }

        // Generate token URI
        string memory tokenURI = string(
            abi.encodePacked(
                "https://api.monadarena.com/metadata/weapon/",
                weaponType,
                "/",
                uint2str(block.timestamp)
            )
        );

        // Mint NFT
        uint256 tokenId = nftContract.mintWeapon(
            player,
            tokenURI,
            damage,
            fireRate,
            accuracy,
            range,
            weaponType
        );

        emit NFTRewarded(player, tokenId);
    }

    // Helper function to convert uint to string
    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - (_i / 10) * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }

    // Check if game exists
    function gameExists(bytes32 gameId) external view returns (bool) {
        return gameSessions[gameId].startTime > 0;
    }

    // Check if player participated in game
    function playerParticipated(
        bytes32 gameId,
        address player
    ) external view returns (bool) {
        return gameSessions[gameId].participants[player];
    }

    // Get player stats
    function getPlayerStats(
        address player
    )
        external
        view
        returns (
            uint256 gamesPlayed,
            uint256 wins,
            uint256 kills,
            uint256 deaths,
            uint256 totalScore
        )
    {
        PlayerStats memory stats = playerStats[player];
        return (
            stats.gamesPlayed,
            stats.wins,
            stats.kills,
            stats.deaths,
            stats.totalScore
        );
    }

    // Get score leaderboard (top 10)
    function getScoreLeaderboard()
        external
        view
        returns (address[] memory, uint256[] memory)
    {
        // This is a simplified implementation
        // In a real contract, you would use a more efficient approach
        address[] memory players = new address[](10);
        uint256[] memory scores = new uint256[](10);

        // Placeholder implementation
        return (players, scores);
    }

    // Get kills leaderboard (top 10)
    function getKillsLeaderboard()
        external
        view
        returns (address[] memory, uint256[] memory)
    {
        // Placeholder implementation
        address[] memory players = new address[](10);
        uint256[] memory kills = new uint256[](10);

        return (players, kills);
    }

    // Get wins leaderboard (top 10)
    function getWinsLeaderboard()
        external
        view
        returns (address[] memory, uint256[] memory)
    {
        // Placeholder implementation
        address[] memory players = new address[](10);
        uint256[] memory wins = new uint256[](10);

        return (players, wins);
    }
}
