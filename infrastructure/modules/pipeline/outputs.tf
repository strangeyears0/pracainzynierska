output "codebuild_project_name" {
  description = "Nazwa projektu AWS CodeBuild"
  value       = aws_codebuild_project.app_build.name
}

output "artifacts_bucket_name" {
  description = "Nazwa zasobnika S3 dla artefaktów potoku CI/CD"
  value       = aws_s3_bucket.pipeline_artifacts.id
}
