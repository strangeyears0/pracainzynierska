output "repository_urls" {
  description = "Mapa adresów URL repozytoriów ECR"
  value       = { for k, v in aws_ecr_repository.app_repos : k => v.repository_url }
}

output "repository_arns" {
  description = "Mapa ARN repozytoriów ECR"
  value       = { for k, v in aws_ecr_repository.app_repos : k => v.arn }
}
