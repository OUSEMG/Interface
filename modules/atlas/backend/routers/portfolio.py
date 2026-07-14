from fastapi import APIRouter, Depends, HTTPException

from middleware.auth_middleware import get_current_user
from services.portfolio_service import (
    get_combined_snapshot,
    get_portfolio_snapshot,
    get_top_movers,
)


router = APIRouter()


@router.get("/combined/snapshot")
def combined_snapshot(force_refresh: bool = False, current_user=Depends(get_current_user)):
    try:
        return get_combined_snapshot(force_refresh)
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error)) from error


@router.get("/{portfolio_name}/snapshot")
def portfolio_snapshot(
    portfolio_name: str,
    force_refresh: bool = False,
    current_user=Depends(get_current_user),
):
    try:
        return get_portfolio_snapshot(portfolio_name, force_refresh)
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error)) from error


@router.get("/{portfolio_name}/top-movers")
def top_movers(portfolio_name: str, current_user=Depends(get_current_user)):
    try:
        return get_top_movers(portfolio_name)
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error)) from error
