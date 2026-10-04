# S3 Bucket na artefakty potoku CI/CD
resource "aws_s3_bucket" "pipeline_artifacts" {
  bucket        = "${var.cluster_name}-pipeline-artifacts"
  force_destroy = true
}

# Projekt AWS CodeBuild
resource "aws_codebuild_project" "app_build" {
  name          = "${var.cluster_name}-build"
  description   = "Proces automatycznego budowania obrazów Docker i wdrożenia na klastrze EKS"
  service_role  = var.codebuild_role_arn
  build_timeout = "20"

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "aws/codebuild/amazonlinux2-x86_64-standard:5.0"
    type                        = "LINUX_CONTAINER"
    privileged_mode             = true # Wymagane do uruchamiania demona Docker w kontenerze budującym

    environment_variable {
      name  = "AWS_DEFAULT_REGION"
      value = "eu-central-1"
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = "pipeline/buildspec.yml"
  }
}
