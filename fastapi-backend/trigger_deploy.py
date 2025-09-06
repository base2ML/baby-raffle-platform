#!/usr/bin/env python3
"""
Trigger deployment for Railway
"""
import os
import subprocess

# Run production server locally first to test
if __name__ == "__main__":
    print("🚀 Starting production server...")
    subprocess.run(["python", "production_server.py"])