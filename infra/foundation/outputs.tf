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
      line_channel_secret         = google_secret_manager_secret.runtime["${environment}-line-channel-secret"].secret_id
      line_notification_target    = google_secret_manager_secret.runtime["${environment}-line-notification-target-id"].secret_id
      gmail_app_password_secret   = google_secret_manager_secret.runtime["${environment}-gmail-app-password"].secret_id
      media_signing_service_email = google_service_account.api[environment].email
    }
  }
}

output "deployer_service_account" {
  value = google_service_account.deployer.email
}

output "build_bucket" {
  value = google_storage_bucket.build.name
}

output "notification_tasks" {
  value = {
    for environment, queue in google_cloud_tasks_queue.lead_notifications : environment => {
      location                = queue.location
      queue_name              = queue.name
      task_service_account    = google_service_account.notification_task[environment].email
      publisher_service_email = google_service_account.api[environment].email
    }
  }
}

output "production_web_edge" {
  description = "Non-secret values required to complete and verify the Production domain cutover."
  value = {
    canonical_domain = var.production_canonical_domain
    apex_domain      = var.production_domain
    ipv4_address     = google_compute_global_address.web_prod.address
    dns_authorizations = [
      {
        name = google_certificate_manager_dns_authorization.web_prod.dns_resource_record[0].name
        type = google_certificate_manager_dns_authorization.web_prod.dns_resource_record[0].type
        data = google_certificate_manager_dns_authorization.web_prod.dns_resource_record[0].data
      },
      {
        name = google_certificate_manager_dns_authorization.web_prod_canonical.dns_resource_record[0].name
        type = google_certificate_manager_dns_authorization.web_prod_canonical.dns_resource_record[0].type
        data = google_certificate_manager_dns_authorization.web_prod_canonical.dns_resource_record[0].data
      },
    ]
  }
}
