#!/bin/bash

################################################################################
# VPS Quick Fix - Run these commands on your VPS
################################################################################

echo "🔧 Fixing VPS setup issues..."

# Fix 1: Create /var/www directory
echo "Creating /var/www directory..."
sudo mkdir -p /var/www

# Fix 2: Remove conflicting Docker packages
echo "Removing conflicting packages..."
sudo apt remove -y containerd containerd.io docker docker-engine docker.io 2>/dev/null || true

# Fix 3: Clean up apt
echo "Cleaning apt cache..."
sudo apt clean
sudo apt autoremove -y

# Fix 4: Install Docker the official way
echo "Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Fix 5: Install Docker Compose
echo "Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Fix 6: Install Git
echo "Installing Git..."
sudo apt install -y git

# Verify installations
echo ""
echo "✅ Verification:"
docker --version
docker-compose --version
git --version

echo ""
echo "✅ Setup complete! Now run:"
echo "cd /var/www && git clone https://github.com/haujon001-spec/pets.git aibreeds && cd aibreeds"
