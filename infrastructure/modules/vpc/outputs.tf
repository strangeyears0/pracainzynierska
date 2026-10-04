output "vpc_id" {
  description = "Identyfikator sieci VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Lista identyfikatorów podsieci publicznych"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Lista identyfikatorów podsieci prywatnych"
  value       = aws_subnet.private[*].id
}
