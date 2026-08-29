output "artifact_repository" {
  value = google_artifact_registry_repository.ddbox.name
}

output "environments" {
  value = {
    for environment, config in local.environments : environment => {
      firestore_database          = google_firestore_database.ddbox[environment].name
      media_bucket                = google_storage_bucket.media[environment].name
      api_service_account         = google_service_account.api[environment].email
      web_service_account         = google_service_account.web[environment].email
      media_token_secret          = google_secret_manager_secret.runtime["${environment}-media-token-key"].secret_id
      web_revalidation_secret     = google_secret_manager_secret.runtime["${environment}-web-revalidation-token"].secret_id
      line_channel_token_secret   = google_secret_manager_secret.runtime["${environment}-line-channel-access-token"].secret_id
      line_notification_target    = google_secret_manager_secret.runtime["${environment}-line-notification-target-id"].secret_id
      email_provider_key_secret   = google_secret_manager_secret.runtime["${environment}-email-provider-api-key"].secret_id
      media_signing_service_email = google_service_account.api[environment].email
    }
  }
}

output "deployer_service_account" {
  value = google_service_account.deployer.email
}
