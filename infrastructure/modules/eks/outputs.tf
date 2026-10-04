output "cluster_name" {
  description = "Nazwa klastra EKS"
  value       = aws_eks_cluster.main.name
}

output "cluster_endpoint" {
  description = "Adres punktu końcowego API klastra EKS"
  value       = aws_eks_cluster.main.endpoint
}

output "cluster_certificate_authority_data" {
  description = "Dane certyfikatu CA klastra EKS"
  value       = aws_eks_cluster.main.certificate_authority[0].data
}
