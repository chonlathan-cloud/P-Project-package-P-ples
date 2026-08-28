FROM ghcr.io/astral-sh/uv:0.9.14 AS uv

FROM python:3.13.7-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PATH="/app/.venv/bin:${PATH}"
WORKDIR /app
RUN groupadd --system --gid 1001 ddbox && useradd --system --uid 1001 --gid ddbox ddbox
COPY --from=uv /uv /uvx /bin/
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project
COPY src ./src
RUN uv sync --frozen --no-dev
RUN mkdir -p /app/.local/media && chown -R ddbox:ddbox /app
USER ddbox
EXPOSE 8080
CMD ["uvicorn", "ddbox_api.main:app", "--host", "0.0.0.0", "--port", "8080", "--proxy-headers", "--forwarded-allow-ips", "*"]

