resource "aws_ecr_repository" "app_repos" {
  for_each             = toset(var.repository_names)
  name                 = each.value
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Environment = var.environment
    Project     = var.project
  }
}

# Polityka czyszczenia starych obrazów (przechowujemy max 5 najnowszych wersji z 14 dni)
resource "aws_ecr_lifecycle_policy" "app_repos_policy" {
  for_each   = aws_ecr_repository.app_repos
  repository = each.value.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Zachowaj tylko 5 najnowszych obrazów"
        selection = {
          tagStatus   = "any"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 14
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
