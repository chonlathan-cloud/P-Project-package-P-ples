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
