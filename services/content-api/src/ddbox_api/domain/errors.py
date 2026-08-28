class DomainError(Exception):
    code = "domain_error"
    status_code = 400


class NotFoundError(DomainError):
    code = "not_found"
    status_code = 404


class ConflictError(DomainError):
    code = "conflict"
    status_code = 409


class ForbiddenError(DomainError):
    code = "forbidden"
    status_code = 403


class ValidationError(DomainError):
    code = "validation_error"
    status_code = 422
