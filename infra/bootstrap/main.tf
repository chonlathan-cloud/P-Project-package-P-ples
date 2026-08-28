resource "google_storage_bucket" "terraform_state" {
  project                     = var.project_id
  name                        = "${var.project_id}-ddbox-tfstate"
  location                    = upper(var.region)
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  force_destroy               = false

  versioning {
    enabled = true
  }

  lifecycle {
    prevent_destroy = true
  }

  labels = {
    application = "ddbox"
    managed-by  = "terraform"
    purpose     = "terraform-state"
  }
}

output "state_bucket" {
  value = google_storage_bucket.terraform_state.name
}
