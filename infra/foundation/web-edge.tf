resource "google_project_service" "certificate_manager" {
  project = var.project_id
  service = "certificatemanager.googleapis.com"

  disable_on_destroy = false
}

resource "google_certificate_manager_dns_authorization" "web_prod" {
  project     = var.project_id
  location    = "global"
  name        = "ddbox-web-prod"
  description = "DNS authorization for the DD Box Production canonical domain."
  domain      = var.production_domain
  type        = "PER_PROJECT_RECORD"

  depends_on = [google_project_service.certificate_manager]
}

resource "google_certificate_manager_dns_authorization" "web_prod_canonical" {
  project     = var.project_id
  location    = "global"
  name        = "ddbox-web-prod-canonical"
  description = "DNS authorization for the DD Box Production canonical hostname."
  domain      = var.production_canonical_domain
  type        = "PER_PROJECT_RECORD"

  depends_on = [google_project_service.certificate_manager]
}

resource "google_certificate_manager_certificate" "web_prod" {
  project     = var.project_id
  location    = "global"
  name        = "ddbox-web-prod"
  description = "Google-managed certificate for DD Box Production."

  managed {
    domains = [
      var.production_domain,
      var.production_canonical_domain,
    ]
    dns_authorizations = [
      google_certificate_manager_dns_authorization.web_prod.id,
      google_certificate_manager_dns_authorization.web_prod_canonical.id,
    ]
  }

  labels = {
    application = "ddbox"
    environment = "prod"
    managed-by  = "terraform"
  }
}

resource "google_certificate_manager_certificate_map" "web_prod" {
  project     = var.project_id
  name        = "ddbox-web-prod"
  description = "Certificate map for the DD Box Production HTTPS load balancer."

  labels = {
    application = "ddbox"
    environment = "prod"
    managed-by  = "terraform"
  }

  depends_on = [google_project_service.certificate_manager]
}

resource "google_certificate_manager_certificate_map_entry" "web_prod_apex" {
  project      = var.project_id
  name         = "ddbox-web-prod-apex"
  map          = google_certificate_manager_certificate_map.web_prod.name
  certificates = [google_certificate_manager_certificate.web_prod.id]
  hostname     = var.production_domain
}

resource "google_certificate_manager_certificate_map_entry" "web_prod_canonical" {
  project      = var.project_id
  name         = "ddbox-web-prod-canonical"
  map          = google_certificate_manager_certificate_map.web_prod.name
  certificates = [google_certificate_manager_certificate.web_prod.id]
  hostname     = var.production_canonical_domain
}

resource "google_compute_global_address" "web_prod" {
  project      = var.project_id
  name         = "ddbox-web-prod"
  description  = "Global IPv4 address for the DD Box Production HTTPS load balancer."
  address_type = "EXTERNAL"
  ip_version   = "IPV4"
}

resource "google_compute_region_network_endpoint_group" "web_prod" {
  project               = var.project_id
  region                = var.region
  name                  = "ddbox-web-prod"
  description           = "Serverless NEG for the DD Box Production Cloud Run service."
  network_endpoint_type = "SERVERLESS"

  cloud_run {
    service = var.production_web_service_name
  }
}

resource "google_compute_backend_service" "web_prod" {
  project               = var.project_id
  name                  = "ddbox-web-prod"
  description           = "Backend service for the DD Box Production Cloud Run service."
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  enable_cdn            = false

  backend {
    group = google_compute_region_network_endpoint_group.web_prod.id
  }

  log_config {
    enable      = true
    sample_rate = 1
  }
}

resource "google_compute_url_map" "web_prod_https" {
  project         = var.project_id
  name            = "ddbox-web-prod-https"
  description     = "Serve the canonical host and redirect the apex host to www."
  default_service = google_compute_backend_service.web_prod.id

  host_rule {
    hosts        = [var.production_canonical_domain]
    path_matcher = "canonical"
  }

  host_rule {
    hosts        = [var.production_domain]
    path_matcher = "apex-redirect"
  }

  path_matcher {
    name            = "canonical"
    default_service = google_compute_backend_service.web_prod.id
  }

  path_matcher {
    name = "apex-redirect"

    default_url_redirect {
      host_redirect          = var.production_canonical_domain
      https_redirect         = true
      redirect_response_code = "MOVED_PERMANENTLY_DEFAULT"
      strip_query            = false
    }
  }
}

resource "google_compute_target_https_proxy" "web_prod" {
  project         = var.project_id
  name            = "ddbox-web-prod"
  description     = "HTTPS target proxy for DD Box Production."
  url_map         = google_compute_url_map.web_prod_https.id
  certificate_map = "//certificatemanager.googleapis.com/${google_certificate_manager_certificate_map.web_prod.id}"

  depends_on = [
    google_certificate_manager_certificate_map_entry.web_prod_apex,
    google_certificate_manager_certificate_map_entry.web_prod_canonical,
  ]
}

resource "google_compute_global_forwarding_rule" "web_prod_https" {
  project               = var.project_id
  name                  = "ddbox-web-prod-https"
  description           = "Public HTTPS frontend for DD Box Production."
  ip_address            = google_compute_global_address.web_prod.id
  ip_protocol           = "TCP"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  port_range            = "443"
  target                = google_compute_target_https_proxy.web_prod.id
}

resource "google_compute_url_map" "web_prod_http_redirect" {
  project     = var.project_id
  name        = "ddbox-web-prod-http-redirect"
  description = "Redirect all DD Box Production HTTP requests to HTTPS on the canonical host."

  default_url_redirect {
    host_redirect          = var.production_canonical_domain
    https_redirect         = true
    redirect_response_code = "MOVED_PERMANENTLY_DEFAULT"
    strip_query            = false
  }
}

resource "google_compute_target_http_proxy" "web_prod" {
  project     = var.project_id
  name        = "ddbox-web-prod"
  description = "HTTP redirect proxy for DD Box Production."
  url_map     = google_compute_url_map.web_prod_http_redirect.id
}

resource "google_compute_global_forwarding_rule" "web_prod_http" {
  project               = var.project_id
  name                  = "ddbox-web-prod-http"
  description           = "Public HTTP frontend redirect for DD Box Production."
  ip_address            = google_compute_global_address.web_prod.id
  ip_protocol           = "TCP"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  port_range            = "80"
  target                = google_compute_target_http_proxy.web_prod.id
}
