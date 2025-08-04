#!/usr/bin/env python3
"""
Script to create missing Procurement Report tables in existing database
"""

import sqlite3
import os

def create_procurement_tables():
    # Database file path
    db_path = "./test.db"
    
    if not os.path.exists(db_path):
        print(f"Database file {db_path} not found!")
        return
    
    # Connect to the database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if tables already exist
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='procurement_reports'")
    if cursor.fetchone():
        print("Procurement tables already exist!")
        conn.close()
        return
    
    print("Creating Procurement Report tables...")
    
    # Create procurement_reports table
    cursor.execute("""
        CREATE TABLE procurement_reports (
            id VARCHAR NOT NULL,
            property_id VARCHAR NOT NULL,
            created_at DATETIME,
            updated_at DATETIME,
            PRIMARY KEY (id)
        )
    """)
    
    # Create procurement_plans table
    cursor.execute("""
        CREATE TABLE procurement_plans (
            id VARCHAR NOT NULL,
            report_id VARCHAR NOT NULL,
            "Plan_ID" VARCHAR,
            "Project_Department" VARCHAR,
            "Item_Service" VARCHAR,
            "Quantity" INTEGER,
            "Estimated_Cost" FLOAT,
            "Timeline_Start" VARCHAR,
            "Timeline_End" VARCHAR,
            "Priority" VARCHAR,
            "Responsible_Person" VARCHAR,
            "Status" VARCHAR,
            "Remarks" VARCHAR,
            PRIMARY KEY (id),
            FOREIGN KEY(report_id) REFERENCES procurement_reports (id)
        )
    """)
    
    # Create vendors table
    cursor.execute("""
        CREATE TABLE vendors (
            id VARCHAR NOT NULL,
            report_id VARCHAR NOT NULL,
            "Vendor_ID" VARCHAR,
            "Vendor_Name" VARCHAR,
            "Contact_Phone" VARCHAR,
            "Contact_Email" VARCHAR,
            "Category" VARCHAR,
            "Contract_Start_Date" VARCHAR,
            "Contract_End_Date" VARCHAR,
            "Performance_Rating" INTEGER,
            "Status" VARCHAR,
            "Responsible_Person" VARCHAR,
            "Remarks" VARCHAR,
            PRIMARY KEY (id),
            FOREIGN KEY(report_id) REFERENCES procurement_reports (id)
        )
    """)
    
    # Create purchase_orders table
    cursor.execute("""
        CREATE TABLE purchase_orders (
            id VARCHAR NOT NULL,
            report_id VARCHAR NOT NULL,
            "PR_PO_ID" VARCHAR,
            "Requisitioner" VARCHAR,
            "Item_Service" VARCHAR,
            "Quantity" INTEGER,
            "Requested_Date" VARCHAR,
            "Approved_Date" VARCHAR,
            "Purchase_Order_Date" VARCHAR,
            "Vendor_ID" VARCHAR,
            "Total_Cost" FLOAT,
            "Status" VARCHAR,
            "Responsible_Person" VARCHAR,
            "Remarks" VARCHAR,
            PRIMARY KEY (id),
            FOREIGN KEY(report_id) REFERENCES procurement_reports (id)
        )
    """)
    
    # Create goods_receipts table
    cursor.execute("""
        CREATE TABLE goods_receipts (
            id VARCHAR NOT NULL,
            report_id VARCHAR NOT NULL,
            "Receipt_ID" VARCHAR,
            "PO_ID" VARCHAR,
            "Item_Service" VARCHAR,
            "Quantity_Received" INTEGER,
            "Receipt_Date" VARCHAR,
            "Inspection_Date" VARCHAR,
            "Inspection_Result" VARCHAR,
            "Inspector" VARCHAR,
            "Storage_Location" VARCHAR,
            "Responsible_Person" VARCHAR,
            "Remarks" VARCHAR,
            PRIMARY KEY (id),
            FOREIGN KEY(report_id) REFERENCES procurement_reports (id)
        )
    """)
    
    # Create procurement_inventory_items table
    cursor.execute("""
        CREATE TABLE procurement_inventory_items (
            id VARCHAR NOT NULL,
            report_id VARCHAR NOT NULL,
            "Inventory_ID" VARCHAR,
            "Item_ID" VARCHAR,
            "Item_Name" VARCHAR,
            "Category" VARCHAR,
            "Current_Stock" INTEGER,
            "Unit" VARCHAR,
            "Location" VARCHAR,
            "Last_Updated" VARCHAR,
            "Responsible_Person" VARCHAR,
            "Remarks" VARCHAR,
            PRIMARY KEY (id),
            FOREIGN KEY(report_id) REFERENCES procurement_reports (id)
        )
    """)
    
    # Create payments table
    cursor.execute("""
        CREATE TABLE payments (
            id VARCHAR NOT NULL,
            report_id VARCHAR NOT NULL,
            "Payment_ID" VARCHAR,
            "PO_ID" VARCHAR,
            "Vendor_ID" VARCHAR,
            "Invoice_Number" VARCHAR,
            "Invoice_Amount" FLOAT,
            "Payment_Due_Date" VARCHAR,
            "Payment_Date" VARCHAR,
            "Payment_Status" VARCHAR,
            "Payment_Method" VARCHAR,
            "Responsible_Person" VARCHAR,
            "Remarks" VARCHAR,
            PRIMARY KEY (id),
            FOREIGN KEY(report_id) REFERENCES procurement_reports (id)
        )
    """)
    
    # Create procurement_documents table
    cursor.execute("""
        CREATE TABLE procurement_documents (
            id VARCHAR NOT NULL,
            report_id VARCHAR NOT NULL,
            "Document_ID" VARCHAR,
            "Project_PO_ID" VARCHAR,
            "Document_Type" VARCHAR,
            "Title" VARCHAR,
            "Created_Date" VARCHAR,
            "Author" VARCHAR,
            "Status" VARCHAR,
            "Storage_Location" VARCHAR,
            "Responsible_Person" VARCHAR,
            "Remarks" VARCHAR,
            PRIMARY KEY (id),
            FOREIGN KEY(report_id) REFERENCES procurement_reports (id)
        )
    """)
    
    # Create compliances table
    cursor.execute("""
        CREATE TABLE compliances (
            id VARCHAR NOT NULL,
            report_id VARCHAR NOT NULL,
            "Compliance_ID" VARCHAR,
            "Project_PO_ID" VARCHAR,
            "Policy_Regulation" VARCHAR,
            "Audit_Date" VARCHAR,
            "Auditor" VARCHAR,
            "Findings" VARCHAR,
            "Compliance_Status" VARCHAR,
            "Corrective_Actions" VARCHAR,
            "Next_Audit_Date" VARCHAR,
            "Remarks" VARCHAR,
            PRIMARY KEY (id),
            FOREIGN KEY(report_id) REFERENCES procurement_reports (id)
        )
    """)
    
    # Create analysis_reports table
    cursor.execute("""
        CREATE TABLE analysis_reports (
            id VARCHAR NOT NULL,
            report_id VARCHAR NOT NULL,
            "Analysis_Report_ID" VARCHAR,
            "Report_Type" VARCHAR,
            "Period_Start" VARCHAR,
            "Period_End" VARCHAR,
            "Metrics" VARCHAR,
            "Findings" VARCHAR,
            "Generated_Date" VARCHAR,
            "Responsible_Person" VARCHAR,
            "Status" VARCHAR,
            "Remarks" VARCHAR,
            PRIMARY KEY (id),
            FOREIGN KEY(report_id) REFERENCES procurement_reports (id)
        )
    """)
    
    # Create procurement_categories table
    cursor.execute("""
        CREATE TABLE procurement_categories (
            id VARCHAR NOT NULL,
            report_id VARCHAR NOT NULL,
            "Category_ID" VARCHAR,
            "Category_Name" VARCHAR,
            "Description" VARCHAR,
            "Budget_Allocation" FLOAT,
            "Items_Services" VARCHAR,
            "Responsible_Person" VARCHAR,
            "Status" VARCHAR,
            "Remarks" VARCHAR,
            PRIMARY KEY (id),
            FOREIGN KEY(report_id) REFERENCES procurement_reports (id)
        )
    """)
    
    # Commit changes
    conn.commit()
    conn.close()
    
    print("✅ Procurement Report tables created successfully!")

if __name__ == "__main__":
    create_procurement_tables() 