locals {
  environments = {
    test = {
      database_id = "ddbox-test"
      bucket_name = "${var.project_id}-ddbox-media-test"
      pitr        = "POINT_IN_TIME_RECOVERY_DISABLED"
    }
    prod = {
      database_id = "ddbox-prod"
      bucket_name = "${var.project_id}-ddbox-media-prod"
      pitr        = "POINT_IN_TIME_RECOVERY_ENABLED"
    }
  }

  secrets = {
    "test-media-token-key" = {
      secret_id   = "ddbox-test-media-token-key"
      environment = "test"
      purpose     = "media-token-key"
    }
    "test-web-revalidation-token" = {
      secret_id   = "ddbox-test-web-revalidation-token"
      environment = "test"
      purpose     = "web-revalidation-token"
    }
    "prod-media-token-key" = {
      secret_id   = "ddbox-prod-media-token-key"
      environment = "prod"
      purpose     = "media-token-key"
    }
    "prod-web-revalidation-token" = {
      secret_id   = "ddbox-prod-web-revalidation-token"
      environment = "prod"
      purpose     = "web-revalidation-token"
    }
    "test-line-channel-access-token" = {
      secret_id   = "ddbox-test-line-channel-access-token"
      environment = "test"
      purpose     = "line-channel-access-token"
    }
    "test-line-channel-secret" = {
      secret_id   = "ddbox-test-line-channel-secret"
      environment = "test"
      purpose     = "line-channel-secret"
    }
    "test-line-notification-target-id" = {
      secret_id   = "ddbox-test-line-notification-target-id"
      environment = "test"
      purpose     = "line-notification-target-id"
    }
    "test-gmail-app-password" = {
      secret_id   = "ddbox-test-gmail-app-password"
      environment = "test"
      purpose     = "gmail-app-password"
    }
    "prod-line-channel-access-token" = {
      secret_id   = "ddbox-line-channel-access-token"
      environment = "prod"
      purpose     = "line-channel-access-token"
    }
    "prod-line-channel-secret" = {
      secret_id   = "ddbox-line-channel-secret"
      environment = "prod"
      purpose     = "line-channel-secret"
    }
    "prod-line-notification-target-id" = {
      secret_id   = "ddbox-line-notification-target-id"
      environment = "prod"
      purpose     = "line-notification-target-id"
    }
    "prod-gmail-app-password" = {
      secret_id   = "ddbox-gmail-app-password"
      environment = "prod"
      purpose     = "gmail-app-password"
    }
  }
}

resource "google_artifact_registry_repository" "ddbox" {
  project         = var.project_id
  location        = var.region
  repository_id   = "ddbox"
  format          = "DOCKER"
  description     = "Immutable DD Box web and Python API images"
  deletion_policy = "PREVENT"

  docker_config {
    immutable_tags = true
  }

  labels = {
    application = "ddbox"
    managed-by  = "terraform"
  }
}

resource "google_service_account" "api" {
  for_each = local.environments

  project         = var.project_id
  account_id      = "ddbox-api-${each.key}"
  display_name    = "DD Box API ${upper(each.key)} runtime"
  description     = "Runtime identity for the DD Box Python API; do not create keys."
  deletion_policy = "ABANDON"
}

resource "google_service_account" "web" {
  for_each = local.environments

  project         = var.project_id
  account_id      = "ddbox-web-${each.key}"
  display_name    = "DD Box web ${upper(each.key)} runtime"
  description     = "Runtime identity for DD Box Next.js; no Firestore or Storage access."
  deletion_policy = "ABANDON"
}

resource "google_service_account" "deployer" {
  project         = var.project_id
  account_id      = "ddbox-deployer"
  display_name    = "DD Box deployment identity"
  description     = "CI deployment identity; runtime workloads must not use it."
  deletion_policy = "ABANDON"
}

resource "google_firestore_database" "ddbox" {
  for_each = local.environments

  project                           = var.project_id
  name                              = each.value.database_id
  location_id                       = var.region
  type                              = "FIRESTORE_NATIVE"
  concurrency_mode                  = "OPTIMISTIC"
  app_engine_integration_mode       = "DISABLED"
  point_in_time_recovery_enablement = each.value.pitr
  delete_protection_state           = "DELETE_PROTECTION_ENABLED"
  deletion_policy                   = "ABANDON"

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_firestore_index" "gallery_published" {
  for_each = local.environments

  project     = var.project_id
  database    = google_firestore_database.ddbox[each.key].name
  collection  = "gallery_items"
  query_scope = "COLLECTION"

  fields {
    field_path = "status"
    order      = "ASCENDING"
  }

  fields {
    field_path = "published_at"
    order      = "DESCENDING"
  }
}

resource "google_firestore_backup_schedule" "prod_daily" {
  project         = var.project_id
  database        = google_firestore_database.ddbox["prod"].name
  retention       = "1209600s"
  deletion_policy = "PREVENT"

  daily_recurrence {}
}

resource "google_storage_bucket" "media" {
  for_each = local.environments

  project                     = var.project_id
  name                        = each.value.bucket_name
  location                    = upper(var.region)
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  force_destroy               = false

  versioning {
    enabled = true
  }

  dynamic "cors" {
    for_each = length(lookup(var.media_cors_origins, each.key, [])) > 0 ? [1] : []
    content {
      origin          = var.media_cors_origins[each.key]
      method          = ["PUT"]
      response_header = ["Content-Type", "ETag"]
      max_age_seconds = 3600
    }
  }

  lifecycle_rule {
    condition {
      age            = 1
      matches_prefix = ["staging/"]
    }
    action {
      type = "Delete"
    }
  }

  lifecycle {
    prevent_destroy = true
  }

  labels = {
    application = "ddbox"
    environment = each.key
    managed-by  = "terraform"
  }
}

resource "google_storage_bucket" "build" {
  project                     = var.project_id
  name                        = "${var.project_id}-ddbox-build"
  location                    = upper(var.region)
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  force_destroy               = false

  lifecycle_rule {
    condition {
      age = 7
    }
    action {
      type = "Delete"
    }
  }

  lifecycle {
    prevent_destroy = true
  }

  labels = {
    application = "ddbox"
    purpose     = "build-source-and-logs"
    managed-by  = "terraform"
  }
}

resource "google_secret_manager_secret" "runtime" {
  for_each = local.secrets

  project             = var.project_id
  secret_id           = each.value.secret_id
  deletion_protection = true

  replication {
    user_managed {
      replicas {
        location = var.region
      }
    }
  }

  labels = {
    application = "ddbox"
    environment = each.value.environment
    managed-by  = "terraform"
    purpose     = each.value.purpose
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_project_iam_custom_role" "media_object_manager" {
  project     = var.project_id
  role_id     = "ddboxMediaObjectManager"
  title       = "DD Box Media Object Manager"
  description = "Read, create, overwrite, and delete objects only when bound on a DD Box bucket."
  stage       = "GA"
  permissions = [
    "storage.objects.create",
    "storage.objects.delete",
    "storage.objects.get",
  ]
  deletion_policy = "PREVENT"
}

resource "google_project_iam_custom_role" "signed_url_creator" {
  project         = var.project_id
  role_id         = "ddboxSignedUrlCreator"
  title           = "DD Box Signed URL Creator"
  description     = "Call IAM Credentials signBlob for direct media upload URLs."
  stage           = "GA"
  permissions     = ["iam.serviceAccounts.signBlob"]
  deletion_policy = "PREVENT"
}

resource "google_storage_bucket_iam_member" "api_media" {
  for_each = local.environments

  bucket = google_storage_bucket.media[each.key].name
  role   = google_project_iam_custom_role.media_object_manager.name
  member = "serviceAccount:${google_service_account.api[each.key].email}"
}

resource "google_project_iam_member" "api_firestore" {
  for_each = local.environments

  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.api[each.key].email}"

  condition {
    title       = "ddbox_${each.key}_database_only"
    description = "Restrict the DD Box API runtime to its named Firestore database."
    expression  = "resource.name == \"projects/${var.project_id}/databases/${each.value.database_id}\""
  }
}

resource "google_service_account_iam_member" "api_sign_blob" {
  for_each = local.environments

  service_account_id = google_service_account.api[each.key].name
  role               = google_project_iam_custom_role.signed_url_creator.name
  member             = "serviceAccount:${google_service_account.api[each.key].email}"
}

resource "google_secret_manager_secret_iam_member" "api_media_token" {
  for_each = local.environments

  project   = var.project_id
  secret_id = google_secret_manager_secret.runtime["${each.key}-media-token-key"].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.api[each.key].email}"
}

resource "google_secret_manager_secret_iam_member" "api_revalidation_token" {
  for_each = local.environments

  project   = var.project_id
  secret_id = google_secret_manager_secret.runtime["${each.key}-web-revalidation-token"].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.api[each.key].email}"
}

resource "google_secret_manager_secret_iam_member" "api_notifications" {
  for_each = {
    for key, secret in local.secrets : key => secret
    if contains([
      "line-channel-access-token",
      "line-channel-secret",
      "line-notification-target-id",
      "gmail-app-password",
    ], secret.purpose)
  }

  project   = var.project_id
  secret_id = google_secret_manager_secret.runtime[each.key].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.api[each.value.environment].email}"
}

resource "google_secret_manager_secret_iam_member" "web_revalidation_token" {
  for_each = local.environments

  project   = var.project_id
  secret_id = google_secret_manager_secret.runtime["${each.key}-web-revalidation-token"].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.web[each.key].email}"
}

resource "google_artifact_registry_repository_iam_member" "deployer_writer" {
  project    = var.project_id
  location   = var.region
  repository = google_artifact_registry_repository.ddbox.repository_id
  role       = "roles/artifactregistry.writer"
  member     = "serviceAccount:${google_service_account.deployer.email}"
}

resource "google_storage_bucket_iam_member" "deployer_build_objects" {
  bucket = google_storage_bucket.build.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.deployer.email}"
}

resource "google_storage_bucket_iam_member" "deployer_build_bucket_reader" {
  bucket = google_storage_bucket.build.name
  role   = "roles/storage.legacyBucketReader"
  member = "serviceAccount:${google_service_account.deployer.email}"
}

resource "google_project_iam_member" "deployer_cloud_run" {
  project = var.project_id
  role    = "roles/run.developer"
  member  = "serviceAccount:${google_service_account.deployer.email}"
}

resource "google_service_account_iam_member" "deployer_runtime_user_api" {
  for_each = local.environments

  service_account_id = google_service_account.api[each.key].name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.deployer.email}"
}

resource "google_service_account_iam_member" "deployer_runtime_user_web" {
  for_each = local.environments

  service_account_id = google_service_account.web[each.key].name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.deployer.email}"
}
