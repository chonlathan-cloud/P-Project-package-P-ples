variable "project_id" {
  description = "Shared GCP project selected in ADR 0002."
  type        = string
  default     = "the49-487609"
}

variable "region" {
  description = "DD Box regional resource location."
  type        = string
  default     = "asia-southeast1"
}
