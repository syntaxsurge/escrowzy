// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

// Auto-generated price constants
// Generated at: 2025-08-18T07:59:07.044Z
// USD Prices: Pro=$3, Enterprise=$5

library Prices {
    // Chain IDs
    uint256 public constant CHAIN_CORETESTNET = 1114;
    uint256 public constant CHAIN_COREMAINNET = 1116;

    // Get subscription prices for a specific chain
    function getPrices(uint256 chainId) internal pure returns (uint256 proPrice, uint256 enterprisePrice) {
        if (chainId == 1114) {
            // coreTestnet (tCORE)
            return (3847061358063953662, 6411768930106589437);
        }
        else if (chainId == 1116) {
            // coreMainnet (CORE)
            return (3847061358063953662, 6411768930106589437);
        }
        else {
            // Default fallback prices
            revert("Unsupported chain ID");
        }
    }
    
    // Get pro subscription price for a specific chain
    function getProPrice(uint256 chainId) internal pure returns (uint256) {
        (uint256 proPrice, ) = getPrices(chainId);
        return proPrice;
    }
    
    // Get enterprise subscription price for a specific chain
    function getEnterprisePrice(uint256 chainId) internal pure returns (uint256) {
        (, uint256 enterprisePrice) = getPrices(chainId);
        return enterprisePrice;
    }
    
    // Get native currency symbol for a specific chain
    function getNativeCurrencySymbol(uint256 chainId) internal pure returns (string memory) {
        if (chainId == 1114) {
            return "tCORE";
        }
        else if (chainId == 1116) {
            return "CORE";
        }
        else {
            return "NATIVE";
        }
    }
}
