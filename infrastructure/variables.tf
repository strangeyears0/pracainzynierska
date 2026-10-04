variable "aws_region" {
  description = "Region AWS dla infrastruktury"
  type        = string
  default     = "eu-central-1"
}

variable "cluster_name" {
  description = "Nazwa klastra Amazon EKS"
  type        = string
  default     = "eks-cluster-inzynierski"
}

variable "environment" {
  description = "Środowisko projektowe"
  type        = string
  default     = "Production"
}

variable "project_name" {
  description = "Nazwa projektu inżynierskiego"
  type        = string
  default     = "PracaInzynierska"
}
