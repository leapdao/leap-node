variable "region" {
  description = "AWS region to create node in"
  type = "string"
  default = "eu-west-1"
}

variable "network" {
  description = "Network config to run node for (see presets folder)"
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

variable "count" {
  description = "Number of leap nodes to deploy"
  default = 4
}

variable "leap_node_version" {
  description = "Version of leap-node package to install on the nodes"
  default = "latest"
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
  count			             = "${var.count}"
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
    destination = "/tmp/leap-node.service"
  }

  provisioner "file" {
    source      = "setup/cloud/bootstrap.sh"
    destination = "/tmp/bootstrap.sh"
  }

  provisioner "file" {
    source      = "presets/${var.network}.json"
    destination = "/home/ubuntu/${var.network}.json"
  }

  provisioner "remote-exec" {
    inline = [
      "chmod +x /tmp/bootstrap.sh",
      "sudo /tmp/bootstrap.sh ${var.leap_node_version}",
    ]
  }

  tags {
    Group = "leap_node"
    Name = "${format("node-%01d",count.index+1)} - ${var.network}"
  }
}

resource "null_resource" "update_leap_node" {
  count			             = "${var.count}"

  triggers {
    leap_node_version    = "${var.leap_node_version}"
  }

  connection {
    user                 = "ubuntu"
    private_key          = "${file(var.ssh_private_file)}"
    timeout              = "600s"
    host                 = "${element(aws_instance.leap_node.*.public_ip, count.index)}"
  }

  provisioner "remote-exec" {
    inline = [
      "sudo yarn global add leap-node@${var.leap_node_version}",
      "sudo service leap-node restart"
    ]
  }
}

resource "null_resource" "update_network_config" {
  count			             = "${var.count}"

  triggers {
    network_config    = "${file("${path.module}/../../presets/${var.network}.json")}"
  }

  connection {
    user                 = "ubuntu"
    private_key          = "${file(var.ssh_private_file)}"
    timeout              = "600s"
    host                 = "${element(aws_instance.leap_node.*.public_ip, count.index)}"
  }

  provisioner "file" {
    source      = "presets/${var.network}.json"
    destination = "/home/ubuntu/${var.network}.json"
  }

  provisioner "remote-exec" {
    inline = [
      "sudo service leap-node restart"
    ]
  }
}

resource "aws_key_pair" "leap_auth" {
  key_name   = "leap_auth"
  public_key = "${file(var.ssh_public_file)}"
}

resource "aws_eip_association" "eip_assoc" {
  count		= "${var.count}"
  instance_id   = "${element(aws_instance.leap_node.*.id, count.index)}"
  allocation_id = "${element(aws_eip.leap_eip.*.id, count.index)}"
}

resource "aws_eip" "leap_eip" {
  count		= "${var.count}"
  vpc = true

  tags {
    Group = "leap_node"
    Name = "${format("Leap node %01d",count.index + 1)} IP"
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
  value = ["${aws_instance.leap_node.*.id}"]
}

// The list of cluster instance public IPs
output "public_ip" {
  value = ["${aws_eip.leap_eip.*.public_ip}"]
}

terraform {
  backend "s3" {
    bucket = "leap-node-state"
    key    = "testnet"
    region = "eu-west-1"
  }
}