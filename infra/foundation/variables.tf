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

variable "production_domain" {
  description = "Apex domain for DD Box Production."
  type        = string
  default     = "ddboxprinting.com"

  validation {
    condition     = var.production_domain == trimsuffix(lower(var.production_domain), ".") && !startswith(var.production_domain, "www.")
    error_message = "Production domain must be a lowercase apex hostname without a trailing dot."
  }
}

variable "production_canonical_domain" {
  description = "Canonical hostname served by DD Box Production."
  type        = string
  default     = "www.ddboxprinting.com"

  validation {
    condition     = var.production_canonical_domain == trimsuffix(lower(var.production_canonical_domain), ".")
    error_message = "Production canonical domain must be a lowercase hostname without a trailing dot."
  }
}

variable "production_web_service_name" {
  description = "Existing Cloud Run service used by the Production serverless NEG."
  type        = string
  default     = "ddbox-web-prod"
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
