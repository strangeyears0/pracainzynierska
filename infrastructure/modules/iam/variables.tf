variable "cluster_name" {
  description = "Nazwa klastra Amazon EKS"
  type        = string
  default     = "eks-cluster-inzynierski"
}

variable "oidc_provider_arn" {
  description = "ARN dostawcy OIDC klastra EKS (wymagany do IRSA)"
  type        = string
  default     = ""
}

variable "oidc_provider_url" {
  description = "URL dostawcy OIDC klastra EKS"
  type        = string
  default     = ""
}
