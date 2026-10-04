variable "cluster_name" {
  description = "Nazwa klastra Amazon EKS"
  type        = string
  default     = "eks-cluster-inzynierski"
}

variable "codebuild_role_arn" {
  description = "ARN roli IAM dla AWS CodeBuild"
  type        = string
}

variable "github_repo_owner" {
  description = "Właściciel repozytorium GitHub"
  type        = string
  default     = "strangeyears0"
}

variable "github_repo_name" {
  description = "Nazwa repozytorium GitHub"
  type        = string
  default     = "pracainzynierska"
}

variable "github_branch" {
  description = "Gałąź Git wyzwalająca potok"
  type        = string
  default     = "main"
}
