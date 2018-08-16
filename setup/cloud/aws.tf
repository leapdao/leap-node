variable "SSH_KEY_FILE" {
  description = "SSH public key file to be used on the nodes"
  type = "string"
}

provider "aws" {
  region = "eu-west-1"
}

resource "aws_instance" "parsec_node" {
  ami                    = "ami-58d7e821"
  availability_zone      = "eu-west-1c"
  instance_type          = "t2.micro"
  vpc_security_group_ids = ["${aws_security_group.parsec_tendermint.id}", "${aws_security_group.parsec_ssh.id}"]
  key_name               = "${aws_key_pair.parsec_auth.id}"

  provisioner "file" {
    source      = "setup/cloud/parsec.systemd.service"
    destination = "/home/ubuntu/parsec.service"

    connection {
      type     = "ssh"
      user     = "ubuntu"
    }
  }

  provisioner "remote-exec" {
    inline = [
      "sudo /bin/dd if=/dev/zero of=/var/swap.1 bs=1M count=1024",
      "sudo /sbin/mkswap /var/swap.1",
      "sudo chmod 600 /var/swap.1",
      "sudo /sbin/swapon /var/swap.1",
      "curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -",
      "echo 'deb https://dl.yarnpkg.com/debian/ stable main' | sudo tee /etc/apt/sources.list.d/yarn.list",
      "sudo apt-get update",
      "sudo apt-get -y install build-essential",
      "curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -",
      "sudo apt-get install -y nodejs",
      "sudo apt-get -y install yarn",
      "sudo yarn global add parsec-node",
      "curl https://raw.githubusercontent.com/parsec-labs/parsec-node/master/presets/parsec-rainbow.json -o parsec-rainbow.json",
      "sudo mv /home/ubuntu/parsec.service /etc/systemd/system/",
      "sudo service parsec start"
    ]

    connection {
      type     = "ssh"
      user     = "ubuntu"
    }
  }

  tags {
    Group = "parsec_node"
    Name = "PARSEC node"
  }
}

resource "aws_key_pair" "parsec_auth" {
  key_name   = "parsec_auth"
  public_key = "${file(var.SSH_KEY_FILE)}"
}

resource "aws_eip_association" "eip_assoc" {
  instance_id   = "${aws_instance.parsec_node.id}"
  allocation_id = "${aws_eip.parsec_eip.id}"
}

resource "aws_eip" "parsec_eip" {
  vpc = true

  tags {
    Group = "parsec_node"
    Name = "PARSEC node IP"
  }
}

resource "aws_security_group" "parsec_ssh" {
  name        = "parsec_ssh"
  description = "Allows SSH connection to node instance"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "SSH"
  }

  tags {
    Group = "parsec_node"
    Name = "PARSEC node SSH"
  }
}

resource "aws_security_group" "parsec_tendermint" {
  name        = "parsec_tendermint"
  description = "Allows tendermint and JSON RPC connections"

  ingress {
    from_port   = 46691
    to_port     = 46691
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "P2P"
  }

  ingress {
    from_port   = 41797
    to_port     = 41797
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "tendermint RPC"
  }

  ingress {
    from_port   = 26659
    to_port     = 26659
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "tendermint"
  }

  ingress {
    from_port   = 8645
    to_port     = 8645
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "JSON RPC over HTTP"
  }

  ingress {
    from_port   = 8646
    to_port     = 8646
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "JSON RPC over WebSockets"
  }

  egress {
    from_port = 0
    to_port = 0
    protocol = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags {
    Group = "parsec_node"
    Name = "PARSEC node security group"
  }
}

terraform {
  backend "s3" {
    bucket = "parsec-node-state"
    key    = "rainbow"
    region = "eu-west-1"
  }
}