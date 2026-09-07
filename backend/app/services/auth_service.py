from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate
from app.security import hash_password, verify_password, create_access_token


def create_user(db: Session, user: UserCreate):
    """Register a new user. Returns None if email already exists."""
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        return None

    hashed_password = hash_password(user.password)
    new_user = User(
        username=user.username,
        email=user.email,
        password=hashed_password,
        role=user.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def login_user(db: Session, email: str, password: str):
    """Authenticate user and return JWT token data. Returns None on failure."""
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active:
        return None
    if not verify_password(password, user.password):
        return None

    access_token = create_access_token({
        "sub": user.email,
        "role": user.role,
        "id": user.id,
    })

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
        },
    }