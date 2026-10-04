output "ecr_repository_urls" {
  description = "Adresy URL prywatnych rejestrów Amazon ECR"
  value       = module.ecr.repository_urls
}

output "vpc_id" {
  description = "Identyfikator utworzonej sieci VPC"
  value       = module.vpc.vpc_id
}

output "public_subnets" {
  description = "Podsieci publiczne z tagami kubernetes.io/role/elb"
  value       = module.vpc.public_subnet_ids
}

output "private_subnets" {
  description = "Podsieci prywatne z tagami kubernetes.io/role/internal-elb"
  value       = module.vpc.private_subnet_ids
}

output "eks_cluster_name" {
  description = "Nazwa klastra EKS"
  value       = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  description = "Adres API klastra EKS"
  value       = module.eks.cluster_endpoint
}
