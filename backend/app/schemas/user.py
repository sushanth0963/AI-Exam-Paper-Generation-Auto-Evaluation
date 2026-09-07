from typing import Optional

from pydantic import BaseModel, field_validator


class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: Optional[str] = "student"   # "student" | "admin"

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        email = value.strip()
        if not email or "@" not in email or email.count("@") != 1:
            raise ValueError("Invalid email address")
        local_part, domain = email.split("@", 1)
        if not local_part or not domain or "." not in domain and not domain.endswith(".local"):
            raise ValueError("Invalid email address")
        if any(ch.isspace() for ch in email):
            raise ValueError("Invalid email address")
        return email


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse