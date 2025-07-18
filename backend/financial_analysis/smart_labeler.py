import json
import numpy as np
from typing import List, Dict, Any, Optional
import re
import asyncio

# Mock imports for now - replace with actual when implementing
# import asyncpg
# from ollama import AsyncClient

class SmartLabeler:
    def __init__(self, glossary_path: str, db: Optional[Any] = None, llm_client: Optional[Any] = None):
        self.glossary = self.load_glossary(glossary_path)
        self.db = db
        self.llm_client = llm_client
        # Extended financial terms mapping
        self.financial_patterns = {
            # Revenue patterns
            r'revenue|sales|income|earnings': 'Revenue Metric',
            r'profit|margin|ebitda|ebit': 'Profitability Metric',
            r'cost|expense|expenditure': 'Cost Metric',
            r'asset|capital|equity': 'Asset Metric',
            r'debt|liability|loan': 'Liability Metric',
            r'cash|flow|liquidity': 'Liquidity Metric',
            r'ratio|percentage|pct': 'Ratio Metric',
            r'date|time|period': 'Temporal Metric',
            r'id|identifier|code': 'Identifier',
            r'category|type|class': 'Categorical Metric'
        }

    def load_glossary(self, path: str) -> Dict[str, str]:
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Warning: Could not load glossary from {path}: {e}")
            # Fallback to hardcoded glossary for actual CSV structure
            return {
                "transaction_id": "Transaction ID",
                "account_id": "Account ID", 
                "customer_name": "Customer Name",
                "transaction_date": "Transaction Date",
                "transaction_type": "Transaction Type",
                "amount": "Transaction Amount (Revenue/Expense)",
                "currency": "Currency",
                "description": "Description",
                "category": "Transaction Category",
                "current_balance": "Account Balance",
                "account_type": "Account Type",
                "merchant_name": "Merchant Name",
                "merchant_city": "Merchant City",
                "merchant_state": "Merchant State",
                "fraud_score": "Fraud Score",
                "is_fraud": "Fraud Indicator"
            }

    async def extract_labels(self, data: List[Dict[str, Any]], user_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Enhanced label extraction with prioritized glossary lookup and robust type detection.
        Optimized for actual financial_transactions_data.csv structure.
        """
        labels = {}
        
        # Identify categorical columns for cross-referencing
        categorical_cols = {}
        for col in data[0].keys():
            values = [row.get(col) for row in data if row.get(col) is not None]
            if len(set(str(v) for v in values)) < 10:  # Categorical if less than 10 unique values
                categorical_cols[col] = set(str(v) for v in values)
        
        for column in data[0].keys():
            values = [row[column] for row in data if column in row and row[column] is not None]
            
            # Improved data type detection with robust numeric handling
            data_type = self._detect_data_type(values)
            
            # 1. User feedback (highest priority)
            user_label = await self.get_user_label(user_id, column) if user_id and self.db else None
            semantic = user_label

            # 2. Glossary lookup (prioritized over cross-column inference)
            if not semantic:
                semantic = self.glossary.get(column, None)

            # 3. Cross-column inference only if glossary lookup failed
            if not semantic:
                semantic = self._infer_semantic_for_actual_csv(column, values, data_type, categorical_cols, data)

            # 4. Robust fallback if still not found
            if not semantic or semantic == column:
                semantic = f"Unknown ({column})"
                print(f"[SmartLabeler] Fallback: Column '{column}' labeled as '{semantic}'")
                category = 'General Metric'
            else:
                # 4. Granular category assignment
                category = self._assign_category_for_actual_csv(semantic)

            # 5. Importance calculation
            importance = self._calculate_importance_for_actual_csv(column, data, values, data_type, semantic)

            labels[column] = {
                'semantic': semantic,
                'category': category,
                'importance': importance,
                'type': data_type,
                'description': f'Represents {semantic} ({category}).'
            }
        
        return labels

    def _detect_data_type(self, values: List[Any]) -> str:
        """Improved data type detection with robust numeric handling."""
        if not values:
            return 'unknown'
        
        # Check for dates (YYYY-MM-DD pattern)
        if all(isinstance(v, str) and re.match(r'\d{4}-\d{2}-\d{2}', v) for v in values):
            return 'date'
        
        # Check for numeric with robust conversion
        numeric_count = 0
        for v in values:
            if isinstance(v, (int, float)):
                numeric_count += 1
            elif isinstance(v, str):
                try:
                    # Try to convert string to float
                    float(v)
                    numeric_count += 1
                except (ValueError, TypeError):
                    pass
        
        # If more than 80% of values are numeric, consider it numeric
        if numeric_count >= len(values) * 0.8:
            return 'numeric'
        
        # Check for categorical (limited unique values)
        unique_count = len(set(str(v) for v in values))
        if unique_count <= min(10, len(values) // 2):
            return 'categorical'
        
        return 'text'

    def _infer_semantic_for_actual_csv(self, column: str, values: List[Any], data_type: str, 
                                      categorical_cols: Dict[str, set], data: List[Dict[str, Any]]) -> str:
        """Infer semantic labels for actual financial data structure."""
        
        # Handle specific loan application columns
        if column == 'ApplicationDate':
            return 'Application Date'
        elif column == 'Age':
            return 'Age'
        elif column == 'AnnualIncome':
            return 'Annual Income'
        elif column == 'CreditScore':
            return 'Credit Score'
        elif column == 'EmploymentStatus':
            return 'Employment Status'
        elif column == 'EducationLevel':
            return 'Education Level'
        elif column == 'Experience':
            return 'Years of Experience'
        elif column == 'LoanAmount':
            return 'Loan Amount'
        elif column == 'LoanDuration':
            return 'Loan Duration'
        elif column == 'MaritalStatus':
            return 'Marital Status'
        elif column == 'NumberOfDependents':
            return 'Number of Dependents'
        elif column == 'HomeOwnershipStatus':
            return 'Home Ownership Status'
        elif column == 'MonthlyDebtPayments':
            return 'Monthly Debt Payments'
        elif column == 'CreditCardUtilizationRate':
            return 'Credit Card Utilization Rate'
        elif column == 'NumberOfOpenCreditLines':
            return 'Number of Open Credit Lines'
        elif column == 'NumberOfCreditInquiries':
            return 'Number of Credit Inquiries'
        elif column == 'DebtToIncomeRatio':
            return 'Debt to Income Ratio'
        elif column == 'BankruptcyHistory':
            return 'Bankruptcy History'
        elif column == 'LoanPurpose':
            return 'Loan Purpose'
        elif column == 'PreviousLoanDefaults':
            return 'Previous Loan Defaults'
        elif column == 'PaymentHistory':
            return 'Payment History'
        elif column == 'LengthOfCreditHistory':
            return 'Length of Credit History'
        elif column == 'SavingsAccountBalance':
            return 'Savings Account Balance'
        elif column == 'CheckingAccountBalance':
            return 'Checking Account Balance'
        elif column == 'TotalAssets':
            return 'Total Assets'
        elif column == 'TotalLiabilities':
            return 'Total Liabilities'
        elif column == 'MonthlyIncome':
            return 'Monthly Income'
        elif column == 'UtilityBillsPaymentHistory':
            return 'Utility Bills Payment History'
        elif column == 'JobTenure':
            return 'Job Tenure'
        elif column == 'NetWorth':
            return 'Net Worth'
        elif column == 'BaseInterestRate':
            return 'Base Interest Rate'
        elif column == 'InterestRate':
            return 'Interest Rate'
        elif column == 'MonthlyLoanPayment':
            return 'Monthly Loan Payment'
        elif column == 'TotalDebtToIncomeRatio':
            return 'Total Debt to Income Ratio'
        elif column == 'LoanApproved':
            return 'Loan Approved'
        elif column == 'RiskScore':
            return 'Risk Score'
        
        # Handle specific columns from actual CSV structure with exact matches
        elif column == 'amount':
            # Use transaction_type to determine if amount is Revenue or Expense
            if 'transaction_type' in categorical_cols:
                transaction_types = categorical_cols['transaction_type']
                revenue_types = ['Deposit', 'Transfer', 'Credit']
                expense_types = ['Withdrawal', 'Purchase', 'Bill Pay', 'Debit']
                
                # Check if we have both revenue and expense transaction types
                has_revenue = any(term in transaction_types for term in revenue_types)
                has_expense = any(term in transaction_types for term in expense_types)
                
                if has_revenue and has_expense:
                    # Mixed transaction types - amount represents both Revenue and Expense
                    return 'Transaction Amount (Revenue/Expense)'
                elif has_revenue:
                    return 'Revenue'
                elif has_expense:
                    return 'Expense'
                else:
                    # Mixed transaction types - use value analysis
                    if data_type == 'numeric' and values:
                        try:
                            numeric_values = [float(str(v)) for v in values if v is not None]
                            positive_count = sum(1 for v in numeric_values if v > 0)
                            negative_count = sum(1 for v in numeric_values if v < 0)
                            if positive_count > negative_count:
                                return 'Revenue'
                            elif negative_count > positive_count:
                                return 'Expense'
                            else:
                                return 'Transaction Amount'
                        except (ValueError, TypeError):
                            return 'Transaction Amount'
            return 'Transaction Amount'
        
        elif column == 'current_balance' or column == 'balance':
            return 'Account Balance'
        
        elif column == 'transaction_date' or column == 'date':
            return 'Transaction Date'
        
        elif column == 'transaction_type' or column == 'type':
            return 'Transaction Type'
        
        elif column == 'currency':
            return 'Currency'
        
        elif column == 'category':
            return 'Transaction Category'
        
        elif column == 'fraud_score':
            return 'Fraud Score'
        
        elif column == 'account_id':
            return 'Account ID'
        
        elif column == 'merchant_name' or column == 'merchant':
            return 'Merchant Name'
        
        elif column == 'merchant_city':
            return 'Merchant City'
        
        elif column == 'merchant_state':
            return 'Merchant State'
        
        elif column == 'description':
            return 'Transaction Description'
        
        elif column == 'customer_name':
            return 'Customer Name'
        
        elif column == 'account_type':
            return 'Account Type'
        
        # Handle numeric columns with financial patterns
        elif data_type == 'numeric':
            # Check for common financial patterns
            if any(pattern in column.lower() for pattern in ['amount', 'value', 'price', 'cost', 'revenue', 'income', 'expense', 'payment', 'deposit', 'withdrawal', 'credit', 'debit', 'cash', 'total', 'sum', 'avg', 'mean', 'median', 'min', 'max']):
                return f'{column.title()} Amount'
            
            # Check for percentage or ratio patterns
            if any(pattern in column.lower() for pattern in ['ratio', 'percentage', 'pct', 'rate', 'score']):
                return f'{column.title()} Ratio'
                            
            # Check for count patterns
            if any(pattern in column.lower() for pattern in ['count', 'number', 'total', 'sum']):
                return f'{column.title()} Count'
            
            return f'{column.title()} Metric'
        
        # Handle date/time columns
        elif data_type == 'date':
            if any(pattern in column.lower() for pattern in ['date', 'time', 'period', 'created', 'updated', 'modified']):
                return f'{column.title()} Date'
            return 'Date'
        
        # Handle categorical columns
        elif data_type == 'categorical':
            if any(pattern in column.lower() for pattern in ['type', 'category', 'class', 'status', 'state', 'condition']):
                return f'{column.title()} Category'
            if any(pattern in column.lower() for pattern in ['id', 'identifier', 'code', 'key']):
                return f'{column.title()} ID'
            return f'{column.title()} Category'
            
        # Default text handling
        else:
            if any(pattern in column.lower() for pattern in ['name', 'title', 'description', 'note', 'comment']):
                return f'{column.title()}'
            if any(pattern in column.lower() for pattern in ['id', 'identifier', 'code', 'key']):
                return f'{column.title()} ID'
            return f'{column.title()}'

    def _assign_category_for_actual_csv(self, semantic: str) -> str:
        """Assign granular categories for actual CSV structure."""
        # Specific loan application categories
        if semantic in ['Application Date']:
            return 'Temporal Metric'
        elif semantic in ['Age', 'Years of Experience', 'Job Tenure']:
            return 'Demographic Metric'
        elif semantic in ['Annual Income', 'Monthly Income']:
            return 'Income Metric'
        elif semantic in ['Credit Score', 'Payment History', 'Length of Credit History']:
            return 'Credit Metric'
        elif semantic in ['Employment Status', 'Education Level', 'Marital Status']:
            return 'Personal Metric'
        elif semantic in ['Loan Amount', 'Loan Duration', 'Loan Purpose']:
            return 'Loan Metric'
        elif semantic in ['Number of Dependents', 'Home Ownership Status']:
            return 'Personal Metric'
        elif semantic in ['Monthly Debt Payments', 'Credit Card Utilization Rate', 'Debt to Income Ratio', 'Total Debt to Income Ratio']:
            return 'Debt Metric'
        elif semantic in ['Number of Open Credit Lines', 'Number of Credit Inquiries']:
            return 'Credit Metric'
        elif semantic in ['Bankruptcy History', 'Previous Loan Defaults', 'Risk Score']:
            return 'Risk Metric'
        elif semantic in ['Savings Account Balance', 'Checking Account Balance']:
            return 'Liquidity Metric'
        elif semantic in ['Total Assets', 'Total Liabilities', 'Net Worth']:
            return 'Asset Metric'
        elif semantic in ['Utility Bills Payment History']:
            return 'Payment Metric'
        elif semantic in ['Base Interest Rate', 'Interest Rate', 'Monthly Loan Payment']:
            return 'Interest Metric'
        elif semantic in ['Loan Approved']:
            return 'Approval Metric'
        
        # Specific financial categories
        elif semantic in ['Transaction ID', 'Account ID']:
            return 'Identifier Metric'
        elif semantic in ['Revenue', 'Transaction Amount (Revenue/Expense)']:
            return 'Revenue Metric'
        elif semantic == 'Expense':
            return 'Expense Metric'
        elif semantic == 'Account Balance':
            return 'Liquidity Metric'
        elif semantic == 'Transaction Date':
            return 'Temporal Metric'
        elif semantic == 'Transaction Type':
            return 'Transaction Type'
        elif semantic == 'Currency':
            return 'Currency Metric'
        elif semantic == 'Transaction Category':
            return 'Transaction Category'
        elif semantic in ['Fraud Score', 'Fraud Indicator']:
            return 'Risk Metric'
        elif semantic in ['Merchant Name', 'Merchant City', 'Merchant State']:
            return 'Merchant Metric'
        elif semantic == 'Customer Name':
            return 'Customer Metric'
        elif semantic == 'Description':
            return 'Description Metric'
        elif semantic == 'Account Type':
            return 'Account Type'
        # Enhanced pattern matching for better specificity
        elif 'amount' in semantic.lower() or 'revenue' in semantic.lower() or 'income' in semantic.lower():
            return 'Revenue Metric'
        elif 'expense' in semantic.lower() or 'cost' in semantic.lower() or 'payment' in semantic.lower():
            return 'Expense Metric'
        elif 'balance' in semantic.lower() or 'cash' in semantic.lower() or 'liquidity' in semantic.lower():
            return 'Liquidity Metric'
        elif 'date' in semantic.lower() or 'time' in semantic.lower() or 'period' in semantic.lower():
            return 'Temporal Metric'
        elif 'fraud' in semantic.lower() or 'risk' in semantic.lower() or 'score' in semantic.lower():
            return 'Risk Metric'
        elif 'category' in semantic.lower() or 'type' in semantic.lower() or 'class' in semantic.lower():
            return 'Transaction Category'
        elif 'merchant' in semantic.lower() or 'vendor' in semantic.lower() or 'seller' in semantic.lower():
            return 'Merchant Metric'
        elif 'customer' in semantic.lower() or 'client' in semantic.lower() or 'user' in semantic.lower():
            return 'Customer Metric'
        elif 'id' in semantic.lower() or 'identifier' in semantic.lower() or 'code' in semantic.lower():
            return 'Identifier Metric'
        elif 'description' in semantic.lower() or 'note' in semantic.lower() or 'comment' in semantic.lower():
            return 'Description Metric'
        elif 'currency' in semantic.lower() or 'money' in semantic.lower() or 'dollar' in semantic.lower():
            return 'Currency Metric'
        else:
            return 'General Metric'

    def _calculate_importance_for_actual_csv(self, column: str, data: List[Dict[str, Any]], values: List[Any], 
                                           data_type: str, semantic: str) -> float:
        """Calculate importance scores for actual CSV structure."""
        importance = 70  # Default importance
        
        # Boost importance for key financial metrics
        if semantic in ['Transaction Amount (Revenue/Expense)', 'Revenue', 'Expense']:
            importance = 95
        elif semantic == 'Account Balance':
            importance = 90
        elif semantic in ['Fraud Score', 'Fraud Indicator']:
            importance = 85
        elif semantic == 'Transaction Type':
            importance = 80
        elif semantic == 'Transaction Category':
            importance = 75
        elif semantic in ['Transaction ID', 'Account ID']:
            importance = 50  # Lower for identifiers
        elif semantic == 'Transaction Date':
            importance = 60
        elif semantic == 'Currency':
            importance = 70
        elif semantic in ['Merchant Name', 'Merchant City', 'Merchant State']:
            importance = 70
        elif semantic == 'Customer Name':
            importance = 70
        elif semantic == 'Description':
            importance = 70
        elif semantic == 'Account Type':
            importance = 80
        
        # Adjust based on data type
        if data_type == 'numeric' and values:
            try:
                numeric_values = [float(str(v)) for v in values if v is not None]
                if numeric_values:
                    variance = float(np.var(numeric_values)) / max(1, float(np.mean([abs(v) for v in numeric_values])))
                    importance = min(100, max(50, int(importance + 20 * variance)))
            except (ValueError, TypeError):
                pass
        
        return importance

    async def get_user_label(self, user_id: int, column: str) -> Optional[str]:
        """Get user feedback for column labeling."""
        if not self.db:
            return None
        try:
            # TODO: Implement actual database query
            # res = await self.db.fetch(
            #     'SELECT suggested_label FROM label_feedback WHERE user_id=$1 AND column_name=$2 ORDER BY timestamp DESC LIMIT 1',
            #     user_id, column
            # )
            # return res[0]['suggested_label'] if res else None
            return None
        except Exception as e:
            print(f"Error fetching user label: {e}")
            return None

    async def llm_label_inference(self, column: str, values: List[Any], data_type: str, categorical_cols: Dict[str, set]) -> Optional[str]:
        """Use LLM to infer semantic label from column name and sample values with categorical context."""
        if not self.llm_client:
            return None
            
        prompt = f"""
        Given the column name '{column}', sample values {values}, data type '{data_type}',
        and categorical columns {json.dumps(categorical_cols)},
        suggest a financial label (e.g., Revenue, Expense, Account Balance, Transaction Type).
        Return only the label name, nothing else.
        """
        
        try:
            # TODO: Implement actual LLM call
            # response = await self.llm_client.generate(
            #     model='llama3.2:3b-q4_0', 
            #     prompt=prompt, 
            #     options={'num_gpu': 100, 'context_size': 512}
            # )
            # return response['response'].strip()
            
            # Placeholder for testing
            await asyncio.sleep(0.1)
            return None
        except Exception as e:
            print(f"LLM inference failed: {e}")
            return None

    def _is_numeric(self, value: str) -> bool:
        """Check if string represents a numeric value."""
        try:
            float(value)
            return True
        except:
            return False

    async def handle_feedback(self, user_id: int, column: str, label: str):
        """Store user feedback for label corrections."""
        if self.db:
            try:
                # TODO: Implement actual database storage
                # await self.db.execute(
                #     'INSERT INTO label_feedback (user_id, column_name, suggested_label, timestamp) VALUES ($1, $2, $3, NOW())',
                #     user_id, column, label
                # )
                print(f"User {user_id} suggested label '{label}' for column '{column}'")
            except Exception as e:
                print(f"Error storing user feedback: {e}")
        else:
            print(f"User {user_id} suggested label '{label}' for column '{column}'") 