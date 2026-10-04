variable "vpc_cidr" {
  description = "Blok CIDR dla sieci VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "cluster_name" {
  description = "Nazwa klastra Amazon EKS"
  type        = string
  default     = "eks-cluster-inzynierski"
}

variable "availability_zones" {
  description = "Strefy dostępności AWS"
  type        = list(string)
  default     = ["eu-central-1a", "eu-central-1b"]
}

variable "public_subnet_cidrs" {
  description = "Bloki CIDR dla podsieci publicznych"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "Bloki CIDR dla podsieci prywatnych"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}
