terraform init setup/cloud
terraform apply -var ssh_public_file="~/.ssh/leap-testnet.pub" -var ssh_private_file="~/.ssh/leap-testnet" -var network="testnet-gamma" -var count=$1 setup/cloud
