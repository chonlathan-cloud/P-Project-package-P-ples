variable "project_id" {
  description = "Shared GCP project selected in ADR 0002."
  type        = string
  default     = "the49-487609"
}

variable "region" {
  description = "Region shared by Cloud Run, Firestore, Storage, and Artifact Registry."
  type        = string
  default     = "asia-southeast1"
}

variable "media_cors_origins" {
  description = "Exact HTTPS web origins allowed to PUT through signed media upload URLs."
  type        = map(list(string))
  default = {
    test = []
    prod = []
  }

  validation {
    condition = alltrue(flatten([
      for origins in values(var.media_cors_origins) : [
        for origin in origins : startswith(origin, "https://") && !endswith(origin, "/")
      ]
    ]))
    error_message = "CORS origins must be exact HTTPS origins without a trailing slash."
  }
}

variable "notification_task_environments" {
  description = "Environments where the durable lead-notification Cloud Tasks queue is provisioned."
  type        = set(string)
  default     = ["test"]

  validation {
    condition = alltrue([
      for environment in var.notification_task_environments : contains(["test", "prod"], environment)
    ])
    error_message = "Notification task environments must be test and/or prod."
  }
}

variable "structured_content_index_environments" {
  description = "Environments where Products, Offers, FAQs, and Pages public-query indexes are provisioned."
  type        = set(string)
  default     = ["test"]

  validation {
    condition = alltrue([
      for environment in var.structured_content_index_environments : contains(["test", "prod"], environment)
    ])
    error_message = "Structured content index environments must be test and/or prod."
  }
}
