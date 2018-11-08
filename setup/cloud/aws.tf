variable "region" {
  description = "AWS region to create node in"
  type = "string"
  default = "eu-west-1"
}

variable "network" {
  description = "Network name to run node on"
  default = "testnet-beta"
  type = "string"
}

variable "ssh_public_file" {
  description = "SSH public key file to be used to connect to the node"
  type = "string"
}

variable "ssh_private_file" {
  description = "SSH private key file to be used to connect to the node"
  type = "string"
}

data "template_file" "leap_systemd" {
  template = "${file("${path.module}/leap.systemd.service")}"

  vars {
    network = "${var.network}"
  }
}

provider "aws" {
  region = "${var.region}"
}


resource "aws_instance" "leap_node" {
  ami                    = "ami-58d7e821"
  availability_zone      = "eu-west-1c"
  instance_type          = "t2.micro"
  vpc_security_group_ids = ["${aws_security_group.leap_tendermint.id}", "${aws_security_group.leap_ssh.id}"]
  key_name               = "${aws_key_pair.leap_auth.id}"

  connection {
    user        = "ubuntu"
    private_key = "${file(var.ssh_private_file)}"
    timeout     = "600s"
  }

  provisioner "file" {
    content     = "${data.template_file.leap_systemd.rendered}"
    destination = "/tmp/leap.service"
  }

  provisioner "file" {
    source      = "setup/cloud/bootstrap.sh"
    destination = "/tmp/bootstrap.sh"
  }

  provisioner "file" {
    source      = "presets/leap-${var.network}.json"
    destination = "/home/ubuntu/leap-${var.network}.json"
  }

  provisioner "remote-exec" {
    inline = [
      "chmod +x /tmp/bootstrap.sh",
      "sudo /tmp/bootstrap.sh",
    ]
  }

  tags {
    Group = "leap_node"
    Name = "leap node - ${var.network}"
  }
}

resource "aws_key_pair" "leap_auth" {
  key_name   = "leap_auth"
  public_key = "${file(var.ssh_public_file)}"
}

resource "aws_eip_association" "eip_assoc" {
  instance_id   = "${aws_instance.leap_node.id}"
  allocation_id = "${aws_eip.leap_eip.id}"
}

resource "aws_eip" "leap_eip" {
  vpc = true

  tags {
    Group = "leap_node"
    Name = "Leap node IP"
  }
}

resource "aws_security_group" "leap_ssh" {
  name        = "leap_ssh"
  description = "Allows SSH connection to node instance"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "SSH"
  }

  tags {
    Group = "leap_node"
    Name = "Leap node SSH"
  }
}

resource "aws_security_group" "leap_tendermint" {
  name        = "leap_tendermint"
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
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "lotion"
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
    Group = "leap_node"
    Name = "Leap node security group"
  }
}

// The list of cluster instance IDs
output "instance" {
  value = ["${aws_instance.leap_node.id}"]
}

// The list of cluster instance public IPs
output "public_ip" {
  value = ["${aws_eip.leap_eip.public_ip}"]
}

terraform {
  backend "s3" {
    bucket = "leap-node-state"
    key    = "testnet"
    region = "eu-west-1"
  }
}