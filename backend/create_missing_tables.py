#!/usr/bin/env python3
"""
Script to create missing Procurement Report tables using SQLAlchemy
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from main import Base, ProcurementReport, ProcurementPlanning, VendorManagement, PurchaseRequisitionToOrder, GoodsReceiptAndInspection, InventoryAndStockManagement, PaymentTracking, ProcurementDocumentation, ComplianceAndPolicy, ReportingAndAnalysis, ProcurementCategory

def create_missing_tables():
    # Database URL
    DATABASE_URL = "sqlite:///./test.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    
    # Check if procurement_reports table exists
    with engine.connect() as conn:
        result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='procurement_reports'"))
        if result.fetchone():
            print("Procurement tables already exist!")
            return
    
    print("Creating missing Procurement Report tables...")
    
    # Create only the Procurement Report tables
    ProcurementReport.__table__.create(engine, checkfirst=True)
    ProcurementPlanning.__table__.create(engine, checkfirst=True)
    VendorManagement.__table__.create(engine, checkfirst=True)
    PurchaseRequisitionToOrder.__table__.create(engine, checkfirst=True)
    GoodsReceiptAndInspection.__table__.create(engine, checkfirst=True)
    InventoryAndStockManagement.__table__.create(engine, checkfirst=True)
    PaymentTracking.__table__.create(engine, checkfirst=True)
    ProcurementDocumentation.__table__.create(engine, checkfirst=True)
    ComplianceAndPolicy.__table__.create(engine, checkfirst=True)
    ReportingAndAnalysis.__table__.create(engine, checkfirst=True)
    ProcurementCategory.__table__.create(engine, checkfirst=True)
    
    print("✅ Procurement Report tables created successfully!")

if __name__ == "__main__":
    create_missing_tables() 