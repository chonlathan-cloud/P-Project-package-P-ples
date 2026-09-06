media_cors_origins = {
  test = ["https://ddbox-web-test-439060579730.asia-southeast1.run.app"]
  prod = [
    "https://ddbox-web-prod-439060579730.asia-southeast1.run.app",
    "https://ddboxprinting.com",
    "https://www.ddboxprinting.com",
  ]
}

notification_task_environments        = ["test", "prod"]
structured_content_index_environments = ["test", "prod"]
