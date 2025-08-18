// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract ReputationRegistry is ERC721URIStorage, Ownable {
    // Custom errors for better gas efficiency and debugging
    error InvalidRating(uint256 received, uint256 minExpected, uint256 maxExpected);
    error SelfEndorsement(address attemptedEndorser, address targetUser);
    error InvalidAddress(address provided);
    error InsufficientReviews(uint256 current, uint256 required);
    error ScoreTooLow(uint256 current, uint256 required);
    error AlreadyHasNFT(address user, uint256 existingTokenId);
    error NoReviewsFound(address user);
    error InvalidSkillName();
    error DecayPeriodNotElapsed(uint256 currentTime, uint256 nextDecayTime);
    
    uint256 private _tokenIdCounter;
    
    struct ReputationScore {
        uint256 totalScore;
        uint256 reviewCount;
        uint256 lastUpdateTime;
        mapping(address => uint256) endorsements;
        uint256 endorsementCount;
    }
    
    struct SkillEndorsement {
        string skillName;
        address endorser;
        uint256 rating;
        uint256 timestamp;
    }
    
    struct TrustScore {
        uint256 score;
        uint256 level;
        uint256 decayRate;
        uint256 lastCalculation;
    }
    
    mapping(address => ReputationScore) public reputationScores;
    mapping(address => TrustScore) public trustScores;
    mapping(address => SkillEndorsement[]) public skillEndorsements;
    mapping(address => uint256) public reputationTokens;
    
    uint256 public constant MAX_TRUST_SCORE = 1000;
    uint256 public constant DECAY_PERIOD = 30 days;
    uint256 public constant DECAY_RATE = 5; // 5% decay per period
    uint256 public constant MIN_REVIEWS_FOR_NFT = 10;
    uint256 public constant MIN_SCORE_FOR_NFT = 800; // Out of 1000
    
    event ReputationUpdated(address indexed user, uint256 newScore, uint256 reviewCount);
    event SkillEndorsed(address indexed user, address indexed endorser, string skill, uint256 rating);
    event TrustScoreUpdated(address indexed user, uint256 newScore, uint256 level);
    event ReputationNFTMinted(address indexed user, uint256 tokenId);
    event ReputationDecayed(address indexed user, uint256 oldScore, uint256 newScore);
    
    constructor() ERC721("Reputation NFT", "REP") Ownable(msg.sender) {}
    
    function updateReputation(
        address user,
        uint256 rating,
        bool isFreelancer
    ) external onlyOwner {
        if (rating < 1 || rating > 5) {
            revert InvalidRating(rating, 1, 5);
        }
        
        if (user == address(0)) {
            revert InvalidAddress(user);
        }
        
        ReputationScore storage userRep = reputationScores[user];
        
        // Apply different weighting based on user type
        // Freelancers get a slight boost to help build reputation
        uint256 weightedScore = isFreelancer 
            ? rating * 210  // 5% boost for freelancers (scale to 0-1050)
            : rating * 200; // Normal scale to 0-1000
        userRep.totalScore += weightedScore;
        userRep.reviewCount++;
        userRep.lastUpdateTime = block.timestamp;
        
        // Adjust average score back to 0-1000 scale
        uint256 averageScore = userRep.totalScore / userRep.reviewCount;
        if (isFreelancer && averageScore > 1000) {
            averageScore = 1000; // Cap at max score
        }
        
        _updateTrustScore(user, averageScore);
        
        emit ReputationUpdated(user, averageScore, userRep.reviewCount);
        
        // Check if eligible for NFT
        if (
            userRep.reviewCount >= MIN_REVIEWS_FOR_NFT &&
            averageScore >= MIN_SCORE_FOR_NFT &&
            reputationTokens[user] == 0
        ) {
            _mintReputationNft(user);
        }
    }
    
    function endorseSkill(
        address user,
        string memory skillName,
        uint256 rating
    ) external {
        if (msg.sender == user) {
            revert SelfEndorsement(msg.sender, user);
        }
        
        if (rating < 1 || rating > 5) {
            revert InvalidRating(rating, 1, 5);
        }
        
        if (user == address(0)) {
            revert InvalidAddress(user);
        }
        
        if (bytes(skillName).length == 0) {
            revert InvalidSkillName();
        }
        
        SkillEndorsement memory endorsement = SkillEndorsement({
            skillName: skillName,
            endorser: msg.sender,
            rating: rating,
            timestamp: block.timestamp
        });
        
        skillEndorsements[user].push(endorsement);
        
        ReputationScore storage userRep = reputationScores[user];
        userRep.endorsements[msg.sender] = rating;
        userRep.endorsementCount++;
        
        emit SkillEndorsed(user, msg.sender, skillName, rating);
    }
    
    function _updateTrustScore(address user, uint256 averageScore) private {
        TrustScore storage trust = trustScores[user];
        
        // Apply decay if necessary
        if (block.timestamp > trust.lastCalculation + DECAY_PERIOD) {
            uint256 periodsElapsed = (block.timestamp - trust.lastCalculation) / DECAY_PERIOD;
            uint256 decayAmount = (trust.score * DECAY_RATE * periodsElapsed) / 100;
            
            uint256 oldScore = trust.score;
            trust.score = trust.score > decayAmount ? trust.score - decayAmount : 0;
            
            emit ReputationDecayed(user, oldScore, trust.score);
        }
        
        // Update with new score
        trust.score = (trust.score + averageScore) / 2;
        if (trust.score > MAX_TRUST_SCORE) {
            trust.score = MAX_TRUST_SCORE;
        }
        
        // Calculate level (1-10)
        trust.level = (trust.score / 100) + 1;
        if (trust.level > 10) trust.level = 10;
        
        trust.lastCalculation = block.timestamp;
        
        emit TrustScoreUpdated(user, trust.score, trust.level);
    }
    
    function _mintReputationNft(address user) private {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(user, tokenId);
        _setTokenURI(tokenId, _generateTokenUri(user));
        
        reputationTokens[user] = tokenId;
        
        emit ReputationNFTMinted(user, tokenId);
    }
    
    function _generateTokenUri(address user) private view returns (string memory) {
        ReputationScore storage userRep = reputationScores[user];
        uint256 averageScore = userRep.totalScore / userRep.reviewCount;
        
        // In production, this would generate proper metadata JSON
        return string(
            abi.encodePacked(
                "ipfs://reputation/",
                addressToString(user),
                "/",
                uint256ToString(averageScore)
            )
        );
    }
    
    function getReputationScore(address user) external view returns (
        uint256 averageScore,
        uint256 reviewCount,
        uint256 endorsementCount
    ) {
        ReputationScore storage userRep = reputationScores[user];
        averageScore = userRep.reviewCount > 0 ? userRep.totalScore / userRep.reviewCount : 0;
        reviewCount = userRep.reviewCount;
        endorsementCount = userRep.endorsementCount;
    }
    
    function getTrustScore(address user) external view returns (
        uint256 score,
        uint256 level
    ) {
        TrustScore storage trust = trustScores[user];
        
        // Apply decay for view
        uint256 currentScore = trust.score;
        if (block.timestamp > trust.lastCalculation + DECAY_PERIOD) {
            uint256 periodsElapsed = (block.timestamp - trust.lastCalculation) / DECAY_PERIOD;
            uint256 decayAmount = (currentScore * DECAY_RATE * periodsElapsed) / 100;
            currentScore = currentScore > decayAmount ? currentScore - decayAmount : 0;
        }
        
        score = currentScore;
        level = (currentScore / 100) + 1;
        if (level > 10) level = 10;
    }
    
    function getSkillEndorsements(address user) external view returns (
        SkillEndorsement[] memory
    ) {
        return skillEndorsements[user];
    }
    
    function hasReputationNft(address user) external view returns (bool) {
        return reputationTokens[user] > 0;
    }
    
    function addressToString(address _addr) private pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        for (uint256 i = 0; i < 20; i++) {
            str[2+i*2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3+i*2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }
    
    function uint256ToString(uint256 value) private pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}