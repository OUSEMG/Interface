from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from analytics import run_analysis
from atlas_score import run_atlas_score
from middleware.auth_middleware import get_current_user
from monte_carlo import run_monte_carlo
from routers import auth, portfolio

app = FastAPI(title="Atlas API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(portfolio.router, prefix="/api/portfolio", tags=["portfolio"])

VALID_PERIODS = {"3M", "6M", "YTD", "1Y", "All"}


@app.get("/api/portfolio-research")
def portfolio_research(period: str = "1Y", current_user=Depends(get_current_user)):
    if period not in VALID_PERIODS:
        raise HTTPException(status_code=400, detail="Invalid period")

    try:
        return run_analysis(period)
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error)) from error


@app.get("/api/atlas-score/{ticker}")
def atlas_score(ticker: str, current_user=Depends(get_current_user)):
    if not ticker.strip():
        raise HTTPException(status_code=400, detail="Ticker is required")

    try:
        return run_atlas_score(ticker.strip().upper())
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error)) from error


@app.get("/api/monte-carlo/{ticker}")
def monte_carlo(
    ticker: str,
    num_simulations: int = 10000,
    num_days: int = 252,
    lookback_days: int = 365,
    current_user=Depends(get_current_user),
):
    if not ticker.strip():
        raise HTTPException(status_code=400, detail="Ticker is required")
    if num_simulations < 1000 or num_simulations > 100000:
        raise HTTPException(status_code=400, detail="Simulations must be between 1,000 and 100,000")
    if num_days < 21 or num_days > 504:
        raise HTTPException(status_code=400, detail="Trading days must be between 21 and 504")
    if lookback_days not in {180, 365, 730}:
        raise HTTPException(status_code=400, detail="Invalid lookback period")

    try:
        return run_monte_carlo(
            ticker.strip().upper(),
            num_simulations,
            num_days,
            lookback_days,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error)) from error
