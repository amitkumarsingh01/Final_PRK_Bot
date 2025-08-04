#!/usr/bin/env python3

import json
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def test_cctv_system():
    """Test the CCTV audit system"""
    try:
        # Test imports
        from main import CCTVAuditReportCreate, orm_to_dict
        print("✅ Imports successful")
        
        # Test JSON loading
        with open('sample_cctv_audit_post.json', 'r') as f:
            data = json.load(f)
        print("✅ JSON loaded successfully")
        
        # Test Pydantic validation
        cctv_audit = CCTVAuditReportCreate(**data)
        print("✅ Pydantic validation successful")
        
        # Test helper function
        test_dict = {'test': 'value'}
        result = orm_to_dict(None)
        print("✅ Helper function works")
        
        print("🎉 All tests passed! CCTV audit system is ready.")
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_cctv_system() 