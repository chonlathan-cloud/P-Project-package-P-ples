from __future__ import annotations

from ddbox_api.domain.models import PricingBenchmark
from ddbox_api.repositories.base import ContentRepository


class PricingService:
    def __init__(self, repository: ContentRepository) -> None:
        self._repository = repository

    def list_published(self) -> list[PricingBenchmark]:
        return self._repository.list_published_pricing_benchmarks()
