# pyrefly: ignore [missing-import]
from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

# pyrefly: ignore [missing-import]
from fastapi.security import (
    OAuth2PasswordBearer,
    OAuth2PasswordRequestForm
)

# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

from app.security import verify_token

from app.db.database import get_db

from app.schemas.user import (
    TokenResponse,
    UserCreate,
)

from app.services.auth_service import (
    create_user,
    login_user
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

# OAuth2 Scheme
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)


@router.get("/test")
def test_auth():

    return {
        "message": "Auth route working"
    }


# Register User
@router.post("/register")
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):

    created_user = create_user(
        db,
        user
    )

    if not created_user:

        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    return {
        "message": "User registered successfully"
    }


# Login User
@router.post("/login", response_model=TokenResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    token_data = login_user(
        db,
        form_data.username,
        form_data.password
    )

    if not token_data:

        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    return token_data


# Protected Profile Route
@router.get("/profile")
def get_profile(
    token: str = Depends(oauth2_scheme)
):

    payload = verify_token(token)
    email = payload.get("sub")

    return {
        "message": "Protected route accessed",
        "user": email
    }