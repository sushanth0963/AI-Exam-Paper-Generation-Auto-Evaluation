from datetime import datetime, timedelta

from jose import JWTError, jwt

from passlib.context import CryptContext

from fastapi import (
    HTTPException,
    Depends,
    status
)

from fastapi.security import OAuth2PasswordBearer

from sqlalchemy.orm import Session

from app.db.database import get_db

from app.models.user import User


# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)


import os
from dotenv import load_dotenv

load_dotenv()

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "mysecretkey_change_in_production")

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))



# Password hashing configuration
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


# Hash password
def hash_password(password: str):

    return pwd_context.hash(password)


# Verify password
def verify_password(
    plain_password: str,
    hashed_password: str
):

    return pwd_context.verify(
        plain_password,
        hashed_password
    )


# Create JWT access token
def create_access_token(data: dict):

    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update(
        {
            "exp": expire
        }
    )

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded_jwt


# Verify JWT token
def verify_token(
    token: str = Depends(oauth2_scheme)
):

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={
            "WWW-Authenticate": "Bearer"
        }
    )

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        email: str = payload.get("sub")

        if email is None:

            raise credentials_exception

        return payload

    except JWTError:

        raise credentials_exception


# Get current logged-in user
def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):

    payload = verify_token(token)

    email = payload.get("sub")

    user = db.query(User).filter(
        User.email == email
    ).first()

    if not user:

        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user
def admin_required(
    current_user = Depends(get_current_user)
):

    if current_user.role != "admin":

        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    return current_user