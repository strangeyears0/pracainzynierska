output "node_group_role_arn" {
  description = "ARN roli IAM dla węzłów roboczych EKS"
  value       = aws_iam_role.eks_nodes.arn
}

output "codebuild_role_arn" {
  description = "ARN roli IAM dla potoku CI/CD CodeBuild"
  value       = aws_iam_role.codebuild_role.arn
}

output "ebs_csi_driver_role_arn" {
  description = "ARN roli IAM dla sterownika EBS CSI Driver"
  value       = length(aws_iam_role.ebs_csi_driver) > 0 ? aws_iam_role.ebs_csi_driver[0].arn : ""
}
