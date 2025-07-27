"""
Financial API Models
- Pydantic models for financial data
- Request/response schemas
- Validation rules
- OpenAPI documentation
- Example data for testing
"""
from pydantic import BaseModel, Field
from typing import List, Optional

class FinancialRecord(BaseModel):
    amount: float = Field(..., description="Transaction amount")
    date: str = Field(..., description="Transaction date (YYYY-MM-DD)")
    category: Optional[str] = Field(None, description="Transaction category")

class FinancialRequest(BaseModel):
    records: List[FinancialRecord]

class FinancialResponse(BaseModel):
    status: str
    message: Optional[str] = None
    data: Optional[dict] = None 