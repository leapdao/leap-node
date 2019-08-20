#!/bin/bash
# Script to initialize a node settings on a server

# add swap (for micro instances)
sudo /bin/dd if=/dev/zero of=/var/swap.1 bs=1M count=1024
sudo /sbin/mkswap /var/swap.1
sudo chmod 600 /var/swap.1
sudo /sbin/swapon /var/swap.1
echo '/var/swap.1 swap swap defaults 0 0' | sudo tee --append /etc/fstab

# install node.js and yarn
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo 'deb https://dl.yarnpkg.com/debian/ stable main' | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt-get update
sudo apt-get -y install build-essential
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo apt-get -y install yarn

# Install Leap node
echo "Installing leap-node version: $1"
sudo yarn global add leap-node@$1

# Setup system.d config
sudo mv /tmp/leap-node.service /etc/systemd/system/

# Start the node
sudo service leap-node start