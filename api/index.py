import sys
import os

# Agregar backend al path para que los imports funcionen en Vercel
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.main import app
