#!/bin/bash

# Build contracts with Foundry
echo "Building contracts with Foundry..."

# Check if forge is installed
if ! command -v forge &> /dev/null; then
    echo "Error: Foundry is not installed."
    echo "Please install Foundry by running:"
    echo "  curl -L https://foundry.paradigm.xyz | bash"
    echo "  foundryup"
    exit 1
fi

# Load environment variables from parent directory
if [ -f ../.env ]; then
    echo "Loading environment variables..."
    # Source .env file properly handling quotes and special characters
    set -a
    source ../.env
    set +a
fi

# Generate foundry configuration
echo "Generating Foundry configuration from BLOCKCHAIN_CONFIG..."
(cd .. && NODE_OPTIONS="--no-warnings=ExperimentalWarning" npx tsx ./contracts/utils/generate-foundry-config.ts)

if [ $? -ne 0 ]; then
    echo "Failed to generate configuration."
    exit 1
fi

# Build contracts
forge build

# Check if build succeeded
if [ $? -eq 0 ]; then
    echo "Build successful."
else
    echo "Build failed."
    exit 1
fi