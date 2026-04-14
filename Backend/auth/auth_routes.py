from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Role
from auth.hashing import hash_password, verify_password
from auth.dependencies import get_current_user
from auth.auth import create_access_token
from auth.schemas import UserLogin, UserRegister
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

# ================= CURRENT USER API =================

@router.get("/me")
def get_me(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # payload only has user_id + role
    user = db.query(User).filter(User.user_id == current_user["user_id"]).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "user_id": user.user_id,
        "email": user.email,
        "role": user.role.role_name
    }

# ================= REGISTER API =================

@router.post("/register")
def register(user: UserRegister, db: Session = Depends(get_db)):
    
    role = db.query(Role).filter(Role.role_name == user.role).first()
    if not role:
        raise HTTPException(status_code=400, detail="Invalid role")

    hashed_pwd = hash_password(user.password)

    new_user = User(
        email=user.email,
        password_hash=hashed_pwd,
        role_id=role.role_id
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User registered successfully"}


# ================= LOGIN API =================

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):

    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({
        "user_id": db_user.user_id,
        "role": db_user.role.role_name
    })

    return {
        "access_token": token,
        "token_type": "bearer"
    }