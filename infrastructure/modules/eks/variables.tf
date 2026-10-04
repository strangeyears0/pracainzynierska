variable "cluster_name" {
  description = "Nazwa klastra Amazon EKS"
  type        = string
  default     = "eks-cluster-inzynierski"
}

variable "subnet_ids" {
  description = "Lista identyfikatorów podsieci dla klastra EKS"
  type        = list(string)
}

variable "node_role_arn" {
  description = "ARN roli IAM dla węzłów roboczych"
  type        = string
}

variable "desired_capacity" {
  description = "Początkowa liczba węzłów roboczych"
  type        = number
  default     = 2
}

variable "min_size" {
  description = "Minimalna liczba węzłów roboczych"
  type        = number
  default     = 1
}

variable "max_size" {
  description = "Maksymalna liczba węzłów roboczych"
  type        = number
  default     = 4
}

variable "instance_types" {
  description = "Typy instancji EC2 dla węzłów roboczych"
  type        = list(string)
  default     = ["t3.medium"]
}
