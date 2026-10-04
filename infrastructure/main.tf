terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Moduł 1: Rejestr Obrazów Amazon ECR (Prywatne repozytoria dla 3 mikrousług)
module "ecr" {
  source           = "./modules/ecr"
  repository_names = ["reservation-service", "user-notification-service", "frontend"]
  environment      = var.environment
  project          = var.project_name
}

# Moduł 2: Sieć VPC z tagowaniem podsieci dla Load Balancerów Kubernetes (ELB / Internal-ELB)
module "vpc" {
  source               = "./modules/vpc"
  cluster_name         = var.cluster_name
  vpc_cidr             = "10.0.0.0/16"
  availability_zones   = ["${var.aws_region}a", "${var.aws_region}b"]
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]
}

# Moduł 3: Róle i Polityki IAM (ECR ReadOnly dla Nodes, ECR Push dla CodeBuild, IRSA EBS CSI)
module "iam" {
  source       = "./modules/iam"
  cluster_name = var.cluster_name
}

# Moduł 4: Orkiestrator Amazon EKS i Grupa Węzłów Roboczych
module "eks" {
  source           = "./modules/eks"
  cluster_name     = var.cluster_name
  subnet_ids       = module.vpc.private_subnet_ids
  node_role_arn    = module.iam.node_group_role_arn
  desired_capacity = 2
  min_size         = 1
  max_size         = 4
  instance_types   = ["t3.medium"]
}
