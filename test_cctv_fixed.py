#!/usr/bin/env python3

import json
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

try:
    from main import CCTVAuditReportCreate
    print("✅ Successfully imported CCTVAuditReportCreate")
except Exception as e:
    print(f"❌ Import failed: {str(e)}")
    sys.exit(1)

def test_cctv_json():
    """Test the CCTV audit JSON structure"""
    try:
        # Load the JSON file
        with open('sample_cctv_audit_post.json', 'r') as f:
            data = json.load(f)
        
        print("✅ JSON file loaded successfully")
        
        # Validate against the Pydantic model
        cctv_audit = CCTVAuditReportCreate(**data)
        print("✅ JSON structure is valid!")
        print(f"Property ID: {cctv_audit.property_id}")
        print(f"Site Assessment Format items: {len(cctv_audit.CCTV_Audit.Site_Assessment_Format)}")
        print(f"Installation Checklist items: {len(cctv_audit.CCTV_Audit.Installation_Checklist)}")
        print(f"Configuration Testing items: {len(cctv_audit.CCTV_Audit.Configuration_Testing_Checklist)}")
        print(f"Daily Operations items: {len(cctv_audit.CCTV_Audit.Daily_Operations_Monitoring)}")
        print(f"Maintenance Schedule items: {len(cctv_audit.CCTV_Audit.Maintenance_Schedule)}")
        print(f"AMC Compliance items: {len(cctv_audit.CCTV_Audit.AMC_Compliance_Format)}")
        print(f"Camera Inventory items: {len(cctv_audit.CCTV_Audit.Documentation_Format.Camera_Inventory_Log)}")
        
        return True
        
    except Exception as e:
        print(f"❌ JSON validation failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_cctv_json() 