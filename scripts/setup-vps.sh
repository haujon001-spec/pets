#!/bin/bash

###############################################################################
# VPS Setup Instructions - Run these on your VPS server
###############################################################################

# Step 1: SSH into your VPS (you'll need to use password this first time)
# Replace YOUR_VPS_IP with actual IP address
# ssh root@YOUR_VPS_IP

# Step 2: Create deploy user
echo "Creating deploy user..."
useradd -m -s /bin/bash deploy
usermod -aG sudo deploy

# Step 3: Setup SSH directory for deploy user
echo "Setting up SSH for deploy user..."
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh

# Step 4: Add your SSH public key (copy from Windows)
# Replace the key below with your actual SSH public key
cat > /home/deploy/.ssh/authorized_keys << 'EOF'
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIL2Wpud9cVc3vksgsJdwifmEBM3iqhjCRj079dryMEGt haujon001@gmail.com
EOF

# Step 5: Set correct permissions
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh

# Step 6: Allow deploy user sudo without password (for Docker commands)
echo "deploy ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers.d/deploy

# Step 7: Install Docker (if not already installed)
echo "Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker deploy

# Step 8: Install Docker Compose
echo "Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Step 9: Create deployment directory
echo "Creating deployment directory..."
mkdir -p /var/www/aibreeds
chown -R deploy:deploy /var/www/aibreeds

# Step 10: Configure firewall
echo "Configuring firewall..."
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw --force enable

echo ""
echo "✅ VPS setup complete!"
echo ""
echo "Test SSH connection from Windows:"
echo "  ssh deploy@aibreeds-demo.com"
echo ""
