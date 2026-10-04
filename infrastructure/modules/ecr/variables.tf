variable "repository_names" {
  description = "Lista nazw repozytoriów Amazon ECR"
  type        = list(string)
  default     = ["reservation-service", "user-notification-service", "frontend"]
}

variable "environment" {
  description = "Nazwa środowiska"
  type        = string
  default     = "Production"
}

variable "project" {
  description = "Nazwa projektu"
  type        = string
  default     = "PracaInzynierska"
}
